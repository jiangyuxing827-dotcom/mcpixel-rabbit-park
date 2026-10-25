/* =========================================================
 * McPixel · 数据层
 * 一、菜单数据（演示数据 + mcd-mcp 适配入口）
 * 二、DIY 汉堡食材 / 薯条酱料 / 脆汁鸡桶 / M兔子盒
 * 三、贪吃蛇皮肤与地图主题
 * 四、麦麦星际收藏馆徽章图鉴
 * 五、麦门人生模拟器（身份 / 事件 / 结局 / 流星命运）
 * ========================================================= */

/* =========================================================
 * 一、菜单数据
 *    数据来源优先级：data/menu.json（HTTP 环境） > 内置演示数据
 * ========================================================= */
var DEMO_MENU = {
  meta: { source:"demo", label:"演示数据", updatedAt:"2026-10-24", store:"示例门店（未指定）", mcdMcpConnected:false },
  items: [
    { id:"m1", name:"麦辣鸡腿堡",   price:22, calories:520, category:"主食", tags:["辣"],   art:"burger" },
    { id:"m2", name:"麦香鸡",       price:15, calories:400, category:"主食", tags:[],       art:"burger" },
    { id:"m3", name:"双层吉士汉堡", price:25, calories:590, category:"主食", tags:[],       art:"burger2" },
    { id:"s1", name:"薯条（中）",   price:12, calories:330, category:"小食", tags:["人气"], art:"fries" },
    { id:"s2", name:"麦乐鸡（5块）",price:13, calories:250, category:"小食", tags:[],       art:"nuggets" },
    { id:"s3", name:"洋葱环",       price:11, calories:210, category:"小食", tags:[],       art:"rings" },
    { id:"d1", name:"可乐（中）",   price:10, calories:180, category:"饮料", tags:[],       art:"cup" },
    { id:"d2", name:"雪碧（中）",   price:10, calories:170, category:"饮料", tags:[],       art:"cup" },
    { id:"t1", name:"冰旋风",       price:16, calories:390, category:"甜品", tags:[],       art:"swirl" },
    { id:"t2", name:"香芋派",       price:9,  calories:230, category:"甜品", tags:[],       art:"pie" }
  ]
};

/* mcd-mcp / 外部菜单 → 内部结构的字段映射 */
var NUT_KEYS = { calories:"能量", protein:"蛋白", fat:"脂肪", carbohydrate:"碳水", sodium:"钠", calcium:"钙" };
var NUT_UNIT = { calories:"kcal", protein:"g", fat:"g", carbohydrate:"g", sodium:"mg", calcium:"mg" };
function nutLine(n){
  var parts = [];
  for(var k in NUT_KEYS){
    if(k === "calories") continue;
    if(n[k] !== undefined && n[k] !== null && n[k] !== ""){
      parts.push(NUT_KEYS[k] + " " + n[k] + (NUT_UNIT[k] || ""));
    }
  }
  return parts.join(" · ");
}
function mapMcpItem(x, i){
  var name = String(x.name || "未命名");
  var item = {
    id: String(x.id || x.code || ("item" + i)),
    name: name,
    price: Number(x.price) || 0,
    calories: Number(x.calories) || 0,
    category: String(x.category || "其他"),
    tags: Array.isArray(x.tags) ? x.tags.map(String) : [],
    art: x.art || guessArt(name, x.category)
  };
  if(x.code) item.code = String(x.code);
  var n = x.nutrition || x.nutritionInfo || null;
  if(n && typeof n === "object"){
    var nut = {};
    for(var k in NUT_KEYS){
      var v = n[k];
      if(v === undefined && k === "calories") v = n.energy !== undefined ? n.energy : n.kcal;
      if(v !== undefined && v !== null && v !== "") nut[k] = v;
    }
    if(Object.keys(nut).length) item.nutrition = nut;
  }
  return item;
}
function guessArt(name, category){
  var n = String(name || "");
  if(/薯|fries/i.test(n)) return "fries";
  if(/堡|汉堡|burger|巨无霸|big ?mac/i.test(n)) return /双|双层|吉士|巨无霸|big ?mac/i.test(n) ? "burger2" : "burger";
  if(/乐鸡|鸡块|nugget/i.test(n)) return "nuggets";
  if(/翅|腿|炸鸡/i.test(n)) return "drumstick";
  if(/洋葱| rings/i.test(n)) return "rings";
  if(/派|pie/i.test(n)) return "pie";
  if(/冰|旋|冰淇淋|雪糕|swirl/i.test(n)) return "swirl";
  if(/饮|可乐|汽水|雪碧|咖啡|茶|cup|drink/i.test(n) || category === "饮料") return "cup";
  return "burger";
}
function normalizeMenu(json){
  var meta = json && json.meta ? json.meta : {};
  var items = json && Array.isArray(json.items) ? json.items : [];
  return {
    meta: {
      source: meta.source || "demo",
      label: meta.label || (meta.source === "mcp" ? "MCP 实时数据" : "演示数据"),
      updatedAt: meta.updatedAt || "未知",
      store: meta.store || "未知门店",
      mcdMcpConnected: !!meta.mcdMcpConnected || meta.source === "mcp"
    },
    items: items.map(mapMcpItem),
    deals: Array.isArray(json.deals) ? json.deals : [],
    campaigns: Array.isArray(json.campaigns) ? json.campaigns : []
  };
}

/* =========================================================
 * 二、DIY 汉堡工坊食材
 *    art 为分层像素画；unit 价格 / 热量；max 单配料上限（肉饼除外）
 * ========================================================= */
var INGREDIENTS = [
  { id:"bunTop",    name:"芝麻面包顶", art:"bunTop",    price:3,  cal:130, max:1,  group:"面包" },
  { id:"bunBottom", name:"面包底",     art:"bunBottom", price:2,  cal:110, max:1,  group:"面包", fixed:true },
  { id:"patty",     name:"牛肉饼",     art:"patty",     price:9,  cal:190, max:99, group:"肉饼", core:true },
  { id:"pattyChicken",name:"鸡肉饼",   art:"pattyChicken",price:8, cal:160, max:99, group:"肉饼", core:true },
  { id:"cheese",    name:"芝士片",     art:"cheese",    price:2,  cal:60,  max:6,  group:"配料" },
  { id:"lettuce",   name:"生菜",       art:"lettuce",   price:1,  cal:10,  max:4,  group:"配料" },
  { id:"tomato",    name:"番茄片",     art:"tomato",    price:2,  cal:12,  max:4,  group:"配料" },
  { id:"egg",       name:"太阳蛋",     art:"egg",       price:3,  cal:95,  max:2,  group:"配料" },
  { id:"pickle",    name:"酸黄瓜",     art:"pickle",    price:1,  cal:6,   max:4,  group:"配料" },
  { id:"onion",     name:"洋葱圈",     art:"onion",     price:1,  cal:12,  max:3,  group:"配料" },
  { id:"bacon",     name:"培根",       art:"bacon",     price:4,  cal:95,  max:5,  group:"配料" },
  { id:"sauce",     name:"酱料",       art:"sauceDrip", price:1,  cal:45,  max:3,  group:"酱料" }
];
var ING_BY_ID = {};
INGREDIENTS.forEach(function(x){ ING_BY_ID[x.id] = x; });

/* 汉堡彩蛋称号（按牛肉饼+鸡肉饼总数） */
var PATTY_TITLES = [
  { at:20, title:"麦门传说",   cls:"legend", line:"二十层肉饼！传说级麦门建筑，建议拍照留念。" },
  { at:10, title:"肉饼摩天楼", cls:"epic",   line:"十层肉饼拔地而起，M兔子看呆了！" },
  { at:5,  title:"汉堡建筑师", cls:"epic",   line:"五层起步，你已获得汉堡建筑师称号！" }
];

/* =========================================================
 * 三、薯条酱料实验室
 * ========================================================= */
var SAUCES = [
  { id:"ketchup",  name:"番茄酱",     price:0, cal:20,  color:"#D8262C", art:"sauceCup", palette:{ s:"#D8262C" } },
  { id:"garlic",   name:"蒜香蛋黄酱", price:2, cal:90,  color:"#F4E3B2", art:"sauceCup", palette:{ s:"#F4E3B2" } },
  { id:"honey",    name:"蜂蜜芥末酱", price:2, cal:70,  color:"#F0B429", art:"sauceCup", palette:{ s:"#F0B429" } },
  { id:"cheese",   name:"芝士酱",     price:3, cal:120, color:"#FFC72C", art:"sauceCup", palette:{ s:"#FFC72C" } },
  { id:"bbq",      name:"烧烤酱",     price:2, cal:60,  color:"#8B5A2B", art:"sauceCup", palette:{ s:"#8B5A2B" } },
  { id:"sweetchili",name:"甜辣酱",    price:2, cal:55,  color:"#F08A24", art:"sauceCup", palette:{ s:"#F08A24" } }
];
var SAUCE_BY_ID = {};
SAUCES.forEach(function(x){ SAUCE_BY_ID[x.id] = x; });
var FRIES_BASE = { price:12, cal:330 }; /* 薯条（中）基础款 */

/* =========================================================
 * 四、脆汁鸡桶 & M兔子盒
 * ========================================================= */
var CHICKEN_PARTS = [
  { id:"leg",    name:"鸡腿", art:"leg",    price:9, cal:220 },
  { id:"wing",   name:"鸡翅", art:"wing",   price:7, cal:150 },
  { id:"breast", name:"鸡胸块",art:"breast", price:8, cal:180 }
];
var PART_BY_ID = {};
CHICKEN_PARTS.forEach(function(x){ PART_BY_ID[x.id] = x; });

var BUCKET_SIZES = [
  { id:"s", name:"小份桶", pieces:4,  price:32, note:"一人小满足" },
  { id:"m", name:"标准桶", pieces:6,  price:45, note:"两人刚刚好" },
  { id:"l", name:"分享桶", pieces:9,  price:62, note:"派对分享装" },
  { id:"xl",name:"狂欢桶", pieces:12, price:78, note:"全员管饱" }
];
var BUCKET_ADDONS = [
  { id:"nuggets", name:"麦乐鸡（5块）", price:13, cal:250, art:"nuggets", max:4 },
  { id:"fries",   name:"薯条（中）",    price:12, cal:330, art:"fries",   max:4 },
  { id:"drink",   name:"可乐（中）",    price:10, cal:180, art:"cup",     max:6 }
];
var BUCKET_BOX_FEE = 3; /* M兔子盒包装费 */

/* M兔子盒规格（单人餐盒 / 双人分享盒 / 脆汁鸡桶分享盒） */
var BUNNY_BOXES = [
  { id:"solo",   name:"单人餐盒",     spec:"solo",   boxPrice:6,  content:["主食 ×1","小食 ×1","饮品 ×1"], arts:["burger","fries","cup"] },
  { id:"duo",    name:"双人分享盒",   spec:"duo",    boxPrice:10, content:["主食 ×2","小食 ×2","饮品 ×2"], arts:["burger","nuggets","cup"] },
  { id:"bucket", name:"鸡桶分享盒",   spec:"bucket", boxPrice:14, content:["炸鸡自由组合","配餐 ×3","酱料 ×2"], arts:["leg","fries","sauceCup"] }
];

/* =========================================================
 * 五、贪吃蛇皮肤
 *    head / body 为像素行；palette 供 SVG 与 canvas 共用
 * ========================================================= */
var SNAKE_SKINS = [
  { id:"classic", name:"麦香蛇", desc:"初始皮肤 · 金黄条纹", cond:"默认拥有",
    pal:{ g:"#FFC72C", G:"#F4A340", k:"#2A1B14" },
    head:["..gggggg..",".gggggggg.","gkggggggkg","gggggggggg",".gggggggg.",".gggggggg.","..gggggg..","...gggg...","....gg....",".........."],
    body:["gggggggggg","gggggggggg","GGGGGGGGGG","GGGGGGGGGG","gggggggggg","gggggggggg","GGGGGGGGGG","GGGGGGGGGG"] },
  { id:"bunny", name:"M兔子蛇", desc:"兔耳飘飘的吉祥物蛇", cond:"与页面上的 M兔子打招呼（点击它）",
    pal:{ w:"#FFF7E8", k:"#5F4531", p:"#F6CED8" },
    head:["..w....w..","..ww..ww..","..wwwwww..","..wwwwww..",".wkwwwwkw.",".wwwwwwww.",".wwwwwwww.",".wpwwwwpw.","..wwwwww..","...wwww..."],
    body:["wwwwwwwwww","wwwwwwwwww","wwppwwwwww","wwwwwwwwww","wwwwwwppww","wwwwwwwwww","wwwwwwwwww","wwppwwwwww"] },
  { id:"star", name:"星星兔蛇", desc:"星夜蓝兔耳蛇", cond:"解锁徽章「流星守护兔」",
    pal:{ n:"#282B46", s:"#FFC72C", k:"#5F4531", y:"#FFC72C" },
    head:["..n....n..","..nn..nn..","..nnnnnn..","..nsnnnn..",".nknnnnkn.",".nnnnnnnn.",".nnnnnnnn.",".nynnnnyn.","..nnnnnn..","...nnnn..."],
    body:["nnnnnnnnnn","nnnnsnnnnn","nnnnnnnnnn","nsnnnnnnns","nnnnnnnnnn","nnnnsnnnnn","nnnnnnnnnn","nsnnnnnnns"] },
  { id:"fries", name:"黄金薯条蛇", desc:"咸香脆皮条纹", cond:"完成一次含薯条的模拟订单",
    pal:{ y:"#FFD54F", Y:"#F0B429", R:"#D8262C", r:"#A4121F", k:"#2A1B14" },
    head:["..yyyyyy..",".yyyyyyyy.","ykyyyyyyky","yyyyyyyyyy",".yyyyyyyy.",".yyyyyyyy.","..yyyyyy..","...yyyy...","....yy....",".........."],
    body:["yyyyyyyyyy","yyyyyyyyyy","RRyyyyyyRR","yyyyyyyyyy","yyyyyyyyyy","RRyyyyyyRR","yyyyyyyyyy","yyyyyyyyyy"] },
  { id:"king", name:"薯条大王蛇", desc:"头戴薯条皇冠", cond:"解锁徽章「薯条大王」",
    pal:{ y:"#FFD54F", Y:"#F0B429", R:"#D8262C", r:"#A4121F", k:"#5F4531" },
    head:["..y.y.y...","..yyyyyy..","..yyyyyy..","..yyyyyy..",".ykyyyyky.",".yyyyyyyy.",".yyyyyyyy.",".yyyyyyyy.","..yyyyyy..","...yyyyy.."],
    body:["yyyyyyyyyy","RyyyyyyyyR","yyyyyyyyyy","yyyyyyyyyy","RyyyyyyyyR","yyyyyyyyyy","yyyyyyyyyy","RyyyyyyyyR"] },
  { id:"bigmac", name:"兔兔汉堡蛇", desc:"芝麻面包头 + 兔耳 + 堡肉交替层叠", cond:"完成一次含巨无霸/双层吉士的模拟订单",
    pal:{ b:"#E8A85C", s:"#FFF3D0", c:"#FFC72C", p:"#8B5A2B", k:"#5F4531" },
    head:["..b....b..",".bsb..bsb.",".bbbbbbbb.","bbbbbbbbbb","..kkbbkk..","..pppppp..",
          "..cccccc..","..pppppp..","..bbbbbb..","...bbbb..."],
    body:["pppppppppp","cccccccccc","pppppppppp","bbbbbbbbbb","pppppppppp","cccccccccc","pppppppppp","bbbbbbbbbb"] },
  { id:"milkshake", name:"草莓奶昔兔蛇", desc:"粉嫩兔耳 +  swirl 身体", cond:"完成一次含甜品的模拟订单",
    pal:{ p:"#F6CED8", w:"#FFF7E8", k:"#5F4531" },
    head:["..p....p..","..pp..pp..","..pppppp..","..pppppp..",".pkpppppk.",".pppppppp.",".pppppppp.",".pwwppwwp.","..pppppp..","...pppp..."],
    body:["pppppppppp","wwwwwwwwww","pppppppppp","wwwwppwwww","pppppppppp","wwwwwwwwww","pppppppppp","wwwwppwwww"] },
  { id:"xmas", name:"圣诞限定兔蛇", desc:"节日限定 · 绿意暖暖", cond:"圣诞节期间解锁徽章「姜饼像素」",
    pal:{ g:"#388E3C", r:"#D8262C", k:"#5F4531", w:"#FFF7E8" },
    head:["..g....g..","..gg..gg..","..gggggg..","..gggggg..",".gkggggkg.",".gggggggg.",".gggggggg.",".grggggrg.","..gggggg..","...gggg..."],
    body:["gggggggggg","ggrrggrrgg","gggggggggg","gggggggggg","ggrrggrrgg","gggggggggg","gggggggggg","ggrrggrrgg"] },
  { id:"chef", name:"兔子厨师",   desc:"白帽 + 兔耳的厨房大师", cond:"麦麦切切乐高分 / 单局 3000 分以上",
    pal:{ w:"#FFF7E8", k:"#5F4531", p:"#F6CED8", c:"#FFC72C" },
    head:["..w....w..","..ww..ww..",".cccccccc.",".wwwwwwww.",".wkwwwwkw.",".wwwwwwww.",".wwwwwwww.",".wpwwwwpw.","..wwwwww..","...wwww..."],
    body:["wwwwwwwwww","wcccccccw","wwwwwwwwww","wwwwwwppww","wwwwwwwwww","wcccccccw","wwwwwwwwww","wwwwwwppww"] },
  { id:"matchef", name:"消除达人兔",desc:"星星环绕的连击大师", cond:"解锁徽章「消除大师」",
    pal:{ n:"#282B46", s:"#FFC72C", k:"#5F4531", w:"#FFF7E8" },
    head:["s.n....n.s","..nn..nn..","..nnnnnn..","..nkknnn..",".nknnnnkn.",".nnnnnnnn.",".nnnnnnnn.",".nwnnnnwn.","..nnnnnn..","...nnnn..."],
    body:["nnnnnnnnnn","nnsnnnnsnn","nnnnnnnnnn","snnnnnnnns","nnnnnnnnnn","nnsnnnnsnn","nnnnnnnnnn","snnnnnnnns"] }
];
var SKIN_BY_ID = {};
SNAKE_SKINS.forEach(function(s){ SKIN_BY_ID[s.id] = s; });

/* =========================================================
 * 六、贪吃蛇地图主题
 * ========================================================= */
var SNAKE_THEMES = [
  { id:"restaurant", name:"像素餐厅", bg:"#FBF0D8", grid:"rgba(118,89,60,.10)", foodTint:null, live:true },
  { id:"kitchen",   name:"麦当劳厨房", bg:"#E9E2D2", grid:"rgba(118,89,60,.14)", foodTint:null, live:true },
  { id:"friesFactory", name:"薯条工厂", bg:"#FFE9A8", grid:"rgba(244,163,64,.22)", foodTint:null, live:true },
  { id:"meteorNight", name:"流星夜空", bg:"#282B46", grid:"rgba(255,199,44,.10)", foodTint:null, meteor:true, live:true },
  { id:"halloween", name:"万圣夜市", bg:"#3A2E4E", grid:"rgba(255,199,44,.12)", foodTint:null, window:["10-20","11-02"], meteor:true },
  { id:"spring",    name:"新春餐厅", bg:"#F6D9D0", grid:"rgba(216,38,44,.12)", foodTint:null, window:["01-25","02-15"] }
];
var THEME_BY_ID = {};
SNAKE_THEMES.forEach(function(t){ THEME_BY_ID[t.id] = t; });

/* =========================================================
 * 七、麦麦星际收藏馆 · 徽章图鉴
 *    cat: food 食物成就 / game 游戏成就 / bunny 兔子系列 /
 *         festival 节日限定 / hidden 隐藏成就
 *    window: [起, 止] MM-DD；hidden: true 时未解锁显示 ???
 * ========================================================= */
var BADGES = [
  /* ---- 食物成就 ---- */
  { id:"first_add", name:"初来乍到",   icon:"star",     rarity:"★",   cat:"food", desc:"第一次把食物加入餐盘", cond:"在菜单中任意加入一款食物", flavor:"每一段冒险，都从第一口开始。" },
  { id:"checkout",  name:"任务完成",   icon:"trophy",   rarity:"★",   cat:"food", desc:"完成第一次模拟下单", cond:"完成一次模拟下单（确认任务）", flavor:" QUEST CLEAR！餐盘已备好。" },
  { id:"fries",     name:"薯条探险家", icon:"fries",    rarity:"★",   cat:"food", desc:"薯条 +1 工坊玩家",     cond:"在套餐工坊使用「薯条 +1」并加入餐盘", flavor:"最长的那根永远属于你。" },
  { id:"combo",     name:"组合大师",   icon:"medal",    rarity:"★★",  cat:"food", desc:"在套餐工坊完成一次组合", cond:"在套餐工坊完成任意自选套餐", flavor:"1+1 也能吃出满汉全席的排面。" },
  { id:"light",     name:"热量规划师", icon:"leaf",     rarity:"★★",  cat:"food", desc:"完成一单总热量 < 700 kcal", cond:"模拟下单且总热量低于 700 kcal", flavor:"自律的薯条，是自由的薯条。" },
  { id:"allcat",    name:"均衡一员",   icon:"heart",    rarity:"★★",  cat:"food", desc:"一单中凑齐主食、小食、饮料", cond:"同一订单包含主食、小食与饮料", flavor:"彩虹饮食，像素践行。" },
  { id:"cheese_lover",name:"芝士狂热者",icon:"cheese",  rarity:"★★",  cat:"food", desc:"DIY 汉堡加入 3 份芝士", cond:"在汉堡工坊制作含 3 份以上芝士的汉堡", flavor:"拉丝的长度，就是幸福的距离。" },
  { id:"patty_architect",name:"肉饼建筑师",icon:"bunBurgerIcon",rarity:"★★★",cat:"food",desc:"DIY 十层肉饼挑战达成", cond:"在汉堡工坊堆叠到 10 层及以上肉饼", flavor:"十层之高，一寸一寸都是信仰。" },
  { id:"sauce_scientist",name:"酱料科学家",icon:"flask", rarity:"★★",  cat:"food", desc:"集齐 6 种薯条蘸酱", cond:"在酱料实验室尝试过全部 6 种蘸酱", flavor:"科学的精神：每种酱都值得被尊重。" },
  { id:"fries_king",name:"薯条大王",   icon:"friesKing",rarity:"★★★",cat:"food",desc:"FRIES KING · 加冕之徽", cond:"在酱料实验室组合过至少 3 种蘸酱搭配，并完成一次薯条主题模拟订单", flavor:"从今天起，每一根薯条都是你的臣民。", king:true },

  /* ---- 游戏成就 ---- */
  { id:"snake_rookie",name:"贪吃蛇新星",icon:"snakeIcon",rarity:"★",  cat:"game", desc:"贪吃蛇单局 30 分", cond:"在麦麦贪吃蛇中单局得分达到 30", flavor:"新星升起的第一口。" },
  { id:"snake_master",name:"贪吃蛇冠军",icon:"trophy",  rarity:"★★★",cat:"game", desc:"贪吃蛇单局 100 分", cond:"在麦麦贪吃蛇中单局得分达到 100", flavor:"厨房之王，非你莫属。" },
  { id:"life_explorer",name:"命运探索者",icon:"recycle",rarity:"★★", cat:"game", desc:"收集 3 种人生结局", cond:"在麦门人生模拟器中解锁 3 个不同结局", flavor:"轮回的意义在于多活几种可能。" },
  { id:"life_god",    name:"麦门全收集", icon:"godIcon", rarity:"★★★★",cat:"game", desc:"收集全部人生结局", cond:"解锁麦门人生模拟器的全部结局", flavor:"你已阅尽麦门宇宙的每一种人生。" },

  /* ---- V2 新增 · 打工日记 / 切切乐 / 消消乐 ---- */
  { id:"chosen_fries",name:"天选薯条",   icon:"friesCrown",rarity:"★★★★",cat:"game",desc:"达成人生模拟器传奇结局", cond:"在麦门人生模拟器中达成「麦门之神」等传奇结局", flavor:"命运的薯条，选中了你。" },
  { id:"gold_staff",  name:"金牌店员",   icon:"cap",      rarity:"★★★", cat:"game",desc:"打工日记 10 次满分订单", cond:"在麦麦打工日记中累计交付 10 单三星评价", flavor:"托盘从不抖，微笑从不掉。" },
  { id:"work_manager",name:"麦麦店长",   icon:"chest",    rarity:"★★★★",cat:"game",desc:"晋升为麦麦店长", cond:"在麦麦打工日记中晋升至店长", flavor:"钥匙串上，挂着整家店的清晨。" },
  { id:"fries_saint", name:"薯条剑圣",   icon:"fries",    rarity:"★★★", cat:"game",desc:"切切乐累计切开 100 根薯条", cond:"在麦麦切切乐中累计切开 100 根薯条", flavor:"一刀下去，薯条整齐如队列。" },
  { id:"slice_combo", name:"连击大师",   icon:"trophy",   rarity:"★★",  cat:"game",desc:"切切乐最高连击达到 12", cond:"在麦麦切切乐中达成 12 连击", flavor:"刀光过处，全是节拍。" },
  { id:"match_master",name:"消除大师",   icon:"star",     rarity:"★★",  cat:"game",desc:"消消乐单局达到 3000 分", cond:"在麦麦消消乐中单局得分达到 3000", flavor:"连锁在手，天下我有。" },
  { id:"fries_storm", name:"薯条风暴",   icon:"fries",    rarity:"★★★", cat:"game",desc:"单局触发 5 次薯条炸弹", cond:"在麦麦消消乐单局内触发 5 次薯条炸弹", flavor:"金色的雨，落满了整块棋盘。" },
  { id:"meteor_collector",name:"流星收藏家",icon:"comet",  rarity:"★★★", cat:"game",desc:"累计触发 10 次流星甜筒", cond:"累计在麦麦消消乐中触发 10 次流星甜筒", flavor:"你把流星，一颗颗装进口袋。" },
  { id:"lucky_star",  name:"兔兔幸运星", icon:"crown",    rarity:"★★★", cat:"game",desc:"连续通关 5 个关卡", cond:"在麦麦消消乐经典闯关中连续通关 5 关", flavor:"兔子抬起爪子，星星就落下来。" },
  { id:"match_god",   name:"麦门消除之神",icon:"godIcon", rarity:"★★★★",cat:"game",desc:"通关首批全部关卡且每关 ≥2 星", cond:"完成消消乐全部 5 关，且每关星级不低于 2 星", flavor:"棋盘之上，再无对手。" },

  /* ---- V2.6 麦门人格研究所 ---- */
  { id:"mbti_first",    name:"麦门自我探索者", icon:"bunnyWave", rarity:"★★", cat:"game", desc:"首次完成全部人格测试", cond:"完成一次麦门人格研究所测试", flavor:"你终于知道自己是哪一种汉堡了。" },
  { id:"mbti_researcher",name:"人格研究员",   icon:"bunnySurprise", rarity:"★★★", cat:"game", desc:"体验多种不同的人格结果", cond:"累计测出 3 种以上不同人格", flavor:"同一个人，也可以有很多种吃法。" },
  { id:"mbti_social",   name:"麦门社交观察员", icon:"bunnyJump", rarity:"★★★", cat:"game", desc:"尝试十种人格配对", cond:"在人格配对实验室累计生成 10 组配对", flavor:"你观察的不是人，是点餐顺序。" },
  { id:"mbti_psych",    name:"兔兔心理学家",  icon:"bunnySad", rarity:"★★★★",cat:"game", desc:"阅读全部 16 种人格介绍", cond:"在人格图鉴中读完全部 16 型人格", flavor:"兔子表示：样本量还是太小。" },
  { id:"mbti_philos",   name:"汉堡哲学家",    icon:"burger",    rarity:"★★★", cat:"food", desc:"创造属于自己的专属人格汉堡", cond:"把人格套餐导入 DIY 工坊进行创作", flavor:"我思，故我在汉堡里。" },

  /* ---- 兔子系列 ---- */
  { id:"bunny_first", name:"初见 M兔",  icon:"bunny",   rarity:"★",   cat:"bunny",desc:"与 M兔子第一次互动", cond:"点击页面上的 M兔子（任意一只）", flavor:"它等这一刻很久了。" },
  { id:"bunny_meteor",name:"流星守护兔",icon:"comet",   rarity:"★★",  cat:"bunny",desc:"触发一次流星命运事件", cond:"在麦门人生模拟器中触发流星命运事件", flavor:"流星划过时，兔子替你许了愿。" },
  { id:"bunny_gold",  name:"金色兔王",  icon:"kingCrown",rarity:"★★★",cat:"bunny",desc:"徽章收集达到 10 枚", cond:"累计解锁 10 枚徽章", flavor:"皇冠很轻，荣誉很重。" },

  /* ---- 节日限定 ---- */
  { id:"spring_red",  name:"红包汉堡",   icon:"redPack", rarity:"★★★",cat:"festival",desc:"春节限定", cond:"春节期间完成一次模拟订单", flavor:"新年第一口，红包味。", window:["01-25","02-15"], theme:"spring" },
  { id:"valentine",   name:"爱心薯条",   icon:"heartFries",rarity:"★★★",cat:"festival",desc:"情人节限定", cond:"情人节期间完成一次 1+2 分享套餐", flavor:"两根薯条，一把抓。", window:["02-10","02-16"], theme:"valentine" },
  { id:"children",    name:"彩虹麦麦角色卡",icon:"rainbow",rarity:"★★", cat:"festival",desc:"儿童节限定", cond:"儿童节期间游玩任意小游戏", flavor:"童心是最高清的像素。", window:["05-28","06-03"], theme:"children" },
  { id:"halloween_fries",name:"幽灵薯条",icon:"ghostFries",rarity:"★★★",cat:"festival",desc:"万圣节限定", cond:"万圣节期间完成含薯条的订单", flavor:"不给糖，就捣蛋式加盐。", window:["10-20","11-02"], theme:"halloween" },
  { id:"halloween_burger",name:"南瓜汉堡",icon:"pumpkin",rarity:"★★★",cat:"festival",desc:"万圣节限定", cond:"万圣节期间在汉堡工坊制作任意汉堡", flavor:"南瓜灯里炖着肉饼。", window:["10-20","11-02"], theme:"halloween" },
  { id:"christmas",   name:"姜饼像素",   icon:"ginger",  rarity:"★★★",cat:"festival",desc:"圣诞节限定", cond:"圣诞节期间完成含甜品的订单", flavor:"姜饼会融化，像素不会。", window:["12-18","12-26"], theme:"christmas" },
  { id:"anniversary", name:"复古餐厅纪念金币",icon:"jukebox",rarity:"★★",cat:"festival",desc:"周年庆限定", cond:"周年庆期间完成一次模拟订单", flavor:"老点唱机里放着去年的薯条香。", window:["10-24","10-31"], theme:"retro" },

  /* ---- 隐藏成就 ---- */
  { id:"hidden_midnight",name:"午夜食客", icon:"mystery", rarity:"★★★",cat:"hidden",desc:"???", cond:"在凌晨 0 点到 6 点之间打开页面", flavor:"深夜的薯条，是另一番滋味。", hidden:true },
  { id:"hidden_bunny10", name:"兔子密友", icon:"mystery", rarity:"★★", cat:"hidden",desc:"???", cond:"与 M兔子互动 10 次", flavor:"它已经记住你的名字了。", hidden:true },
  { id:"hidden_stack30", name:"肉饼航天飞机",icon:"mystery",rarity:"★★★★",cat:"hidden",desc:"???", cond:"单次制作 30 层及以上肉饼", flavor:"这一口，已经脱离大气层。", hidden:true },
  { id:"hidden_king2",   name:"薯条大臣", icon:"mystery", rarity:"★★★",cat:"hidden",desc:"???", cond:"加冕薯条大王后，再完成一次薯条主题订单", flavor:"大王在上，大臣在下，薯条在中间。", hidden:true }
];
var BADGE_BY_ID = {};
BADGES.forEach(function(b){ BADGE_BY_ID[b.id] = b; });

/* 徽章分类（收藏馆分组） */
var BADGE_CATS = [
  { id:"food",     name:"食物成就", icon:"burger" },
  { id:"game",     name:"游戏成就", icon:"trophy" },
  { id:"bunny",    name:"兔子系列", icon:"bunny" },
  { id:"festival", name:"节日限定", icon:"lantern" },
  { id:"hidden",   name:"隐藏成就", icon:"mystery" }
];

/* =========================================================
 * 八、麦门人生模拟器
 * ========================================================= */
var LIFE_IDENTITIES = [
  { id:"noble",    name:"薯条贵族",   art:"friesCrown",   desc:"天生自带盐分光环", attr:{ wealth:3, happy:1 }, line:"你出生在一根巨大的薯条顶端，侍从是七根长短不一的兄弟。" },
  { id:"builder",  name:"汉堡建筑师", art:"architect",    desc:"肉饼即砖块",       attr:{ full:3, wealth:1 }, line:"你的摇篮是未完工的第三层，乳牙咬动的第一样东西是芝士。" },
  { id:"mage",     name:"奶昔魔法师", art:"milkshakeMage",desc:"掌握冰系咒语",     attr:{ luck:3, happy:1 },   line:"你在冰淇淋机里学会了第一句咒语：「不要抖得太快」。" },
  { id:"adventurer",name:"麦乐鸡冒险家",art:"nuggetHat",  desc:"五块一包，说走就走", attr:{ happy:2, full:1, luck:1 }, line:"你的族群共有五块，你们约定：走散的人要在酱里重逢。" },
  /* ---- V2 新增身份（荒诞向） ---- */
  { id:"fries_dreamer", name:"普通薯条", art:"fries", desc:"梦想成为薯条大王", attr:{ luck:2, fame:1, wealth:1 },
    line:"你是一根长度平庸的薯条。旁边的薯条刚被升级成套餐主角——而你，立志加冕薯条大王。" },
  { id:"nugget", name:"不想被吃掉的麦乐鸡", art:"lastNugget", desc:"每一口都是倒计时", attr:{ luck:2, full:2, fame:1 },
    line:"你有五块兄弟，今天少了一块。你决定，在被蘸酱之前，先把这一生过得滚烫。" },
  { id:"heir", name:"汉堡继承人", art:"bunBurgerIcon", desc:"十层肉饼家产待继承", attr:{ wealth:4, full:2, fame:2 },
    line:"你的家族拥有十层肉饼的庞大遗产。遗嘱写着：继承前，必须先证明自己会拧开番茄酱。" },
  { id:"icemachine", name:"故障冰淇淋机", art:"swirl", desc:"总在关键时刻卡住", attr:{ luck:3, full:3, wealth:1 },
    line:"你是一台冰淇淋机。你的人生哲学很简单：不是坏了，只是在思考甜度的意义。" },
  { id:"newbie", name:"第一天上班的店员", art:"cap", desc:"一上岗就撞上高峰期", attr:{ fame:2, full:2, happy:1 },
    line:"今天是你的第一天。你还没学会绑围裙，门口已经排到了人流防线以外。" },
  { id:"manager_bunny", name:"想当餐厅经理的 M兔子", art:"bunnyWave", desc:"兔生目标是管理层", attr:{ fame:3, happy:2, luck:1 },
    line:"你是一只 M兔子，志向却在员工通道尽头的那间办公室。听说那里，全天供应胡萝卜味的支持。" }
];
/* V2 属性命名：财富 / 快乐 / 幸运 / 饱腹感 / 声望
   旧事件沿用 stamina / charm / mcd 三个键，这里做别名映射以复用既有文案 */
var LIFE_ATTRS = { wealth:"财富", happy:"快乐", luck:"幸运", full:"饱腹感", fame:"声望" };
var LIFE_ATTR_ALIAS = { stamina:"full", charm:"happy", mcd:"fame" };
function lifeAttrKey(k){ return LIFE_ATTR_ALIAS[k] || (LIFE_ATTRS[k] ? k : null); }

/* 身份专属事件池（按 identity.id 索引，抽取时优先塞入队列） */
var LIFE_IDENTITY_EVENTS = {
  fries_dreamer:[
    { id:"ex_fries", text:"今天你发现自己是一根薯条，但旁边的薯条已经升职成为套餐主角。你决定？", choices:[
      { t:"努力工作，争取成为薯条大王", gain:{ fame:2, wealth:1 }, r:"你把自己炸得笔直又金黄，油温记录官在报表上给你画了星。声望 +2。" },
      { t:"直接跳进番茄酱，提前退休", gain:{ full:3, fame:-1 }, r:"番茄酱的温度刚好。你感叹：这大概就是所谓「酸」适之境。饱腹感 +3。" },
      { t:"创办一家薯条咨询公司", gain:{ wealth:3, luck:-1 }, r:"公司名《一根之长》。三根薯条投了简历，你成了它们的导师。财富 +3。" } ] }
  ],
  nugget:[
    { id:"ex_nugget", text:"餐盒打开的一瞬间，光进来了。外面那只手，正伸向你。你决定？", choices:[
      { t:"勇敢跳回盒底", gain:{ luck:2, full:-1 }, r:"手抓走了你的兄弟。你活下来了，但再也没敢往外看。幸运 +2。" },
      { t:"主动滚进蘸酱", gain:{ fame:2, full:2 }, r:"你成了被记住的那一块——酸甜的那块。声望 +2。" },
      { t:"大声喊「我还活着」", gain:{ happy:2, luck:1 }, r:"没人听见，但你自己听得很清楚。快乐 +2。" } ] }
  ],
  heir:[
    { id:"ex_heir", text:"继承仪式要求：在十层肉饼面前，独立完成一次「拧开番茄酱」的考验。", choices:[
      { t:"一把拧到底", gain:{ wealth:2, fame:2 }, r:"酱汁泼上天花板，但律师确认：你拧开了。声望 +2。" },
      { t:"请厨师代拧", gain:{ wealth:1, fame:-1 }, r:"全场沉默三秒。遗产照给，但眼神变了。" },
      { t:"宣布弃权，把遗产改建公园", gain:{ happy:3, wealth:-2 }, r:"公园里种满了 parsley。孩子们很喜欢。快乐 +3。" } ] }
  ],
  icemachine:[
    { id:"ex_ice", text:"高峰期的第十五位顾客点了新地。你的压缩机发出了一声犹豫的叹息。", choices:[
      { t:"硬撑，出一杯带冰渣的", gain:{ full:2, fame:-1 }, r:"出品了，冰渣很多。顾客说：这才是有灵魂的新地。" },
      { t:"直接停机抗议", gain:{ luck:2, wealth:-1 }, r:"维修工踢了你一脚，但你争取到了四十分钟的尊严。幸运 +2。" },
      { t:"挤出最后一份完美的漩涡", gain:{ fame:3, full:-2 }, r:"那道漩涡被拍下来挂在员工墙上。声望 +3，但你空了。" } ] }
  ],
  newbie:[
    { id:"ex_newbie", text:"第一天上班就遇上高峰期。店长塞给你一顶帽子：「别慌，跟着我做。」", choices:[
      { t:"深呼吸，照做", gain:{ fame:2, full:1 }, r:"你撑过了第一波。店长把工时表往你这边挪了一格。声望 +2。" },
      { t:"先问清楚每一步再动", gain:{ wealth:1, luck:1 }, r:"慢了半拍，但零失误。财务部记住了你的名字。" },
      { t:"戴上帽子直接冲", gain:{ full:2, happy:2, luck:-1 }, r:"你像一颗刚出锅的薯条一样冲进人群。累，但痛快。快乐 +2。" } ] }
  ],
  manager_bunny:[
    { id:"ex_bunny", text:"员工大会宣布「今日最佳店员」，你竖起耳朵——念到的名字是别人。", choices:[
      { t:"鼓掌，然后申请管理培训", gain:{ fame:2, happy:1 }, r:"你把掌声拍得像流星习题。HR 记住了你。声望 +2。" },
      { t:"偷偷把奖状改了一个字", gain:{ luck:-1, wealth:1 }, r:"改得很像。但你一整晚没睡好。" },
      { t:"请那位最佳吃了顿薯条", gain:{ happy:2, full:1 }, r:"薯条是真诚的最佳翻译器。你们成了朋友。快乐 +2。" } ] }
  ]
};

/* 事件库：text 剧情，choices 每个选项含 gain/lose 与 result */
var LIFE_EVENTS = [
  { id:"e1", text:"早餐高峰，店长在广播里喊：「谁去前台支援一下？」", choices:[
    { t:"我去！（举手）", gain:{ stamina:-1, mcd:2 }, r:"你被派去发传单，路人夸你笑容标准，麦门值 +2。" },
    { t:"装没听见，继续擦桌子", gain:{ stamina:1 }, r:"桌子擦得能照出你的未来，体力 +1。" },
    { t:"推荐旁边那只兔子去", gain:{ charm:1, mcd:1 }, r:"M兔子前台大受欢迎，你的人脉 +1。" } ] },
  { id:"e2", text:"储物室发现一箱过期的优惠券，印刷日期是去年。", choices:[
    { t:"偷偷用掉一张", gain:{ wealth:1, luck:-1 }, r:"收银员盯着你看了三秒，居然过了。财富 +1，幸运 -1。" },
    { t:"上交店长", gain:{ mcd:2, wealth:-1 }, r:"店长在晨会上表扬了你，麦门值 +2。" },
    { t:"叠成纸飞机飞出窗外", gain:{ luck:2 }, r:"纸飞机绕过风扇，落进捐款箱。幸运 +2。" } ] },
  { id:"e3", text:"有顾客投诉：「我的汉堡里怎么只有一片生菜？」", choices:[
    { t:"现场补两片", gain:{ mcd:1, stamina:-1 }, r:"顾客感动得办了会员卡，麦门值 +1。" },
    { t:"解释这是轻食版", gain:{ charm:1 }, r:"顾客被你的专业说服，颜值 +1。" },
    { t:"把自己的生菜让给他", gain:{ mcd:2, stamina:-1 }, r:"「麦门雷锋」称号不胫而走。" } ] },
  { id:"e4", text:"深夜打烊，你听到冰淇淋机里传来微弱的歌声。", choices:[
    { t:"凑近听完整首", gain:{ luck:1, mcd:1 }, r:"是一首关于融化的诗，你湿了眼眶。" },
    { t:"报告店长", gain:{ mcd:1, stamina:-1 }, r:"店长说它只是排气，但你总觉得没那么简单。" },
    { t:"跟着一起唱", gain:{ charm:2, luck:-1 }, r:"第二天全店都在传你会通灵。颜值 +2。" } ] },
  { id:"e5", text:"外卖平台上你的一单备注写着：「请画一只兔子再送来。」", choices:[
    { t:"认真画了", gain:{ charm:2, mcd:1 }, r:"顾客给了五星好评和一幅回信涂鸦。" },
    { t:"画了，但画得很抽象", gain:{ luck:1 }, r:"顾客说这是后现代主义，幸运 +1。" },
    { t:"拒绝：这是食品，不是画布", gain:{ mcd:-1 }, r:"订单被取消了。麦门值 -1。" } ] },
  { id:"e6", text:"培训考试：请默写「麦麦省」三种优惠的叠加规则。", choices:[
    { t:"全背下来了", gain:{ wealth:1, mcd:1 }, r:"店长惊了，财务部想要你。" },
    { t:"只写了一半", gain:{ stamina:1 }, r:"及格万岁，体力 +1。" },
    { t:"在卷子上画了只兔子", gain:{ charm:1, luck:1 }, r:"改卷同事笑到通过，还给你加了分。" } ] },
  { id:"e7", text:"新品试吃会，有一份「神秘限定」没人敢动。", choices:[
    { t:"一口闷", gain:{ luck:2, stamina:-1 }, r:"是限量的快乐，幸运 +2。" },
    { t:"先让 M兔子试", gain:{ mcd:1 }, r:"兔子吃了直点头，兔子认证，靠谱。" },
    { t:"拍照发群里问", gain:{ charm:1 }, r:"群里刷了 99 条「求代吃」，颜值 +1。" } ] },
  { id:"e8", text:"你的工牌照片被误用成了招聘海报。", choices:[
    { t:"要求换成正装照", gain:{ charm:1 }, r:"新照片确实精神，颜值 +1。" },
    { t:"将错就错，收肖像费", gain:{ wealth:2 }, r:"你用这笔钱加了一顿薯条，财富 +2。" },
    { t:"请海报里的自己吃了顿好的", gain:{ mcd:1, stamina:1 }, r:"跨次元聚餐，圆满。" } ] },
  { id:"e9", text:"暴雨天，外卖箱里还有三单超时预警。", choices:[
    { t:"抄近路冲过去", gain:{ stamina:-2, wealth:2 }, r:"三单全救，打赏到账，体力 -2。" },
    { t:"打电话安抚顾客", gain:{ charm:2 }, r:"顾客说「不急，注意安全」，颜值 +2。" },
    { t:"先给自己买把伞", gain:{ luck:1, wealth:-1 }, r:"路上真下雨了，幸运 +1。" } ] },
  { id:"e10", text:"点餐机突然播放起十年前的广告歌。", choices:[
    { t:"跟着跳一段", gain:{ charm:2, stamina:-1 }, r:"小朋友跟着你跳，门店变成舞池。" },
    { t:"静静听完", gain:{ mcd:1, luck:1 }, r:"回忆杀让你眼眶发热，麦门值 +1。" },
    { t:"查是谁放的", gain:{ stamina:1 }, r:"是店长的怀旧 playlist，体力 +1。" } ] },
  { id:"e11", text:"后厨长老王说：「今晚有批薯条，油温不太对。」", choices:[
    { t:"坚持炸完，味道更脆", gain:{ wealth:1, luck:-1 }, r:"意外好吃，被列为隐藏菜单。" },
    { t:"倒掉重来", gain:{ mcd:2, stamina:-1 }, r:"损耗记你头上，但老王记你的好。" },
    { t:"加点盐掩盖一下", gain:{ charm:-1 }, r:"被吃出来了，颜值 -1。" } ] },
  { id:"e12", text:"积分商城上新，你差 300 分就能兑换限定周边。", choices:[
    { t:"加班冲分", gain:{ wealth:-1, stamina:-1, charm:1 }, r:"周边到手，你在镜子前笑了很久。" },
    { t:"找好友助力", gain:{ charm:1, luck:1 }, r:"好友们把链接转疯了，人品变现。" },
    { t:"算了，攒着养老", gain:{ wealth:2 }, r:"理性消费，财富 +2。" } ] },
  { id:"e13", text:"一只流浪猫蹲在门口，盯着菜单看。", choices:[
    { t:"请它吃一块麦乐鸡", gain:{ luck:2, wealth:-1 }, r:"猫走了，留下一枚亮晶晶的硬币。幸运 +2。" },
    { t:"给它画了份菜单", gain:{ charm:2 }, r:"猫把画带走了，据说裱在了某个纸箱里。" },
    { t:"抱回店里收养", gain:{ mcd:2, stamina:-1 }, r:"它成了门店编外保安，麦门值 +2。" } ] },
  { id:"e14", text:"公司年会抽奖，你的号码是 0325。", choices:[
    { t:"上台表演一个吞柠檬", gain:{ charm:2, wealth:1 }, r:"全场掌声雷动，还抽中了一箱薯条。" },
    { t:"安静如鸡", gain:{ stamina:1 }, r:"平安是福，体力 +1。" },
    { t:"把奖券送给旁边的兔子", gain:{ mcd:2, luck:1 }, r:"兔子中了三等奖，分你一半。" } ] },
  { id:"e15", text:"凌晨盘点，冰柜深处有一盒没人认领的汉堡。", choices:[
    { t:"贴上「失物招领」", gain:{ mcd:1 }, r:"第二天主人来领，非要加你微信。" },
    { t:"放进员工餐", gain:{ stamina:2, mcd:-1 }, r:"味道居然不错，体力 +2。" },
    { t:"给它起了名字养着", gain:{ luck:1, charm:1 }, r:"它陪了你整个旺季。" } ] },
  { id:"e16", text:"社交平台上你的吃播小号突然火了。", choices:[
    { t:"乘势更新", gain:{ wealth:2, stamina:-1 }, r:"广告邀约不断，但你开始怀念安静吃饭。" },
    { t:"停更保平安", gain:{ luck:1 }, r:"江湖仍有你的传说，幸运 +1。" },
    { t:"转型做测评", gain:{ charm:1, wealth:1 }, r:"「麦门米其林」栏目诞生了。" } ] },
  { id:"e17", text:"新员工把你认成了店长。", choices:[
    { t:"将错就错指导一天", gain:{ charm:1, stamina:-1 }, r:"新员工说你人很好，颜值 +1。" },
    { t:"澄清并请他喝可乐", gain:{ mcd:1 }, r:"可乐一开，误会尽消。" },
    { t:"顺势收徒", gain:{ wealth:1 }, r:"徒弟帮你打了三天卡，财富 +1。" } ] },
  { id:"e18", text:"电视里在放 16-bit 风格的麦当劳复古广告。", choices:[
    { t:"逐帧截图保存", gain:{ luck:1, mcd:1 }, r:"这套图后来成了你的传家宝。" },
    { t:"打电话给朋友一起看", gain:{ charm:1 }, r:"朋友说你是最有情怀的食客。" },
    { t:"学着广告跳起来", gain:{ stamina:-1, charm:2 }, r:"摔了一跤，但表情包火了。颜值 +2。" } ] },

  /* ================= V2 分支事件链 ================= */
  /* ---- 恋爱线：三个选项通向三条完全不同的后续剧情 ---- */
  { id:"e19", text:"甜品站新来的同事对你笑了笑：「要一起去看今晚的流星吗？」", tag:"love", choices:[
    { t:"去！顺便买两杯新地", gain:{ happy:2, luck:1 }, nextId:"lova", r:"她接过新地，勺子搅拌的速度说明了一切。" },
    { t:"假装在看菜单，假装听不见", gain:{ luck:1, fame:-1 }, nextId:"lovb", r:"菜单被你翻出了褶。她等了三秒，走了。" },
    { t:"介绍给我的好兄弟！", gain:{ fame:1, full:1 }, nextId:"lovc", r:"你拍了拍兄弟的肩，兄弟回头瞪了你一眼。" } ] },
  { id:"lova", text:"（恋爱续）天台上，流星真的来了。她问：「你许了什么愿？」", follow:true, choices:[
    { t:"「希望这一刻永远。」", gain:{ happy:3, luck:1 }, r:"她说她许了一样的愿。快乐 +3。" },
    { t:"「希望薯条永远免费。」", gain:{ wealth:2, happy:1 }, r:"她笑到流星都拐弯了。财富 +2。" },
    { t:"说实话：「我忘了许。」", gain:{ luck:2, happy:1 }, r:"她说：「那就补一个：谢谢你来。」幸运 +2。" } ] },
  { id:"lovb", text:"（孤独续）三个月后，她调去了别的门店。你在储物柜看到一张没写完的便签。", follow:true, choices:[
    { t:"把便签读完", gain:{ luck:2, happy:-1 }, r:"上面写着：「如果你那天回头——」后面被撕掉了。" },
    { t:"订车票去找她", gain:{ wealth:-2, happy:3, luck:1 }, r:"你在她门店门口站了十分钟，最后买了两个汉堡进去。" },
    { t:"把便签收进工牌夹层", gain:{ fame:1, luck:1 }, r:"它陪你度过了整个旺季，谁也没发现。" } ] },
  { id:"lovc", text:"（兄弟续）半年后，他和她结婚了。婚礼主桌留给你一个位置。", follow:true, choices:[
    { t:"上台致辞，全程高能吐槽", gain:{ fame:3, full:-1 }, r:"你的致辞被剪成了短视频，门店账号涨粉一万。声望 +3。" },
    { t:"默默吃完这顿饭", gain:{ full:3, happy:1 }, r:"十道菜你吃了九道，剩下的是给新人的。饱腹感 +3。" },
    { t:"包一个薯条形状的红包", gain:{ wealth:-1, fame:2, luck:1 }, r:"红包 Vegas 排队谅它的人排到了门口。" } ] },

  /* ---- 创业线 ---- */
  { id:"e20", text:"你攒够了一笔钱，同事怂恿你：「开家自己的汉堡店吧！」", tag:"biz", choices:[
    { t:"all in，辞职开店", gain:{ wealth:-3, luck:2 }, nextId:"biza", r:"你把工牌交了上去，手心全是汗。" },
    { t:"先摆个周末小推车试试", gain:{ wealth:1, full:-1 }, nextId:"bizb", r:"推车停在小区门口，第一天卖了七份。" },
    { t:"算了，投资兄弟的店", gain:{ wealth:2, luck:-1 }, nextId:"bizc", r:"你成了天使投资人，占股 8%。" } ] },
  { id:"biza", text:"（创业续）开业第三天，客流不到十人。房东在门口站着。", follow:true, choices:[
    { t:"推出「陨石薯条」爆款", gain:{ wealth:4, fame:2 }, r:"黑椒味的黑色薯条意外爆红，队伍排到隔壁。财富 +4。" },
    { t:"把店改成自助 party 模式", gain:{ happy:3, wealth:1 }, r:"小朋友们爱死这里了，你成了孩子王。快乐 +3。" },
    { t:"含泪转让，回去打工", gain:{ wealth:1, fame:-2, full:1 }, r:"你还是那个你，只是多了一本赔掉的账。" } ] },
  { id:"bizb", text:"（推车续）小推车被城管拦了三次，你换了个思路。", follow:true, choices:[
    { t:"转型线上「深夜汉堡」", gain:{ wealth:3, full:-1 }, r:"凌晨两点的订单比白天多三倍。财富 +3。" },
    { t:"接盘废料改造潮中间的铺面", gain:{ wealth:2, luck:2 }, r:"你用最低的租金拿下了最好的位置。幸运 +2。" },
    { t:"收摊回家睡觉", gain:{ full:3, happy:2 }, r:"你梦见自己在一个没有城管的城市卖薯条。饱腹感 +3。" } ] },
  { id:"bizc", text:"（投资续）兄弟的店爆火了，但他开始不接你电话。", follow:true, choices:[
    { t:"拿着合同去谈", gain:{ wealth:4, fame:-1, luck:1 }, r:"钱到账了，兄弟没了。财富 +4。" },
    { t:"算了，8% 够买很多薯条", gain:{ full:2, luck:2 }, r:"你挥霍了一笔，薯条管够。" },
    { t:"把股份转给店里的老员工", gain:{ fame:3, wealth:1 }, r:"老员工哭了。全店都知道了你的名字。声望 +3。" } ] },

  /* ---- 友情 / 意外 / 晋升 / 隐藏 ---- */
  { id:"e21", text:"老同事要离职去外地了，临走前塞给你一只信封。", tag:"friend", choices:[
    { t:"里面是「客户投诉话术大全」", gain:{ fame:2 }, r:"这本秘籍帮你度过了之后的每一次危机。" },
    { t:"里面是两张绝版优惠券", gain:{ wealth:2, luck:1 }, r:"你没舍得用，裱起来挂在前台。" },
    { t:"当面拆，结果发现是张欠条", gain:{ full:-1, luck:2 }, r:"金额 20 块。你说算了，他说明天还。" } ] },
  { id:"e22", text:"油锅突然窜起一股火苗，警报在三秒后才响起。", tag:"accident", choices:[
    { t:"抄起灭火毯扑上去", gain:{ fame:3, full:-2 }, r:"火灭了你坐下才发现手在抖。全店为你鼓掌。" },
    { t:"按规程疏散顾客", gain:{ fame:2, luck:1 }, r:"零伤亡，店长说你比应急预案还专业。" },
    { t:"愣在原地看火苗跳舞", gain:{ luck:2, fame:-1 }, r:"三秒后自动灭火装置启动。你被记了一次「需要培训」。" } ] },
  { id:"e23", text:"晋升公示：店长候选名单上有你的名字，也有对手的名字。", tag:"promote", choices:[
    { t:"主动申请最难的那个班次", gain:{ fame:3, full:-2 }, r:"你把通宵班做成了标杆，公示变成了任命。" },
    { t:"写一份门店改进方案", gain:{ wealth:2, fame:2 }, r:"方案里的「双层取餐窗」被总部采纳了。" },
    { t:"把名额让给带孩子的单亲同事", gain:{ fame:2, happy:3 }, r:"全店都知道你让了。半年后你得到了更好的位置。" } ] },
  { id:"e24", text:"仓库最深处，你翻到一张 1980 年代的纸质菜单，边角焦黄。", tag:"hidden", choices:[
    { t:"拿去重裱，挂进门店走廊", gain:{ fame:3, luck:1 }, r:"顾客排着队拍照，这门菜单成了网红打卡点。" },
    { t:"偷偷揣进口袋带回家", gain:{ wealth:-1, luck:3 }, r:"你夜夜研究那上面的价格，做了一个梦。" },
    { t:"抄价目表做一期推送", gain:{ fame:2, wealth:1 }, r:"推送爆了，评论区说「我的童年回来了」。" } ] }
];

/* 流星命运事件：触发时界面划流星，随机增益 / 隐藏剧情 / 隐藏成就 */
var LIFE_METEORS = [
  { id:"m1", text:"一颗流星划过点餐屏，在「麦麦省」三个字上停了一秒。", choices:[
    { t:"许愿「今天不加班」", gain:{ luck:2 }, r:"流星似乎听懂了，排班表真的松了一格。" },
    { t:"许愿「限定回归」", gain:{ wealth:1, mcd:1 }, r:"远方仓库的灯，亮了一盏。" },
    { t:"什么都不许，只是看着", gain:{ mcd:2, luck:1 }, r:"M兔子从屏幕角落探出头，冲你点了点头。" } ] },
  { id:"m2", text:"流星雨落在餐盘上，餐盘里的薯条忽然排成一个箭头。", choices:[
    { t:"顺着箭头走", gain:{ luck:2, stamina:-1 }, r:"你走到了打烊后的天台，看见整座城市的灯。" },
    { t:"把箭头吃了", gain:{ stamina:2 }, r:"箭头的味道是蜂蜜芥末味，体力 +2。" },
    { t:"拍照问群里这是什么梗", gain:{ charm:1, mcd:1 }, r:"群里说这是「麦门星座」，你火了半天。" } ] },
  { id:"m3", text:"夜空裂开一道缝，掉出一枚 16-bit 金币，滚到你脚边。", choices:[
    { t:"捡起来", gain:{ wealth:3 }, r:"金币背面刻着：「McPixel 2026 限定」。" },
    { t:"留给更需要的人", gain:{ mcd:3, luck:1 }, r:"硬币第二天出现在了捐款箱最上面。" },
    { t:"对着金币许愿再掉一枚", gain:{ luck:-1, wealth:1 }, r:"真的又掉了一枚，但砸在你头上。" } ] }
];

/* 结局判定（按顺序匹配，先满足先生效）
 * cat: legend 传奇 / rare 稀有 / absurd 荒诞 / normal 普通
 * 注意：属性键已统一为 wealth/happy/luck/full/fame */
var LIFE_ENDINGS = [
  /* ---- 传奇 ---- */
  { id:"god",      title:"麦门之神",     icon:"godIcon", cat:"legend", cond:function(a){ return a.fame >= 12; }, desc:"你把一生献给了麦门，麦门也把光环戴在了你头上。", flavor:"神座上刻着一行小字：欢迎光临。" },
  { id:"chosen",   title:"天选薯条",     icon:"friesCrown",cat:"legend",cond:function(a){ return a.luck >= 11 && a.fame >= 7; }, desc:"你被流星选中，成为传说里那根永远笔直的薯条。", flavor:"传说下句是：它至今没软。" },
  { id:"queenly",  title:"双人套餐女王", icon:"crown",   cat:"legend", cond:function(a){ return a.happy >= 10 && a.full >= 9 && a.fame >= 6; }, desc:"你把快乐分给了所有人，餐盘永远比人先到。", flavor:"女王不需要王冠，需要番茄酱。" },
  /* ---- 稀有 ---- */
  { id:"rich",     title:"麦门首富",     icon:"ingot",   cat:"rare", cond:function(a){ return a.wealth >= 9; }, desc:"你的金库由薯条盒改造而成，每一枚硬币都沾着盐粒香。", flavor:"财富自由，先从薯条自由开始。" },
  { id:"king",     title:"薯条之王",     icon:"friesKing",cat:"rare",cond:function(a){ return a.fame >= 8 && a.wealth >= 6; }, desc:"王冠由最长的那根薯条打造，加冕礼在午间高峰举行。", flavor:"臣民们纷纷表示：蘸酱管够。" },
  { id:"architect",title:"汉堡建筑大师", icon:"architect",cat:"rare",cond:function(a){ return a.full >= 8; }, desc:"你设计的一百层汉堡被印成了明信片，寄往宇宙各处。", flavor:"层数不重要，站稳比较重要。" },
  { id:"charming", title:"芝士贵族",     icon:"cheese",  cat:"rare", cond:function(a){ return a.happy >= 8; }, desc:"你走过的地方，拉丝三米不断，狗都为你驻足。", flavor:"贵族守则第一条：分享最后一口。" },
  { id:"meteor",   title:"流星旅人",     icon:"comet",   cat:"rare", cond:function(a){ return a.luck >= 9; }, desc:"你追着流星跑了一整年，最后它停下来，让你上了车。", flavor:"下一站：银河配送中心。" },
  { id:"mage",     title:"退休奶昔法师", icon:"milkshakeMage",cat:"rare",cond:function(a){ return a.luck >= 6 && a.happy >= 5; }, desc:"你把咒语教给了下一代冰淇淋机，从此只在下班时施法。", flavor:"退休仪式：一杯不搅拌的奶昔。" },
  { id:"manager",  title:"门店总经理",   icon:"chest",   cat:"rare", cond:function(a){ return a.fame >= 7 && a.wealth >= 5; }, desc:"你终于坐在了员工通道尽头那间办公室里，钥匙串很沉。", flavor:"开会第一件事：先点一份薯条。" },
  /* ---- 荒诞 ---- */
  { id:"escape",   title:"冰淇淋机逃兵", icon:"swirl",   cat:"absurd",cond:function(a){ return a.luck <= 1; }, desc:"你从冰淇淋机里逃了出来，据说从此再没人见过那么决绝的背影。", flavor:"自由的味道，是八分甜的。" },
  { id:"saucer",   title:"番茄酱里的哲学家",icon:"flask",cat:"absurd",cond:function(a){ return a.full <= 1; }, desc:"你饿了一辈子，却在最后一秒参透了番茄的浓度。", flavor:"「还不够酸。」——你的遗言。" },
  { id:"mascot",   title:"吉祥物の再就业", icon:"bunnyWave",cat:"absurd",cond:function(a){ return a.happy <= 1 && a.fame >= 5; }, desc:"你辞了职，穿上兔子玩偶服，在门口站了三年。", flavor:"里面的你，笑得比谁都真。" },
  { id:"loop",     title:"无限重开者",   icon:"recycle", cat:"absurd",cond:function(a){ return a.wealth <= 1 && a.full <= 1 && a.luck >= 7; }, desc:"你的人生重启了四十一次，每次都选了同一个选项。", flavor:"循环也是一种坚持。" },
  /* ---- 普通 ---- */
  { id:"forgotten",title:"被遗忘的麦乐鸡",icon:"lastNugget",cat:"normal",cond:function(a){ return a.happy <= 2 && a.luck <= 2; }, desc:"你在餐盘角落度过了漫长的一生，但那块位置，阳光最好。", flavor:"被遗忘，也是一种安静的幸运。" },
  { id:"worker",   title:"盐堆终身劳模", icon:"cap",      cat:"normal",cond:function(a){ return a.full >= 5 && a.wealth <= 4; }, desc:"你在盐堆里工作了三千年，盐认识你，你也认识每一粒盐。", flavor:"劳模的退休金：一整座盐山。" },
  { id:"collector",title:"麦麦省券收藏家",icon:"ticket",  cat:"normal",cond:function(a){ return a.wealth >= 6 && a.happy <= 5; }, desc:"你收藏的优惠券按年份排列，最旧的那张已经绝版。", flavor:"省钱，是一种行为艺术。" },
  { id:"normal",   title:"平凡的一天",   icon:"star",     cat:"normal",cond:function(){ return true; }, desc:"你没有惊天动地，只是把每一份餐都稳稳地递到了客人手里。", flavor:"平凡的日子，也值得被像素记录。" }
];

/* =========================================================
 * 九、皮肤 / 徽章解锁规则（订单与游戏行为 → 奖励）
 * ========================================================= */
var UNLOCK_RULES = [
  { id:"skin_fries",    kind:"skin", target:"fries",    text:"完成一次含薯条的模拟订单" },
  { id:"skin_bigmac",   kind:"skin", target:"bigmac",   text:"完成一次含巨无霸 / 双层吉士的模拟订单" },
  { id:"skin_milkshake",kind:"skin", target:"milkshake",text:"完成一次含甜品的模拟订单" },
  { id:"skin_bunny",    kind:"skin", target:"bunny",    text:"与 M兔子互动（点击它）" },
  { id:"skin_star",     kind:"skin", target:"star",     text:"解锁徽章「流星守护兔」" },
  { id:"skin_king",     kind:"skin", target:"king",     text:"解锁徽章「薯条大王」" },
  { id:"skin_xmas",     kind:"skin", target:"xmas",     text:"圣诞节限定徽章解锁时赠送" }
];
