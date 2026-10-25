#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""McPixel 数据抓取脚本：通过麦当劳中国 MCP（https://mcp.mcd.cn）拉取门店菜单、
营养成分与优惠活动，写入 data/menu.json，替换页面演示数据。

依赖：Python 3.9+ 标准库，无需安装第三方包。
Token：环境变量 MCD_MCP_TOKEN（申请地址 https://open.mcd.cn/mcp ）。

用法：
    export MCD_MCP_TOKEN="你的Token"
    python3 fetch_menu.py                          # 拉取菜单 + 营养 + 优惠 + 活动
    python3 fetch_menu.py --address "南京市江宁区xxx"  # 先按地址查附近门店
    python3 fetch_menu.py --dry-run                # 只保存原始响应，不生成 menu.json

遵守：麦当劳 MCP 服务规则，仅限中国大陆地区（不含港澳台）、非商业用途。
"""
import argparse
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

BASE_URL = "https://mcp.mcd.cn"
PROTOCOL_VERSION = "2025-06-18"


# ---------------------------------------------------------------- MCP 客户端
class MCPError(Exception):
    pass


class MCPClient:
    """最小 MCP Streamable HTTP 客户端（JSON-RPC 2.0 over HTTP POST）。"""

    def __init__(self, token, base_url=BASE_URL):
        if not token:
            raise MCPError("缺少 MCP Token：请先 export MCD_MCP_TOKEN=...")
        self.token = token
        self.base_url = base_url
        self.session_id = None
        self._id = 0

    def _post(self, payload, is_notification=False):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.base_url, data=body, method="POST")
        req.add_header("Authorization", "Bearer " + self.token)
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json, text/event-stream")
        req.add_header("MCP-Protocol-Version", PROTOCOL_VERSION)
        if self.session_id:
            req.add_header("mcp-session-id", self.session_id)
        try:
            resp = urllib.request.urlopen(req, timeout=90)
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", "replace")[:400]
            except Exception:
                pass
            if e.code == 401:
                raise MCPError("401 Token 无效、已过期或未提供，请检查 MCD_MCP_TOKEN")
            if e.code == 429:
                raise MCPError("429 触发限流（600 次/分钟），请稍后重试")
            raise MCPError("HTTP %s %s" % (e.code, detail))
        except urllib.error.URLError as e:
            raise MCPError("网络错误：%s" % e.reason)
        sid = resp.headers.get("mcp-session-id")
        if sid:
            self.session_id = sid
        raw = resp.read().decode("utf-8", "replace")
        if is_notification:
            return None
        return self._parse(raw)

    @staticmethod
    def _parse(raw):
        text = raw.strip()
        if text.startswith("{"):
            return json.loads(text)
        # SSE：取最后一条含 data: 的 JSON
        last = None
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("data:"):
                payload = line[5:].strip()
                if payload:
                    try:
                        last = json.loads(payload)
                    except json.JSONDecodeError:
                        pass
        if last is None:
            raise MCPError("无法解析 MCP 响应：%s" % raw[:300])
        return last

    def _rpc(self, method, params=None, is_notification=False):
        if is_notification:
            return self._post({"jsonrpc": "2.0", "method": method, "params": params or {}}, True)
        self._id += 1
        resp = self._post({"jsonrpc": "2.0", "id": self._id, "method": method, "params": params or {}})
        if "error" in resp:
            raise MCPError("%s -> %s" % (method, json.dumps(resp["error"], ensure_ascii=False)[:400]))
        return resp.get("result", {})

    def initialize(self):
        result = self._rpc("initialize", {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {},
            "clientInfo": {"name": "mcpixel-fetch", "version": "1.0"},
        })
        self._rpc("notifications/initialized", is_notification=True)
        return result

    def call_tool(self, name, arguments=None):
        result = self._rpc("tools/call", {"name": name, "arguments": arguments or {}})
        if isinstance(result, dict) and result.get("isError"):
            raise MCPError("工具 %s 返回错误" % name)
        if isinstance(result.get("structuredContent"), dict):
            return result["structuredContent"]
        texts = []
        for block in (result.get("content") or []):
            if isinstance(block, dict) and block.get("type") == "text":
                texts.append(block.get("text", ""))
        joined = "\n".join(texts).strip()
        try:
            return json.loads(joined)
        except (json.JSONDecodeError, ValueError):
            return {"_raw": joined}



from pathlib import Path
import re, csv, io

def nutrition_rows(payload):
    if payload.get("success") is False or payload.get("code") != 200:
        raise MCPError("营养接口未返回成功业务结果")
    data = payload.get("data")
    if not isinstance(data, str):
        raise MCPError("营养数据格式变化，需核验后再导入")
    lines = data.strip().splitlines()
    match = re.fullmatch(r"\[(\d+)\]\{([^}]+)\}:", lines[0])
    if not match:
        raise MCPError("不支持的营养文本格式")
    fields = match.group(2).split(",")
    rows = list(csv.DictReader(io.StringIO("\n".join(x.strip() for x in lines[1:])), fieldnames=fields))
    if len(rows) != int(match.group(1)):
        raise MCPError("营养记录数不匹配")
    for row in rows:
        for key in ["energyKj", "energyKcal", "protein", "fat", "carbohydrate", "sodium", "calcium"]:
            row[key] = float(row[key])
    return rows

ALIASES = {"麦辣鸡腿堡":"麦辣鸡腿汉堡", "薯条（中）":"中薯条", "麦乐鸡（5块）":"麦乐鸡5块", "可乐（中）":"可乐中杯", "雪碧（中）":"雪碧中杯"}

def apply_data(base, nutrition, calendar, timestamp):
    rows = nutrition_rows(nutrition)
    by_name = {r["productName"]:r for r in rows}
    matched = 0
    for item in base["items"]:
        row = by_name.get(ALIASES.get(item["name"], item["name"]))
        item["tags"] = [t for t in item.get("tags", []) if t not in ["官方营养", "演示热量"]]
        item["priceSource"] = "demo"
        if row:
            item["calories"] = row["energyKcal"]
            item["nutrition"] = {k:row[k] for k in ["protein","fat","carbohydrate","sodium","calcium"]}
            item["nutrition"]["calories"] = row["energyKcal"]
            item["nutritionSourceName"] = row["productName"]
            item["nutritionSource"] = "mcd-mcp:list-nutrition-foods"
            item["tags"].append("官方营养")
            matched += 1
        else:
            item["tags"].append("演示热量")
    campaigns=[]
    if calendar.get("code") == 200 and calendar.get("success") is not False:
        for day in calendar.get("data",{}).get("dailyList",[]):
            for event in day.get("events",[]):
                name=event.get("activityTitle") or event.get("articleDto",{}).get("title")
                if name:
                    campaigns.append({"name":name,"date":day.get("date","")})
    base["campaigns"]=campaigns
    base["deals"]=[]
    base["meta"].update(source="mixed",label="官方营养与活动快照 · 价格为演示",updatedAt=timestamp,store="未验证门店",mcdMcpConnected=False,nutritionMatched=matched,nutritionRecordCount=len(rows),note="官方营养与活动为抓取快照，非实时连接。价格、库存及未匹配营养为演示。")
    return base,rows

def embed(path, menu):
    text=path.read_text(encoding="utf-8")
    payload=json.dumps(menu,ensure_ascii=False).replace("<",r"\u003c")
    pattern=r'(<script[^>]*id="offline-menu"[^>]*>).*?(</script>)'
    text,count=re.subn(pattern,lambda m:m[1]+payload+m[2],text,count=1,flags=re.S)
    if count != 1: raise MCPError("找不到单文件菜单入口")
    path.write_text(text,encoding="utf-8")

def main():
    root=Path(__file__).resolve().parent
    token=os.environ.get("MCD_MCP_TOKEN", "")
    if not token:
        import getpass
        token=getpass.getpass("MCP Token（不回显）：")
    c=MCPClient(token)
    c.initialize()
    available=c._rpc("tools/list").get("tools",[])
    for name in ["list-nutrition-foods","campaign-calendar"]:
        spec=next((t for t in available if t.get("name")==name),None)
        if spec is None or spec.get("inputSchema",{}).get("required"):
            raise MCPError("工具定义变化："+name)
    nutrition=c.call_tool("list-nutrition-foods",{})
    calendar=c.call_tool("campaign-calendar",{})
    if calendar.get("code") != 200: raise MCPError("活动查询失败")
    timestamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).isoformat()
    base=json.loads((root/"data/menu.json").read_text(encoding="utf-8"))
    menu,rows=apply_data(base,nutrition,calendar,timestamp)
    (root/"data/menu.json").write_text(json.dumps(menu,ensure_ascii=False,indent=2),encoding="utf-8")
    (root/"data/nutrition.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding="utf-8")
    for file in ["index.html","麦麦兔一乐-单文件完整版.html"]:
        embed(root/file,menu)
    print("成功：%s 条营养记录，%s 个菜单匹配，%s 条活动；价格仍为演示。" % (len(rows),menu["meta"]["nutritionMatched"],len(menu["campaigns"])))

if __name__ == "__main__":
    try: main()
    except MCPError as e:
        print("失败："+str(e),file=sys.stderr)
        sys.exit(1)
