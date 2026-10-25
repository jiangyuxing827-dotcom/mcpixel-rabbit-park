/* =========================================================
 * McPixel · 今日麦麦幸运物（开屏系统）
 * 节日自动匹配 + 四档稀有度 + 命运签语 + 幸运图鉴
 * 农历节日使用「逐年日期表」（每年不同，非固定公历日期），可继续扩展
 * ========================================================= */
var luck = null;

/* 农历节日逐年公历日期表（MM-DD）。新增年份只需往这里加一行，不写死节日逻辑 */
var LUCK_LUNAR_TABLE = {
  2024:{ spring:"02-10", lantern:"02-24", dragon:"06-10", midautumn:"09-17" },
  2025:{ spring:"01-29", lantern:"02-12", dragon:"05-31", midautumn:"10-06" },
  2026:{ spring:"02-17", lantern:"03-03", dragon:"06-19", midautumn:"09-25" },
  2027:{ spring:"02-06", lantern:"02-20", dragon:"06-09", midautumn:"09-15" },
  2028:{ spring:"01-26", lantern:"02-09", dragon:"05-28", midautumn:"10-03" },
  2029:{ spring:"02-13", lantern:"02-27", dragon:"06-16", midautumn:"09-22" },
  2030:{ spring:"02-03", lantern:"02-17", dragon:"06-05", midautumn:"09-12" },
  2031:{ spring:"01-23", lantern:"02-06", dragon:"05-25", midautumn:"10-01" },
  2032:{ spring:"02-11", lantern:"02-25", dragon:"06-13", midautumn:"09-19" },
  2033:{ spring:"01-31", lantern:"02-14", dragon:"06-02", midautumn:"09-08" },
  2034:{ spring:"02-19", lantern:"03-05", dragon:"06-21", midautumn:"09-27" },
  2035:{ spring:"02-08", lantern:"02-22", dragon:"06-10", midautumn:"09-16" }
};
/* 二十四节气（从「立春」起的近似分钟基准，用于当年节气日计算） */
var LUCK_TERM_BASE = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
var LUCK_TERM_NAMES = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];
function luckTermDay(y, n){
  var D = 0.2422;
  var base = LUCK_TERM_BASE[n];
  var c = Math.floor((y - 1900) * D + base);
  var leapFix = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 1 : 0;
  return Math.floor(c) - leapFix;   /* 近似到日（±1 天） */
}
function luckCurrentTerm(d){
  var y = d.getFullYear();
  for(var i = 0; i < 24; i++){
    var day = luckTermDay(y, i);
    var m = Math.floor(day / 100), dd = day % 100;
    var t = new Date(y, (m - 1) || 0, dd);
    if(t > d) break;
    var last = i;
  }
  for(var j = 23; j >= 0; j--){
    var day2 = luckTermDay(y, j);
    var m2 = Math.floor(day2 / 100), dd2 = day2 % 100;
    var t2 = new Date(y, (m2 - 1) || 0, dd2);
    if(t2 <= d) return { index:j, name:LUCK_TERM_NAMES[j] };
  }
  return { index:0, name:"小寒" };
}
function luckSeason(mm){
  if(mm >= 3 && mm <= 5) return "spring";
  if(mm >= 6 && mm <= 8) return "summer";
  if(mm >= 9 && mm <= 11) return "autumn";
  return "winter";
}

/* 节日主题 */
var LUCK_FESTIVALS = {
  spring:{ name:"麦麦新春好运签", season:"winter", emoji:"🏮",
    bg:["#7A1F2B","#C0392B"], particle:"firework", sfx:"bell",
    line:"新的一年，愿你的好运像肉饼一样层层叠加。" },
  lantern:{ name:"元宵灯会", season:"winter", emoji:"🏮", bg:["#6B2D5C","#D6336C"], particle:"firework", sfx:"bell",
    line:"灯谜还没猜完，汤圆已经先甜了。" },
  valentine:{ name:"心动麦麦", season:"winter", emoji:"💗", bg:["#4A2545","#F06595"], particle:"heart", sfx:"bell",
    line:"今天的幸运，是有人愿意把最后一根薯条留给你。" },
  children:{ name:"麦麦童话派对", season:"summer", emoji:"🎈", bg:["#2D6A4F","#95D5B2"], particle:"balloon", sfx:"star",
    line:"恭喜！今天可以理直气壮地做三分钟小朋友。" },
  dragon:{ name:"端午龙舟", season:"summer", emoji:"🐲", bg:["#1D3557","#457B9D"], particle:"wave", sfx:"star",
    line:"把心愿包进粽子里，愿望会自己游回来。" },
  midautumn:{ name:"月亮芝士计划", season:"autumn", emoji:"🌕", bg:["#2B2D6E","#5A5F9E"], particle:"moon", sfx:"star",
    line:"月亮今天有点圆，可能是偷偷加了双层芝士。" },
  halloween:{ name:"麦麦幽灵夜", season:"autumn", emoji:"🎃", bg:["#3A2E4E","#E07A1F"], particle:"ghost", sfx:"mystery",
    line:"今日幸运：鬼点子特别多，坏运气已经吓跑了。" },
  christmas:{ name:"兔兔流星礼物夜", season:"winter", emoji:"🎄", bg:["#0B2545","#3E7CB1"], particle:"snow", sfx:"bell",
    line:"圣诞老人今天休假，换兔子给你送好运。" }
};
/* 默认季节主题（非节日期间） */
var LUCK_SEASONS = {
  spring:{ name:"春风麦麦", emoji:"🌸", bg:["#5C7A4A","#F6CED8"], particle:"petal", sfx:"star", line:"风里带奶油味，宜出发。" },
  summer:{ name:"海盐夏日", emoji:"☀️", bg:["#1B4965","#62B6CB"], particle:"sun", sfx:"star", line:"冰镇的快乐，要趁气泡还在。" },
  autumn:{ name:"焦糖秋日", emoji:"🍁", bg:["#6B4423","#F4A340"], particle:"leaf", sfx:"star", line:"落叶都裹了糖浆，别踩太快。" },
  winter:{ name:"暖手冬日", emoji:"❄️", bg:["#282B46","#8AA9C9"], particle:"snow", sfx:"bell", line:"手是凉的，薯条是热的。" }
};
/* 幸运物：festival 归属 + 稀有度 + 像素图 + 签语 + 解锁内容 */
var LUCK_ITEMS = [
  /* 春节 */
  { id:"lucky_fries",  fest:"spring",    rarity:"normal", name:"招财薯条",     art:"fries",     omen:"今日宜：把好运一根一根数清楚。" },
  { id:"gold_cheese",  fest:"spring",    rarity:"rare",   name:"黄金芝士元宝", art:"cheese",    omen:"拉丝的长度，约等于财运的长度。" },
  { id:"red_packet",   fest:"spring",    rarity:"rare",   name:"兔兔压岁红包", art:"redPack",   omen:"红包里装的是祝福，不是金额。" },
  { id:"new_burger",   fest:"spring",    rarity:"epic",   name:"新年幸运汉堡", art:"burger",    omen:"新的一年，愿你层层都有料。" },
  { id:"koi",          fest:"spring",    rarity:"legend", name:"麦门锦鲤",     art:"friesKing", omen:"锦鲤说：转发它不如亲自咬一口。", unlock:{ skin:"king" } },
  /* 情人节 */
  { id:"love_fries",   fest:"valentine", rarity:"normal", name:"心动双人薯条", art:"fries",     omen:"两根薯条，一把抓。" },
  { id:"shake_letter", fest:"valentine", rarity:"rare",   name:"草莓奶昔情书", art:"swirl",     omen:"甜度超标，但今天允许。" },
  { id:"hair_clip",    fest:"valentine", rarity:"rare",   name:"兔兔爱心发夹", art:"heartFries",omen:"戴上它，耳朵都会心动。" },
  { id:"cheese_love",  fest:"valentine", rarity:"epic",   name:"芝士告白信",   art:"cheese",    omen:"告白要趁热，芝士也是。" },
  { id:"meteor_love",  fest:"valentine", rarity:"legend", name:"双向奔赴流星", art:"comet",     omen:"你朝它跑的时候，它也在朝你跑。", unlock:{ badge:"bunny_meteor" } },
  /* 儿童节 */
  { id:"rainbow_cone", fest:"children",  rarity:"normal", name:"彩虹甜筒",     art:"swirl",     omen:"童心是最高清的像素。" },
  { id:"toy_box",      fest:"children",  rarity:"rare",   name:"兔兔玩具盒",   art:"chest",     omen:"打开之前先摇一摇，这是仪式。" },
  { id:"fly_burger",   fest:"children",  rarity:"epic",   name:"会飞的汉堡气球",art:"burger",   omen:"今日运势：有些事不一定有结果，但汉堡一定要有面包。" },
  { id:"star_wand",    fest:"children",  rarity:"legend", name:"星星薯条魔法棒",art:"star",     omen:"挥一挥，薯条会自己排好队。" },
  /* 中秋 */
  { id:"moon_cheese",  fest:"midautumn", rarity:"normal", name:"满月芝士",     art:"cheese",    omen:"别担心，今天的月亮都在偷偷给自己加料。", unlock:{ deco:"moonBurger" } },
  { id:"moon_burger",  fest:"midautumn", rarity:"rare",   name:"月亮汉堡",     art:"bunBurgerIcon",omen:"咬一口，今晚不用开灯。" },
  { id:"jade_shake",   fest:"midautumn", rarity:"epic",   name:"玉兔奶昔",     art:"swirl",     omen:"玉兔捣的不是药，是奶昔。" },
  { id:"moon_thief",   fest:"midautumn", rarity:"legend", name:"偷吃月亮的兔子",art:"bunny",    omen:"被发现了，它叼着月亮跑过屋顶。" },
  /* 万圣节 */
  { id:"pumpkin_fries",fest:"halloween", rarity:"normal", name:"南瓜薯条",     art:"fries",     omen:"南瓜灯里炖着一点咸味。", unlock:{ skin:"fries" } },
  { id:"ghost_burger", fest:"halloween", rarity:"rare",   name:"幽灵汉堡",     art:"ghost",     omen:"它说它不吃，只是闻闻。" },
  { id:"magic_hat",    fest:"halloween", rarity:"epic",   name:"魔法芝士帽",   art:"cheese",    omen:"戴上它，拉丝会变成咒语。" },
  { id:"ghost_bucket", fest:"halloween", rarity:"legend", name:"午夜幽灵鸡桶", art:"bucket",    omen:"午夜十二点，桶里会多一块。" },
  /* 圣诞 */
  { id:"tree_fries",   fest:"christmas", rarity:"normal", name:"圣诞树薯条",   art:"fries",     omen:"树上挂的不是星星，是盐粒。", unlock:{ deco:"xmasBoard" } },
  { id:"ginger_bunny", fest:"christmas", rarity:"rare",   name:"姜饼兔子",     art:"bunny",     omen:"姜饼会融化，像素不会。" },
  { id:"deer_burger",  fest:"christmas", rarity:"epic",   name:"驯鹿汉堡",     art:"burger",    omen:"今晚它负责配送，你负责吃。" },
  { id:"polar_burger", fest:"christmas", rarity:"legend", name:"北极星汉堡",   art:"crown",     omen:"迷路的时候，抬头找最亮的那块面包。" },
  /* 季节通用 */
  { id:"sakura_fries", fest:"spring_s",  rarity:"normal", name:"樱花薯条",     art:"fries",     omen:"春天把盐都变甜了一点。" },
  { id:"breeze_ear",   fest:"spring_s",  rarity:"rare",   name:"春风兔耳",     art:"bunnyWave", omen:"耳朵听到的消息，通常更准。" },
  { id:"ice_shake",    fest:"summer_s",  rarity:"normal", name:"冰镇奶昔",     art:"swirl",     omen:"冷静三秒，事情会变得容易些。" },
  { id:"sun_cheese",   fest:"summer_s",  rarity:"rare",   name:"太阳芝士",     art:"cheese",    omen:"今天的热量，来自太阳和芝士。" },
  { id:"maple_burger", fest:"autumn_s",  rarity:"normal", name:"枫叶汉堡",     art:"burger",    omen:"一片叶子落进汉堡，成了限定款。" },
  { id:"caramel_meteor",fest:"autumn_s", rarity:"rare",   name:"焦糖流星",     art:"comet",     omen:"许愿吧，秋季流星格外粘。" },
  { id:"snow_cone",    fest:"winter_s",  rarity:"normal", name:"雪花甜筒",     art:"swirl",     omen:"舌头会记住今天的形状。" },
  { id:"warm_scarf",   fest:"winter_s",  rarity:"rare",   name:"毛绒兔兔围巾", art:"bunny",     omen:"冷的时候，先把自己裹好。" }
];
var LUCK_RARITY = {
  normal:{ name:"普通", w:58, cls:"n" },
  rare:  { name:"稀有", w:28, cls:"r" },
  epic:  { name:"史诗", w:11, cls:"e" },
  legend:{ name:"传说", w:3,  cls:"l" }
};
var LUCK_OMENS = [
  "今日宜：自信。毕竟你可是薯条界的黄金传说。",
  "今日宜：摸鱼、吃薯条、收集一点好运。",
  "今日忌：和最后一块麦乐鸡较劲。",
  "小提醒：番茄酱要挤在旁边，不要挤在人生上。",
  "今日运势：排队会遇到熟人，队伍会变短。",
  "今日宜：把话说清楚，把汉堡拿稳。",
  "今天的流星替你请了半天假。"
];

/* ---------- 节日解析 ---------- */
function luckResolveFestival(d){
  var mm = d.getMonth() + 1, dd = d.getDate();
  var md = (mm < 10 ? "0" : "") + mm + "-" + (dd < 10 ? "0" : "") + dd;
  var y = d.getFullYear();
  var row = LUCK_LUNAR_TABLE[y];
  if(row){
    for(var k in row){
      if(row[k] === md && (k === "spring" || k === "lantern" || k === "dragon" || k === "midautumn")){
        return { id:k, cfg:LUCK_FESTIVALS[k] || LUCK_FESTIVALS.spring, window:0 };
      }
    }
  }
  /* 公历节日（含前后活动周期） */
  if(md >= "02-10" && md <= "02-16") return { id:"valentine", cfg:LUCK_FESTIVALS.valentine, window:0 };
  if(md >= "05-28" && md <= "06-03") return { id:"children", cfg:LUCK_FESTIVALS.children, window:0 };
  if(md >= "10-20" && md <= "11-02") return { id:"halloween", cfg:LUCK_FESTIVALS.halloween, window:0 };
  if(md >= "12-18" && md <= "12-26") return { id:"christmas", cfg:LUCK_FESTIVALS.christmas, window:0 };
  /* 季节（slug 带 _s） */
  var s = luckSeason(mm);
  return { id:s + "_s", cfg:LUCK_SEASONS[s], window:1 };
}
/* ---------- 抽取 ---------- */
function luckPoolFor(festId){
  var list = LUCK_ITEMS.filter(function(i){ return i.fest === festId; });
  if(!list.length){
    var s = String(festId).replace("_s", "");
    list = LUCK_ITEMS.filter(function(i){ return i.fest === s + "_s"; });
  }
  if(!list.length) list = LUCK_ITEMS.filter(function(i){ return i.rarity === "normal"; });
  return list;
}
function luckPickItem(pool){
  var total = 0, i;
  for(i = 0; i < pool.length; i++) total += (LUCK_RARITY[pool[i].rarity] || LUCK_RARITY.normal).w;
  var r = Math.random() * total;
  for(i = 0; i < pool.length; i++){
    r -= (LUCK_RARITY[pool[i].rarity] || LUCK_RARITY.normal).w;
    if(r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
/* ---------- 每日判定（本地日期，处理跨天） ---------- */
function luckTodayKey(d){
  d = d || new Date();
  return "" + d.getFullYear() + "-" + ((d.getMonth()+1)<10?"0":"") + (d.getMonth()+1) + "-" + (d.getDate()<10?"0":"") + d.getDate();
}
function luckTestDate(){
  try{
    var q = new URLSearchParams(window.location.search);
    var s = q.get("luckdate");
    if(s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + "T12:00:00");
    var md = q.get("luckmd");
    if(md && /^\d{2}-\d{2}$/.test(md)) return new Date(new Date().getFullYear(), +md.slice(0,2)-1, +md.slice(3,5));
  }catch(e){}
  var forced = store("mcpixel_luck_force_date");
  if(forced && /^\d{4}-\d{2}-\d{2}$/.test(forced)) return new Date(forced + "T12:00:00");
  return new Date();
}
function luckState(){
  if(!luck){
    luck = { drawn:store("mcpixel_luck_drawn_v3") || {}, stars:store("mcpixel_luck_stars_v3") || {}, today:null, opened:false };
  }
  return luck;
}
function luckHasToday(){
  var st = luckState();
  var key = luckTodayKey(luckTestDate());
  return !!(st.drawn && st.drawn[key]);
}
function luckDrawToday(force){
  var st = luckState();
  var d = luckTestDate();
  var key = luckTodayKey(d);
  /* 当天重复进入不重复发放 */
  if(st.drawn[key] && !force){
    var prev = LUCK_ITEMS.filter(function(i){ return i.id === st.drawn[key]; })[0];
    return { item:prev, fest:luckResolveFestival(d), repeat:true, omen:store("mcpixel_luck_omen_" + key) || pick(LUCK_OMENS) };
  }
  var fest = luckResolveFestival(d);
  var item = luckPickItem(luckPoolFor(fest.id));
  var omen = item.omen || pick(LUCK_OMENS);
  st.drawn[key] = item.id;
  st.stars[item.id] = (st.stars[item.id] || 0) + 1;
  store("mcpixel_luck_drawn_v3", st.drawn);
  store("mcpixel_luck_stars_v3", st.stars);
  store("mcpixel_luck_omen_" + key, omen);
  /* 首次获得才触发解锁（重复只攒纪念星） */
  if(st.stars[item.id] === 1 && item.unlock){
    if(item.unlock.skin) unlockSkin(item.unlock.skin, true);
    if(item.unlock.badge) unlockBadge(item.unlock.badge, true);
  }
  if(st.stars[item.id] === 1) addCoins(15);
  return { item:item, fest:fest, repeat:false, omen:omen };
}
/* ---------- 开屏 UI ---------- */
function luckShow(force){
  var d = luckTestDate();
  var res = luckDrawToday(force);
  var fest = res.fest, item = res.item;
  var rar = LUCK_RARITY[item.rarity] || LUCK_RARITY.normal;
  var term = luckCurrentTerm(d);
  var key = luckTodayKey(d);
  var stars = (luckState().stars[item.id] || 0);
  showModal(
    '<div class="luck-screen ' + rar.cls + '" style="--lb1:' + fest.cfg.bg[0] + ';--lb2:' + fest.cfg.bg[1] + '">' +
      '<div class="lk-top">' + (fest.cfg.emoji || "☄") + " <b>" + esc(fest.cfg.name) + "</b><span>" + key + " · " + term.name + "</span></div>" +
      '<div class="lk-stage">' + mascotHTML("idle", 92) + '<div class="lk-box" id="lkBox">' + artSVG("chest", { size:64 }) + "</div></div>" +
      '<div class="lk-reveal" id="lkReveal" hidden>' +
        '<div class="lk-art">' + artSVG(item.art, { size:78 }) + "</div>" +
        '<div class="lk-name">' + esc(item.name) + "</div>" +
        '<div class="lk-rar ' + rar.cls + '">' + rar.name + "</div>" +
        '<div class="lk-omen">' + esc(res.omen) + "</div>" +
        '<div class="lk-line">' + esc(fest.cfg.line) + "</div>" +
        (stars > 1 ? '<div class="lk-stars">重复获得 · 纪念星 ×' + stars + "</div>" : "") +
      "</div>" +
      '<div class="lk-btns">' +
        '<button class="btn btn-lg" id="lkOpen">点击打开礼盒 🎁</button>' +
        '<button class="btn btn-sm" id="lkSkip" hidden>跳过</button>' +
        '<button class="btn btn-sm btn-ghost" id="lkArchive">查看收藏</button>' +
        '<button class="btn btn-sm btn-night" id="lkClose">收下好运</button>' +
      "</div>" +
      '<p class="honest">幸运物为免费游戏体验，不涉及真实货币、付费抽奖或真实优惠权益；每日限一次。</p>' +
    "</div>", true
  );
  var box = $("#lkBox"), rev = $("#lkReveal");
  var opened = false;
  function open(){
    if(opened) return; opened = true;
    SFX.unlock();
    SFX.play("boxOpen");
    if(fest.cfg.sfx === "bell") SFX.play("bell"); else if(fest.cfg.sfx === "mystery") SFX.play("gacha"); else SFX.play("star");
    box.classList.add("open");
    setTimeout(function(){
      box.hidden = true;
      rev.hidden = false;
      rev.classList.add("in");
      SFX.play(item.rarity === "legend" ? "achievement" : item.rarity === "epic" ? "upgrade" : "coin");
      meteorAt($("#modalBox"), item.rarity === "normal" ? 3 : 6);
      $("#lkSkip").hidden = true;
      var ob = $("#lkOpen"); if(ob) ob.hidden = true;
    }, reducedMotion ? 0 : 520);
  }
  if(box) box.addEventListener("click", open);
  var ob2 = $("#lkOpen"); if(ob2) ob2.addEventListener("click", open);
  var sk = $("#lkSkip"); if(sk) sk.addEventListener("click", open);
  var ar = $("#lkArchive"); if(ar) ar.addEventListener("click", function(){ luckShowArchive(); });
  var cl = $("#lkClose"); if(cl) cl.addEventListener("click", function(){ hideModal(); renderLuckChip(); });
}
/* 幸运图鉴 */
function luckShowArchive(){
  var st = luckState();
  var items = LUCK_ITEMS.slice().sort(function(a,b){
    var ord = { legend:0, epic:1, rare:2, normal:3 };
    return (ord[a.rarity]||3) - (ord[b.rarity]||3);
  });
  var got = items.filter(function(i){ return st.stars[i.id]; }).length;
  var totalStars = 0;
  for(var k in st.stars) totalStars += st.stars[k];
  showModal(
    '<div class="luck-archive"><h3>麦麦幸运收藏馆</h3>' +
      '<div class="la-sum">已收集 <b>' + got + "</b> / " + items.length + " 件 · 纪念星 <b>" + totalStars + "</b> 枚</div>" +
      '<div class="la-grid">' + items.map(function(i){
        var n = st.stars[i.id];
        var rar = LUCK_RARITY[i.rarity] || LUCK_RARITY.normal;
        var fcfg = LUCK_FESTIVALS[i.fest] || LUCK_SEASONS[String(i.fest).replace("_s","")] || { name:"通用" };
        return '<div class="la-cell ' + rar.cls + (n ? "" : " miss") + '">' +
          (n ? artSVG(i.art, { size:44 }) : '<span class="la-q">?</span>') +
          "<b>" + (n ? esc(i.name) : "？？？") + "</b>" +
          '<small class="lk-rar ' + rar.cls + '">' + rar.name + "</small>" +
          '<small>' + esc(fcfg.name) + "</small>" +
          (n > 1 ? '<em>纪念星 ×' + n + "</em>" : "") +
        "</div>";
      }).join("") + "</div>" +
      '<div class="la-btns"><button class="btn btn-sm" data-close="1">关闭</button></div>' +
    "</div>", true
  );
}
/* 顶部小入口 */
function renderLuckChip(){
  var host = $("#luckChip");
  if(!host) return;
  var st = luckState();
  var d = luckTestDate();
  var key = luckTodayKey(d);
  var id = st.drawn && st.drawn[key];
  var item = id ? LUCK_ITEMS.filter(function(i){ return i.id === id; })[0] : null;
  host.innerHTML = item
    ? '<button class="lk-chip" id="lkChipBtn">' + artSVG(item.art, { size:24 }) + "<span>今日幸运物</span></button>"
    : '<button class="lk-chip" id="lkChipBtn">☄<span>今日幸运物</span></button>';
  var b = $("#lkChipBtn");
  if(b) b.addEventListener("click", function(){ luckShow(false); });
}
/* 每日首进触发（重复进入只展示，不重复发放） */
function luckBoot(){
  luckState();
  var st = luck;
  var key = luckTodayKey(luckTestDate());
  var seen = store("mcpixel_luck_seen");
  if(seen !== key){
    store("mcpixel_luck_seen", key);
    /* 首次：延迟展示，等用户有过交互后再发声（遵守自动播放限制） */
    setTimeout(function(){
      var armed = false;
      function arm(){ if(armed) return; armed = true; luckShow(false); window.removeEventListener("pointerdown", arm); }
      window.addEventListener("pointerdown", arm);
      setTimeout(function(){ if(!armed){ window.removeEventListener("pointerdown", arm); luckShow(false); } }, 6000);
    }, 800);
  }
  renderLuckChip();
}
