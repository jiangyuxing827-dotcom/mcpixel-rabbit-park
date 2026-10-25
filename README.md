# 麦门兔个乐

## 一句话介绍

当麦当劳遇上像素游戏，点餐也能变成一场冒险！叠汉堡、当店员、测麦门人格、玩小游戏，顺便收集一点薯条味的快乐。

## 作品说明

《麦门兔个乐》是一款融合 AI、像素艺术、趣味点餐与休闲游戏的互动应用。

我想让点餐这件普通的小事变得更有意思。所以设计了一只豆豆眼兔子，打造了一个可以自由探索的麦门像素世界。

你可以在这里 DIY 汉堡、无限叠加肉饼、自由搭配套餐；也可以体验麦当劳打工模拟、消消乐、切切乐、贪吃蛇、麦门人生和16型 MBTI 人格测试。不同游戏还会解锁专属皮肤、成就徽章和节日幸运物。

项目尝试结合麦当劳 MCP 服务与 AI 辅助开发，将实际餐饮信息、游戏互动和数字收藏连接起来，让点餐不再只是完成一次购买，而是一次有趣的探索。

**毕竟，人生已经够忙了，点个麦当劳总得图个乐吧！**

## 运行

Python 3.9+；浏览器支持 Canvas、Web Audio 和 localStorage。无需安装依赖。

```bash
python3 -m http.server 8000
```

打开 http://localhost:8000 。也可双击 `index.html` 或 `麦门兔个乐-单文件完整版.html`，index.html使用css/与js/模块；单文件版全部资源内联。

## 使用示例

进入菜单，查看带有“官方营养”的餐品；按热量排序、加入餐盘，或进入 DIY 汉堡和游戏厅。结算仅为模拟。

## MCP 实际验证

2026-10-25 北京时间20:56，已成功调用官方 `https://mcp.mcd.cn` 的 `list-nutrition-foods` 和 `campaign-calendar`，两者均返回业务码200、success=true、isError=false。

- 返回160条营养记录，8款当前菜单餐品匹配成功。
- 导入26条带日期的活动记录，含接口返回的后续日期活动。
- 营养、活动为获取时的数据快照；页面不持有Token，也不实时请求MCP。
- 所有价格、库存与未匹配营养仍为演示；未验证门店菜单、优惠券或真实下单。

详情和脱敏调用证据见 `MCP_INTEGRATION.md` 与 `data/`。

## 刷新官方数据

```bash
python3 fetch_menu.py
```

脚本优先读取环境变量 `MCD_MCP_TOKEN`；未设置则通过隐藏输入提示读取。不要将真实Token提交至GitHub。脚本检查真实工具定义，调用两个只读工具，解析实际返回格式，更新JSON及两个HTML的内嵌数据。

## 文件

- index.html / 麦门兔个乐-单文件完整版.html：完整可运行入口。
- fetch_menu.py：Python标准库MCP查询与导入脚本。
- data/menu.json：混合来源菜单；data/nutrition.json：160条官方营养记录。
- data/list-nutrition-foods.json / data/campaign-calendar.json：脱敏查询证据。
- CONTEST_DECLARATION.md：保留原上传文件，未修改。
- MCP_INTEGRATION.md / mcp-config.example.json / workbuddy.md：参赛说明、占位配置、历史开发记录。

## 部署状态与验证限制

本仓库基于2026-10-25当前已发布的WorkBuddy新版，保留新版work.js、match.js、mbti.js，补入真实MCP快照与来源标记。原WorkBuddy分享版不含本次补入数据及改名；仓库与单文件版包含更新。

原WorkBuddy体验：https://mcpixel-rabbit-park.app.workbuddy.host/?sharecode=Q7HKN65F6A

项目源码：https://github.com/jiangyuxing827-dotcom/mcpixel-rabbit-park

本次完成营养解析与映射断言、JSON检查、内联JavaScript语法检查。未执行真机交互回归，不将历史178项测试视为本包已执行的测试。

## 最新版来源

打工日记、消消乐、人格测试来自当前已发布WorkBuddy版本，与先前上传包不同；未用旧模块覆盖。当前提交名称为《麦门兔个乐》。
