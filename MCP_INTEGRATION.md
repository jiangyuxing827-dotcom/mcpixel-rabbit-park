# MCP 集成与真实调用验证

## 实际服务与工具

服务器：https://mcp.mcd.cn；Streamable HTTP；Authorization: Bearer 环境变量MCD_MCP_TOKEN。真实Token仅用于本次进程请求，未写入项目。

2026-10-25先成功initialize，再tools/list核验参数。实际调用如下，时间均为北京时间：

| 工具 | 参数 | 接口时间 | 结果 |
|---|---|---|---|
| list-nutrition-foods | {} | 2026-10-25 20:56:26 | success=true，code=200，isError=false；160条营养记录 |
| campaign-calendar | {} | 2026-10-25 20:56:29 | success=true，code=200，isError=false；导入26条活动 |

证据：data/list-nutrition-foods.json、data/campaign-calendar.json，包含调用时间、参数、业务结果和traceId；已移除订阅等用户状态，仅保留公开活动内容。

## 调用与导入流程

initialize → notifications/initialized → tools/list → tools/call。

优先读取structuredContent，不将说明性Markdown当作JSON。营养data实际为含列头的文本表格，按CSV行解析并检查声明的160条记录数；energyKcal用作kcal，不把energyKj误作热量。活动从data.dailyList[].events[]提取，标题兼容activityTitle与articleDto.title，不将空标题记录丢失。

官方记录保存在data/nutrition.json，菜单映射保存至data/menu.json，两个HTML同时更新内嵌快照。刷新命令：python3 fetch_menu.py。该脚本不调用下单、领券、兑换、抽奖或账户查询工具。

## 菜单匹配与业务价值

| 页面餐品 | 官方营养名称 | kcal |
|---|---|---|
| 麦辣鸡腿堡 | 麦辣鸡腿汉堡 | 485 |
| 麦香鸡 | 麦香鸡 | 369 |
| 双层吉士汉堡 | 双层吉士汉堡 | 429 |
| 薯条（中） | 中薯条 | 289 |
| 麦乐鸡（5块） | 麦乐鸡5块 | 213 |
| 可乐（中） | 可乐中杯 | 147 |
| 雪碧（中） | 雪碧中杯 | 105 |
| 香芋派 | 香芋派 | 232 |

热量排序和菜单展示现在可以使用这8款的官方营养值，蛋白质等字段同时展示。洋葱环与未明确口味的冰旋风不强行匹配，仍标“演示热量”。活动条展示官方返回的带日期活动。

## 验证边界

这是获取时的官方数据快照，不是网页持续实时连接。价格、库存、优惠、DIY食材和游戏属性仍属演示；未验证query-meals、query-store-coupons等工具，不宣称门店实时菜单已接入。所有结算均模拟。线上WorkBuddy分享版本尚未重新部署。

原先“尚无成功调用”的结论已由上述两次真实成功业务查询替代；历史开发记录中的失败描述仅指此前环境。
