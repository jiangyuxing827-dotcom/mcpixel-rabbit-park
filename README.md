# 麦门兔个乐

## 一句话介绍

当麦当劳遇上像素游戏，点餐不再只是点餐——叠一座汉堡高塔、玩一局薯条贪吃蛇、收集流星与兔兔徽章，把每一顿快乐都变成可以收藏的冒险。

## 作品说明

《麦门兔个乐》是一款融合像素艺术、游戏化交互与个性化点餐的创意互动应用，以「让点餐成为一场有趣的冒险」为核心理念，重新构想年轻人与快餐品牌之间的互动方式。

作品以原创豆豆眼兔子为视觉主角，构建奶油黄与星夜蓝交织的复古像素世界。用户不仅可以自由 DIY 汉堡、无限叠加肉饼、搭配特色酱料和创意套餐，还能参与「麦门人生模拟器」「麦麦贪吃蛇」等趣味小游戏。

我们将消费行为转化为游戏中的成长与收集体验：不同套餐可以解锁专属角色皮肤，完成挑战能够获得「薯条大王」等成就徽章，节日限定奖励则被永久珍藏在个人收藏墙中。兔子造型餐盒、动态流星和隐藏彩蛋进一步强化了探索的惊喜感。

作品尝试突破传统点餐系统以效率为中心的单一交互逻辑，让个性化选择、即时反馈、情绪价值与数字收藏形成完整闭环。

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
