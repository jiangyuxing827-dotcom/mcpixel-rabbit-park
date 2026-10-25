/* =========================================================
 * McPixel · 麦门人格研究所（V2.6）
 * 娱乐性人格探索小游戏：情境题 → 四维计分 → 16 型人格 → 人格兔子 / 专属套餐 / 图鉴 / 配对
 * 声明：非官方 MBTI 测评、非心理诊断工具，不用于任何消费能力推断或广告定向。
 * ========================================================= */
var mbti = null;

/* 四个维度：a = 选项 A 指向的字母，b = 选项 B 指向的字母 */
var MBTI_DIMS = [
  { id:"EI", a:"E", b:"I", name:"能量方向", aName:"呼朋引伴 E", bName:"安静独处 I", color:"#FFC72C" },
  { id:"SN", a:"S", b:"N", name:"信息获取", aName:"脚踏实地 S", bName:"天马行空 N", color:"#8BC34A" },
  { id:"TF", a:"T", b:"F", name:"决策方式", aName:"先讲道理 T", bName:"先讲感情 F", color:"#E05A4A" },
  { id:"JP", a:"J", b:"P", name:"生活节奏", aName:"提前计划 J", bName:"临时决定 P", color:"#6C8AE4" }
];
var MBTI_DIM_BY_ID = {};
MBTI_DIMS.forEach(function(d){ MBTI_DIM_BY_ID[d.id] = d; });

/* 12 道情境题：四维各 3 题；dim 决定计分方向，A → d.a，B → d.b */
var MBTI_QUESTIONS = [
  { id:1,  dim:"EI", art:"bunnyWave", scene:"你走进麦当劳，发现今天人特别多。",
    a:"正好！看看大家都在点什么，顺便聊两句。", b:"默默找到角落的位置，开始研究菜单。" },
  { id:2,  dim:"SN", art:"burger",    scene:"麦当劳突然允许你创造一种新汉堡。",
    a:"先研究现有配料，组合出一款确实好吃的。", b:"我想做一个能让人飞起来的银河汉堡。" },
  { id:3,  dim:"TF", art:"bunnySad",  scene:"朋友点错了套餐，心情很差。",
    a:"先帮她分析怎么解决，看看能不能换。", b:"先安慰一下，毕竟好心情比汉堡重要。" },
  { id:4,  dim:"JP", art:"ticket",    scene:"你终于决定今天吃什么了。",
    a:"提前选好套餐，直接下单。", b:"走到柜台前再看看，说不定突然想吃别的。" },
  { id:5,  dim:"EI", art:"heart",     scene:"朋友想组织一场午夜麦门派对。",
    a:"我来拉人！群里已经发好接龙了。", b:"我很想去，但我更想在家安静吃完再睡。" },
  { id:6,  dim:"SN", art:"friesCrown",scene:"一根薯条突然开口向你请求帮助。",
    a:"先问清楚它具体卡在哪里，再动手。", b:"这一定意味着什么，我决定先听听预言。" },
  { id:7,  dim:"TF", art:"cheese",    scene:"你和同伴对「蘸酱规则」产生了分歧。",
    a:"把两种方案的优劣列出来，选效率高的。", b:"让大家都能开心地蘸，比规则本身重要。" },
  { id:8,  dim:"JP", art:"crown",     scene:"你被临时任命为餐厅店长。",
    a:"先排班、先定流程，一切按表走。", b:"先看看现场情况，随机应变也挺好。" },
  { id:9,  dim:"EI", art:"bunnyJump", scene:"店员问你「要不要加一元换大薯」。",
    a:"当然要！顺便问问今天有什么新品。", b:"点头，小声说一句「要」，然后迅速付钱。" },
  { id:10, dim:"SN", art:"comet",     scene:"麦当劳推出了一份神秘隐藏菜单。",
    a:"先把已知的都点一遍，再考虑隐藏款。", b:"隐藏菜单才是重点，未知的部分最有趣。" },
  { id:11, dim:"TF", art:"bunnySurprise", scene:"你意外收到一份来自未来的汉堡订单。",
    a:"先核对订单信息，确认真伪再处理。", b:"不管真假，先为这位客人留一份热的。" },
  { id:12, dim:"JP", art:"star",      scene:"你的汉堡突然长出了兔耳朵。",
    a:"记录下来，按流程上报并拍照存档。", b:"先和它合个影，之后再想怎么办。" }
];

/* 16 型麦门人格：称号 / 代表食物 / 关键词 / 介绍 / 宣言 / 配色 / 配饰 / 专属套餐 */
var MBTI_TYPES = [
  { id:"INTJ", name:"麦门幕后军师", food:"黑椒双层汉堡", foodArt:"burger2", acc:"crown",
    pal:{ b:"#6C7BA8", y:"#FFC72C", p:"#D8C6E8" }, keys:["深谋远虑","低调度假","排兵布阵"],
    desc:"你已经在脑内安排好了所有人的点餐顺序，但你并不打算告诉他们。",
    slogan:"策略不需要被看见，被吃完就够了。",
    combo:"深夜战略双层堡套餐", recipe:{ patty:2, cheese:1, onion:1 } },

  { id:"INTP", name:"汉堡研究怪才", food:"神秘混搭汉堡", foodArt:"burger", acc:"cheese",
    pal:{ b:"#7E8AA2", y:"#B8C4E0", p:"#DCCFE8" }, keys:["配方实验","逻辑上瘾","忘记吃饭"],
    desc:"你为了验证「芝士在第几层最好吃」，已经做了 17 次对照实验，并且还没得出结论。",
    slogan:"我不是在纠结，我是在做可重复验证的研究。",
    combo:"未命名实验套餐", recipe:{ patty:1, cheese:2, pickle:1, egg:1 } },

  { id:"ENTJ", name:"麦门总经理", food:"巨无霸", foodArt:"burger2", acc:"kingCrown",
    pal:{ b:"#8B5A2B", y:"#FFC72C", p:"#E8C9A0" }, keys:["目标导向","效率至上","带队点餐"],
    desc:"你能在 30 秒内安排好 6 个人的套餐、预算和取餐顺序，并且顺手优化了动线。",
    slogan:"先定目标，再决定要不要加薯条。",
    combo:"高层决策巨无霸套餐", recipe:{ patty:2, cheese:2, lettuce:1, bacon:1 } },

  { id:"ENTP", name:"配方捣蛋鬼", food:"疯狂蘸酱薯条", foodArt:"fries", acc:"heartFries",
    pal:{ b:"#D89A3C", y:"#E05A4A", p:"#F6B0A0" }, keys:["脑洞清奇","蘸酱自由","当场改名"],
    desc:"你把六种酱料混在一起，命名为「薛定谔的蘸酱」，并邀请全桌盲测。",
    slogan:"规则存在的意义，就是被我重新发明一次。",
    combo:"没人知道什么味道套餐", recipe:{ patty:1, cheese:1, pickle:2, onion:1, bacon:1 } },

  { id:"INFJ", name:"星光守护兔", food:"月亮芝士堡", foodArt:"cheese", acc:"comet",
    pal:{ b:"#5A6BA8", y:"#FFF3D0", p:"#E0D4F0" }, keys:["温柔坚定","暗中照顾","星空脑内"],
    desc:"你记得每个人不吃什么，并且会悄悄把自己的那份换成对方喜欢的。",
    slogan:"有些温柔不需要声张，也不需要收据。",
    combo:"月光芝士堡套餐", recipe:{ patty:1, cheese:2, lettuce:1 } },

  { id:"INFP", name:"奶昔幻想家", food:"草莓奶昔", foodArt:"swirl", acc:"heart",
    pal:{ b:"#F0B0C8", y:"#FFF3D0", p:"#F6A0BC" }, keys:["内心剧场","柔软浪漫","慢半拍"],
    desc:"你点餐时会先在脑内演完一整部关于这杯奶昔的短片，然后才开口。",
    slogan:"世界很吵，但我的奶昔是草莓味的。",
    combo:"月光草莓奶昔套餐", recipe:{ patty:1, cheese:1, egg:1 } },

  { id:"ENFJ", name:"麦门团建队长", food:"欢乐分享桶", foodArt:"friesCrown", acc:"heart",
    pal:{ b:"#E8A85C", y:"#FFC72C", p:"#F6C0A8" }, keys:["凝聚全场","照顾每个","气氛担当"],
    desc:"你点的不是套餐，是「至少六个人都能吃到喜欢的东西」这件事本身。",
    slogan:"把人聚齐，比把菜点齐更重要。",
    combo:"全员到齐分享桶套餐", recipe:{ patty:2, cheese:1, lettuce:1, tomato:1 } },

  { id:"ENFP", name:"流星派对兔", food:"彩虹甜筒", foodArt:"swirl", acc:"star",
    pal:{ b:"#F4A340", y:"#8BC34A", p:"#F6A0B8" }, keys:["随时开趴","灵感乱窜","热情过载"],
    desc:"你说「随便吃点」，四十分钟后你带着三个人和五个新品回到了座位。",
    slogan:"计划是什么？先让流星决定吧。",
    combo:"随时开派对惊喜套餐", recipe:{ patty:1, cheese:2, tomato:1, egg:1 } },

  { id:"ISTJ", name:"标准出餐大师", food:"经典汉堡", foodArt:"burger", acc:"ticket",
    pal:{ b:"#B98A4A", y:"#FFF3D0", p:"#E4CBA8" }, keys:["一丝不苟","稳定输出","照单执行"],
    desc:"你三年来点同一份套餐，并且能准确说出它今天的生菜比昨天多了两片。",
    slogan:"经典之所以是经典，因为它从不失误。",
    combo:"标准流程经典套餐", recipe:{ patty:1, cheese:1, pickle:1 } },

  { id:"ISFJ", name:"温柔打包员", food:"暖心麦乐鸡", foodArt:"bunBurgerIcon", acc:"heart",
    pal:{ b:"#E4B070", y:"#FFF3D0", p:"#F6B8C8" }, keys:["默默记得","多带一份","不张扬"],
    desc:"你会多拿两包番茄酱，因为你知道有人一定会需要，而且不说。",
    slogan:"我把照顾藏在了打包袋里。",
    combo:"多带一份暖心套餐", recipe:{ patty:1, cheese:1, lettuce:1, egg:1 } },

  { id:"ESTJ", name:"高峰指挥官", food:"高效能量套餐", foodArt:"fries", acc:"crown",
    pal:{ b:"#C08A3C", y:"#FFC72C", p:"#E8C09A" }, keys:["现场调度","准时交付","秩序感"],
    desc:"高峰期你就是那条隐形传送带：谁先做、谁配餐、谁交付，全在你心里排好了。",
    slogan:"队伍在动，我就放心了。",
    combo:"高峰调度能量套餐", recipe:{ patty:2, cheese:1, onion:1, bacon:1 } },

  { id:"ESFJ", name:"麦门社交之王", food:"双人分享套餐", foodArt:"heartFries", acc:"heart",
    pal:{ b:"#E8A060", y:"#FFC72C", p:"#F6A8B8" }, keys:["热情招呼","记得口味","全场熟人"],
    desc:"你进门的三十秒内，已经和店员、隔壁桌以及外卖小哥完成了友好交流。",
    slogan:"来都来了，那就一起吃吧。",
    combo:"双人份快乐分享套餐", recipe:{ patty:2, cheese:2, tomato:1, lettuce:1 } },

  { id:"ISTP", name:"汉堡机械师", food:"自由组装汉堡", foodArt:"burger2", acc:"cheese",
    pal:{ b:"#8A8F98", y:"#B0B8C4", p:"#D0D6E0" }, keys:["动手拆解","冷静排障","不废话"],
    desc:"你觉得任何汉堡都可以被拆开重组成更好的版本，而且你真的带了自己的工具思路。",
    slogan:"别问我为什么，我先看看它怎么构成的。",
    combo:"可拆解自由组套餐", recipe:{ patty:2, cheese:1, onion:1, pickle:1 } },

  { id:"ISFP", name:"美味艺术家", food:"草莓甜筒", foodArt:"swirl", acc:"heart",
    pal:{ b:"#E8A0B8", y:"#FFF3D0", p:"#F49BB4" }, keys:["感官优先","安静审美","讲究配色"],
    desc:"你会因为「今天的甜筒和晚霞很配」而多买一个，并且觉得这非常合理。",
    slogan:"好吃是一种不需要解释的审美。",
    combo:"晚霞配色甜筒套餐", recipe:{ patty:1, cheese:1, tomato:1 } },

  { id:"ESTP", name:"极速薯条骑士", food:"黄金大薯", foodArt:"friesKing", acc:"friesCrown",
    pal:{ b:"#D89A3C", y:"#FFD54F", p:"#F4B860" }, keys:["当场行动","速度信仰","热的最香"],
    desc:"你坚信薯条的最佳赏味期是出锅后 90 秒，并愿意为此冲刺。",
    slogan:"趁热，现在，立刻。",
    combo:"极速黄金大薯套餐", recipe:{ patty:2, cheese:2, bacon:1 } },

  { id:"ESFP", name:"麦门气氛组", food:"快乐派对奶昔", foodArt:"swirl", acc:"star",
    pal:{ b:"#F0A85C", y:"#FFC72C", p:"#F6A0B8" }, keys:["开心就吃","现场氛围","带动全场"],
    desc:"你在的地方就有笑声，而你的奶昔永远比别人多一颗樱桃。",
    slogan:"快乐是会传染的，尤其是加冰的那种。",
    combo:"全场最嗨派对套餐", recipe:{ patty:1, cheese:1, egg:1, tomato:1 } }
];
var MBTI_BY_ID = {};
MBTI_TYPES.forEach(function(t){ MBTI_BY_ID[t.id] = t; });

/* 配对剧情模板：按两型的首字母维度组合规则生成 */
function mbtiPairLine(a, b){
  var A = MBTI_BY_ID[a], B = MBTI_BY_ID[b];
  if(!A || !B) return "这两位一起点餐，光是决定谁先开口就花了五分钟。";
  if(a === b) return "两个" + A.name + "凑在一起，会把同一份套餐点成一场专业研讨会。";
  var same = 0, i;
  for(i = 0; i < 4; i++) if(a.charAt(i) === b.charAt(i)) same++;
  var planA = a.charAt(3) === "J", planB = b.charAt(3) === "J";
  var outA = a.charAt(0) === "E", outB = b.charAt(0) === "E";
  var head;
  if(planA && !planB) head = A.name + "已经排好了取餐顺序，" + B.name + "还在柜台前改主意。";
  else if(!planA && planB) head = B.name + "带来了完整计划，" + A.name + "带来了一点点不可控性。";
  else if(planA && planB) head = "两位都带了计划，于是他们先花了十分钟合并了两份计划。";
  else head = "两位都没有计划，于是他们决定：先坐下，再决定。";
  var mid;
  if(outA && outB) mid = "整间店都知道他们点了什么，包括后排的陌生人。";
  else if(!outA && !outB) mid = "他们用最小的音量完成了最高效的一次点餐。";
  else mid = "一个负责和店员沟通，一个负责在旁边默默点头并递上酱料。";
  var tail = same >= 3 ? "他们很快就发现，彼此的点餐逻辑几乎一模一样。"
           : same <= 1 ? "他们互相完全无法理解对方的点餐逻辑，但薯条是共享的。"
           : "他们在第三个选项上达成了一致，其余保持分歧。";
  return head + mid + tail;
}

/* ---------- 计分 ---------- */
function mbtiScores(answers){
  var s = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
  (answers || []).forEach(function(ans){
    if(!ans) return;
    var q = MBTI_QUESTIONS.filter(function(x){ return x.id === ans.qid; })[0];
    if(!q) return;
    var d = MBTI_DIM_BY_ID[q.dim];
    if(!d) return;
    var letter = ans.pick === "a" ? d.a : d.b;
    s[letter]++;
  });
  return s;
}
function mbtiTypeOf(scores){
  function pickDim(x, y){
    if(scores[x] > scores[y]) return x;
    if(scores[y] > scores[x]) return y;
    return x;                       /* 3 题为奇数，理论上不会平局；平局时取前者保持稳定 */
  }
  return pickDim("E","I") + pickDim("S","N") + pickDim("T","F") + pickDim("J","P");
}
/* 各维度倾向百分比（保留真实比例，不包装成高精度测量） */
function mbtiRatios(scores){
  var out = {};
  MBTI_DIMS.forEach(function(d){
    var a = scores[d.a] || 0, b = scores[d.b] || 0, t = a + b;
    out[d.id] = { a:a, b:b, pct: t ? Math.round(a / t * 100) : 50 };
  });
  return out;
}

/* ---------- 人格兔子像素画 ---------- */
function mbtiBunnySVG(typeId, size, expr){
  var t = MBTI_BY_ID[typeId];
  if(!t) return artSVG("bunBunnyIdle", { size:size || 72 });
  var pal = {};
  for(var k in t.pal) pal[k] = t.pal[k];
  return artSVG("bunBunny" + (expr ? expr.charAt(0).toUpperCase() + expr.slice(1) : "Idle"), { size:size || 72, palette:pal });
}

/* ---------- 生命周期 ---------- */
function mbtiStop(){
  if(mbti && mbti.revealTimer){ clearTimeout(mbti.revealTimer); mbti.revealTimer = 0; }
  if(mbti && mbti.revealStep){ clearInterval(mbti.revealStep); mbti.revealStep = 0; }
}
function mbtiStart(){
  mbtiStop();
  /* 打乱题目顺序，但每道题的计分方向由数据决定，不受顺序影响 */
  var order = MBTI_QUESTIONS.map(function(q){ return q.id; });
  for(var i = order.length - 1; i > 0; i--){
    var j = rnd(i + 1), tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  mbti = { stage:"quiz", order:order, idx:0, answers:[], revealStep:0, result:null, locking:false };
  state.mbtiProgress = { order:order, idx:0, answers:[] };
  save();
  mbtiRender();
}
function mbtiResume(){
  var p = state.mbtiProgress;
  if(!p || !p.order || !p.order.length){ mbtiStart(); return; }
  mbtiStop();
  mbti = { stage:"quiz", order:p.order, idx:p.idx || 0, answers:p.answers || [], revealStep:0, result:null, locking:false };
  mbtiRender();
}
function mbtiAnswer(pick, btn){
  if(!mbti || mbti.stage !== "quiz") return;
  if(mbti.locking) return;                    /* 防连点：过渡期间不再接受输入 */
  var qid = mbti.order[mbti.idx];
  var q = MBTI_QUESTIONS.filter(function(x){ return x.id === qid; })[0];
  if(!q) return;
  var d = MBTI_DIM_BY_ID[q.dim];
  if(!d) return;
  mbti.locking = true;

  /* 立即给出选中反馈（点到的那一项高亮，另一项变暗） */
  var host = document.getElementById("arcadeMbti");
  if(host){
    var opts = host.querySelectorAll(".mb-opt");
    for(var i = 0; i < opts.length; i++){
      var hit = btn ? (opts[i] === btn) : (opts[i].getAttribute("data-mbpick") === pick);
      opts[i].classList.add(hit ? "on" : "off");
    }
  }
  SFX.play("click");
  toast(pick === "a" ? d.aName : d.bName, pick === "a" ? "A" : "B");

  /* 按「题目序号」写入答案：同一题只保留一份，返回修改会直接覆盖，不会重复计分 */
  mbti.answers[mbti.idx] = { qid:qid, pick:pick };
  var last = (mbti.idx >= mbti.order.length - 1);
  state.mbtiProgress = { order:mbti.order, idx:last ? mbti.order.length : (mbti.idx + 1), answers:mbti.answers };
  save();

  /* 短过渡后推进；最后一题直接进入结算 */
  setTimeout(function(){
    if(!mbti || mbti.stage !== "quiz"){ return; }
    mbti.locking = false;
    if(last){ mbtiFinish(); return; }
    mbti.idx++;
    state.mbtiProgress = { order:mbti.order, idx:mbti.idx, answers:mbti.answers };
    save();
    mbtiRender();
  }, 190);
}
function mbtiBack(){
  if(!mbti || mbti.stage !== "quiz" || mbti.idx <= 0) return;
  if(mbti.locking) return;
  mbti.idx--;
  mbti.answers.length = mbti.idx;   /* 截断后面已答内容，重新答时按索引覆盖，不重复计分 */
  state.mbtiProgress = { order:mbti.order, idx:mbti.idx, answers:mbti.answers };
  save();
  SFX.play("hover");
  mbtiRender();
}
function mbtiFinish(){
  var scores = mbtiScores(mbti.answers);
  var type = mbtiTypeOf(scores);
  mbti.stage = "reveal";
  mbti.result = { type:type, scores:scores, ratios:mbtiRatios(scores), at:todayMMDD() };
  mbti.revealStep = 0;
  mbtiRender();
  /* 四维度依次点亮 → 流星 → 开盒 */
  var step = 0;
  mbti.revealStep = setInterval(function(){
    step++;
    var host = document.getElementById("mbReveal");
    if(host){
      var dims = host.querySelectorAll(".mb-dim");
      var d = dims[step - 1];
      if(d){
        d.classList.add("on");
        var bar = d.querySelector("i");
        if(bar) bar.style.width = (bar.getAttribute("data-w") || 50) + "%";
      }
    }
    SFX.play("page");
    if(step >= 4){
      clearInterval(mbti.revealStep);
      mbti.revealStep = 0;
      SFX.play("meteor");
      if(mbti) mbti.revealTimer = setTimeout(function(){ mbtiConfirmResult(); }, 700);
    }
  }, 360);
}
function mbtiConfirmResult(){
  mbtiStop();
  if(!mbti || !mbti.result) return;
  var r = mbti.result, t = MBTI_BY_ID[r.type];
  mbti.stage = "result";
  state.mbti = r;
  state.mbtiHistory[r.type] = (state.mbtiHistory[r.type] || 0) + 1;
  if(state.mbtiSkins.indexOf(r.type) < 0) state.mbtiSkins.push(r.type);
  if(!state.mbtiEquipped) state.mbtiEquipped = r.type;
  state.mbtiProgress = null;
  save();
  SFX.play("achievement");
  addCoins(60);
  /* 徽章 */
  var got = [];
  if(unlockBadge("mbti_first", true)) got.push("麦门自我探索者");
  if(Object.keys(state.mbtiHistory).length >= 3 && unlockBadge("mbti_researcher", true)) got.push("人格研究员");
  got.forEach(function(n){ toast("解锁徽章：" + n, "★"); });
  mbtiRender();
  renderMuseum && renderMuseum();
}
/* 导入人格套餐到 DIY 工坊（明确标记为创意配方，不代表在售商品） */
function mbtiImportCombo(typeId){
  var t = MBTI_BY_ID[typeId];
  if(!t) return;
  state.diy = { bunTop:1, patty:0, pattyChicken:0, cheese:0, lettuce:0, tomato:0, egg:0, pickle:0, onion:0, bacon:0 };
  for(var k in t.recipe) state.diy[k] = t.recipe[k];
  save();
  if(typeof renderDIY === "function") renderDIY();
  unlockBadge("mbti_philos", true);
  SFX.play("cart");
  toast("已导入创意配方：" + t.combo + "（仅供创作）", "🍔");
  var el = document.getElementById("diy");
  if(el && el.scrollIntoView) el.scrollIntoView({ behavior:"smooth" });
}
function mbtiSaveCard(){
  var el = document.getElementById("mbCard");
  if(!el || typeof downloadCard !== "function"){ toast("暂时无法保存，请稍后再试", "！"); return; }
  downloadCard("mbCard", "麦门人格卡.png");
}

/* ---------- 渲染 ---------- */
function mbtiRender(){
  var host = document.getElementById("arcadeMbti");
  if(!host) return;
  var inner = host.querySelector(".crt-inner") || host;

  /* 首页 */
  if(!mbti || mbti.stage === "intro"){
    var has = state.mbti && MBTI_BY_ID[state.mbti.type] ? MBTI_BY_ID[state.mbti.type] : null;
    var prog = state.mbtiProgress;
    inner.innerHTML =
      '<div class="mb-intro">' +
        '<div class="mb-lab">' + mbtiBunnySVG(state.mbtiEquipped || "ENFP", 96, "happy") + artSVG("burger", { size:36 }) + "</div>" +
        "<h3>麦门人格研究所</h3>" +
        '<p class="mb-sub">测测你是哪一种麦门人？</p>' +
        '<p class="mb-quote">「欢迎来到麦门人格研究所！经过严谨且非常不严谨的研究，我们发现，人类可能有 16 种吃汉堡的方式。」</p>' +
        (has ? '<div class="mb-last">上次结果：<b>' + has.id + "｜" + has.name + "</b></div>" : "") +
        (prog && prog.answers && prog.answers.length ? '<div class="mb-last">有未完成的测试（第 ' + (prog.idx + 1) + "/12 题），可以继续。</div>" : "") +
        '<div class="mb-btns">' +
          '<button class="btn btn-lg" data-mbstart="1">开始研究 ▶</button>' +
          (prog && prog.answers && prog.answers.length ? '<button class="btn btn-sm btn-ghost" data-mbresume="1">继续上次 ↻</button>' : "") +
          (has ? '<button class="btn btn-sm btn-ghost" data-mbresult="1">查看结果卡</button>' : "") +
          '<button class="btn btn-sm btn-ghost" data-mbdex="1">人格图鉴</button>' +
          '<button class="btn btn-sm btn-ghost" data-mbpair="1">配对实验室</button>' +
        "</div>" +
        '<p class="mb-note">本测试为娱乐性人格探索，非官方 MBTI 测评或心理诊断工具。</p>' +
      "</div>";
    bindMb(inner);
    return;
  }

  /* 答题 */
  if(mbti.stage === "quiz"){
    var qid = mbti.order[mbti.idx];
    var q = MBTI_QUESTIONS.filter(function(x){ return x.id === qid; })[0];
    if(!q){ mbtiFinish(); return; }
    var d = MBTI_DIM_BY_ID[q.dim];
    inner.innerHTML =
      '<div class="mb-quiz">' +
        '<div class="mb-prog"><i style="width:' + Math.round((mbti.idx) / 12 * 100) + '%"></i></div>' +
        '<div class="mb-qhead"><span class="mb-qn">第 ' + (mbti.idx + 1) + " / 12 题</span>" +
          '<span class="mb-qdim" style="color:' + d.color + '">' + d.name + "</span></div>" +
        '<div class="mb-scene">' + artSVG(q.art, { size:52 }) + "<p>" + esc(q.scene) + "</p></div>" +
        '<div class="mb-mascot">' + mbtiBunnySVG(state.mbtiEquipped || "ENFP", 64, "idle") + "</div>" +
        '<div class="mb-choices">' +
          '<button class="mb-opt" data-mbpick="a"><b>A</b><span>' + esc(q.a) + "</span></button>" +
          '<button class="mb-opt" data-mbpick="b"><b>B</b><span>' + esc(q.b) + "</span></button>" +
        "</div>" +
        '<div class="mb-btns">' +
          '<button class="btn btn-sm btn-ghost" data-mbback="1"' + (mbti.idx ? "" : " disabled") + ">← 上一题</button>" +
          '<button class="btn btn-sm btn-night" data-mbquit="1">退出</button>' +
        "</div>" +
      "</div>";
    bindMb(inner);
    return;
  }

  /* 揭晓动画 */
  if(mbti.stage === "reveal"){
    var rr = mbti.result;
    inner.innerHTML =
      '<div class="mb-reveal" id="mbReveal">' +
        '<div class="mb-box">' + artSVG("star", { size:44 }) + "</div>" +
        '<div class="mb-dims">' + MBTI_DIMS.map(function(dd){
          var pct = rr.ratios[dd.id].pct;
          return '<div class="mb-dim"><span>' + dd.name + "</span>" +
            '<div class="mbd-bar"><i data-w="' + pct + '" style="width:0"></i></div>' +
            "<small>" + dd.aName + " " + pct + "% · " + dd.bName + " " + (100 - pct) + "%</small></div>";
        }).join("") + "</div>" +
        '<p class="mb-rvtxt">人格匹配中…</p>' +
      "</div>";
    return;
  }

  /* 结果 */
  if(mbti.stage === "result"){
    var r = mbti.result, t = MBTI_BY_ID[r.type];
    inner.innerHTML =
      '<div class="mb-result">' +
        '<div class="mb-card" id="mbCard">' +
          '<div class="mbc-head">' + artSVG("star", { size:26 }) + "<span>麦门人格卡</span><small>" + esc(r.at) + "</small></div>" +
          '<div class="mbc-art">' + mbtiBunnySVG(t.id, 110, "happy") + artSVG(t.acc, { size:34 }) + "</div>" +
          '<div class="mbc-code">' + t.id + "</div>" +
          '<div class="mbc-name">' + esc(t.name) + "</div>" +
          '<div class="mbc-food">' + artSVG(t.foodArt, { size:28 }) + " 代表食物：" + esc(t.food) + "</div>" +
          '<div class="mbc-keys">' + t.keys.map(function(k){ return "<span>" + esc(k) + "</span>"; }).join("") + "</div>" +
          '<div class="mbc-dims">' + MBTI_DIMS.map(function(dd){
            var o = r.ratios[dd.id];
            return '<div class="mbcd"><span>' + dd.name + "</span><div class=\"mbcd-bar\">" +
              '<i class="a" style="width:' + o.pct + '%"></i></div>' +
              "<small>" + dd.aName + " " + o.pct + "% · " + dd.bName + " " + (100 - o.pct) + "%</small></div>";
          }).join("") + "</div>" +
          '<p class="mbc-desc">' + esc(t.desc) + "</p>" +
          '<p class="mbc-slogan">「' + esc(t.slogan) + "」</p>" +
        "</div>" +
        '<div class="mb-combo"><h4>专属人格套餐</h4>' +
          '<div class="mbc-combo"><b>' + esc(t.combo) + "</b>" +
          "<small>创意组合 · 仅供创作，不代表实际在售商品</small>" +
          '<div class="mbcc-ings">' + Object.keys(t.recipe).map(function(k){
            return "<span>" + esc(MBTI_ING_NAME[k] || k) + " ×" + t.recipe[k] + "</span>";
          }).join("") + "</div></div>" +
          '<div class="mb-btns">' +
            '<button class="btn btn-sm" data-mbimport="' + t.id + '">导入 DIY 工坊 🍔</button>' +
            '<button class="btn btn-sm btn-ghost" data-mbsave="1">保存卡片图片</button>' +
          "</div>" +
        "</div>" +
        '<div class="mb-btns">' +
          '<button class="btn btn-sm btn-ghost" data-mbagain="1">重新测试 ↻</button>' +
          '<button class="btn btn-sm btn-ghost" data-mbdex="1">人格图鉴</button>' +
          '<button class="btn btn-sm btn-ghost" data-mbpair="1">配对实验室</button>' +
          '<button class="btn btn-sm btn-night" data-mbquit="1">返回</button>' +
        "</div>" +
      "</div>";
    bindMb(inner);
    state.mbtiRead[t.id] = 1;
    save();
    mbtiCheckReadBadge();
    return;
  }

  /* 图鉴 */
  if(mbti.stage === "dex"){
    inner.innerHTML =
      '<div class="mb-dex"><h3>16 型麦门人格图鉴</h3>' +
        '<div class="mb-grid">' + MBTI_TYPES.map(function(t){
          var got = !!state.mbtiHistory[t.id];
          return '<button class="mb-cell' + (got ? " got" : "") + '" data-mbview="' + t.id + '">' +
            (got ? mbtiBunnySVG(t.id, 56, "idle") : '<span class="mb-lock">' + t.id + "</span>") +
            "<b>" + (got ? esc(t.name) : "？？？") + "</b><small>" + t.id + "</small></button>";
        }).join("") + "</div>" +
        '<div class="mb-btns"><button class="btn btn-sm btn-night" data-mbhome="1">返回研究所</button></div>' +
      "</div>";
    bindMb(inner);
    return;
  }

  /* 图鉴详情 */
  if(mbti.stage === "view"){
    var vt = MBTI_BY_ID[mbti.viewId];
    inner.innerHTML =
      '<div class="mb-view">' + mbtiBunnySVG(vt.id, 96, "happy") +
        "<h3>" + vt.id + "｜" + esc(vt.name) + "</h3>" +
        '<div class="mbv-food">' + artSVG(vt.foodArt, { size:30 }) + " 代表食物：" + esc(vt.food) + "</div>" +
        '<div class="mbc-keys">' + vt.keys.map(function(k){ return "<span>" + esc(k) + "</span>"; }).join("") + "</div>" +
        "<p>" + esc(vt.desc) + "</p>" +
        '<p class="mbc-slogan">「' + esc(vt.slogan) + "」</p>" +
        '<div class="mb-btns">' +
          (state.mbtiHistory[vt.id] ? '<button class="btn btn-sm" data-mbequip="' + vt.id + '">' +
            (state.mbtiEquipped === vt.id ? "已装备 ✓" : "装备这只兔子") + "</button>" : "") +
          '<button class="btn btn-sm btn-night" data-mbdex="1">返回图鉴</button>' +
        "</div>" +
      "</div>";
    bindMb(inner);
    state.mbtiRead[vt.id] = 1;
    save();
    mbtiCheckReadBadge();
    return;
  }

  /* 配对实验室 */
  if(mbti.stage === "pair"){
    var opts = MBTI_TYPES.map(function(t){
      return '<option value="' + t.id + '"' + (mbti.pairA === t.id ? " selected" : "") + ">" + t.id + " · " + esc(t.name) + "</option>";
    }).join("");
    var opts2 = MBTI_TYPES.map(function(t){
      return '<option value="' + t.id + '"' + (mbti.pairB === t.id ? " selected" : "") + ">" + t.id + " · " + esc(t.name) + "</option>";
    }).join("");
    var line = (mbti.pairA && mbti.pairB) ? mbtiPairLine(mbti.pairA, mbti.pairB) : "选择两个人格，看看他们一起点餐会发生什么。";
    inner.innerHTML =
      '<div class="mb-pair"><h3>人格配对实验室</h3>' +
        '<p class="mb-sub">如果两个人格一起去麦当劳，会发生什么？（纯属趣味，不代表人际关系预测）</p>' +
        '<div class="mbp-sel"><select id="mbPairA">' + opts + "</select>" +
          "<span>×</span><select id=\"mbPairB\">" + opts2 + "</select>" +
          '<button class="btn btn-sm" data-mbpairgo="1">生成剧情</button></div>' +
        '<div class="mbp-art">' + mbtiBunnySVG(mbti.pairA || "ENFP", 64, "idle") +
          artSVG("heart", { size:22 }) + mbtiBunnySVG(mbti.pairB || "INTJ", 64, "idle") + "</div>" +
        '<p class="mbp-line">' + esc(line) + "</p>" +
        '<div class="mb-btns"><button class="btn btn-sm btn-night" data-mbhome="1">返回研究所</button></div>' +
      "</div>";
    bindMb(inner);
    return;
  }
}
var MBTI_ING_NAME = { patty:"肉饼", pattyChicken:"鸡排", cheese:"芝士", lettuce:"生菜",
  tomato:"番茄", egg:"蛋", pickle:"酸黄瓜", onion:"洋葱", bacon:"培根" };

function mbtiCheckReadBadge(){
  if(Object.keys(state.mbtiRead).length >= 16 && unlockBadge("mbti_psych", true)){
    toast("解锁徽章：兔兔心理学家", "★");
  }
}
function bindMb(inner){
  /* 注意：addEventListener 的回调第一个参数是 Event，不是元素。
     旧写法把事件对象当元素取 getAttribute，会抛 TypeError 并中断作答。
     这里统一把「元素」通过闭包传进去，回调收到的就是元素本身。 */
  function q(sel, fn){ var b = inner.querySelector(sel); if(b) b.addEventListener("click", function(){ fn(b); }); }
  function qa(sel, fn){
    inner.querySelectorAll(sel).forEach(function(el){ el.addEventListener("click", function(){ fn(el); }); });
  }
  q("[data-mbstart]", function(){ SFX.play("page"); mbtiStart(); });
  q("[data-mbresume]", function(){ SFX.play("page"); mbtiResume(); });
  q("[data-mbresult]", function(){
    mbtiStop();
    mbti = { stage:"result", result:state.mbti, order:[], idx:0, answers:[] };
    mbtiRender();
  });
  qa("[data-mbpick]", function(b){ mbtiAnswer(b.getAttribute("data-mbpick"), b); });
  q("[data-mbback]", mbtiBack);
  q("[data-mbagain]", function(){ SFX.play("page"); mbtiStart(); });
  q("[data-mbdex]", function(){ mbti.stage = "dex"; SFX.play("page"); mbtiRender(); });
  q("[data-mbhome]", function(){ mbtiStop(); mbti = null; mbtiRender(); });
  q("[data-mbsave]", mbtiSaveCard);
  qa("[data-mbimport]", function(b){ mbtiImportCombo(b.getAttribute("data-mbimport")); });
  qa("[data-mbview]", function(b){
    mbti.viewId = b.getAttribute("data-mbview");
    mbti.stage = "view";
    SFX.play("click");
    mbtiRender();
  });
  qa("[data-mbequip]", function(b){
    state.mbtiEquipped = b.getAttribute("data-mbequip");
    save(); SFX.play("upgrade"); toast("已装备人格兔子", "★"); mbtiRender();
  });
  q("[data-mbpair]", function(){
    if(!mbti) mbti = { stage:"pair", order:[], idx:0, answers:[] };
    mbti.stage = "pair";
    if(!mbti.pairA) mbti.pairA = state.mbti ? state.mbti.type : "ENFP";
    if(!mbti.pairB) mbti.pairB = "INTJ";
    SFX.play("page");
    mbtiRender();
  });
  q("[data-mbpairgo]", function(){
    var a = document.getElementById("mbPairA"), b = document.getElementById("mbPairB");
    if(a) mbti.pairA = a.value;
    if(b) mbti.pairB = b.value;
    var key = mbti.pairA + "_" + mbti.pairB;
    if(mbti.pairA !== mbti.pairB && state.mbtiPairs.indexOf(key) < 0){
      state.mbtiPairs.push(key);
      if(state.mbtiPairs.length >= 10 && unlockBadge("mbti_social", true)) toast("解锁徽章：麦门社交观察员", "★");
    }
    save();
    SFX.play("meteor");
    mbtiRender();
  });
  q("[data-mbquit]", function(){
    mbtiStop(); mbti = null; SFX.play("page"); mbtiRender();
  });
  mbBindKeys();
}
/* 键盘作答（桌面端补充通道）：A/B 或 1/2 选择，← 返回上一题 */
function mbBindKeys(){
  if(mbBindKeys.done) return;
  mbBindKeys.done = true;
  document.addEventListener("keydown", function(e){
    if(!mbti || mbti.stage !== "quiz") return;
    var tag = (e.target && e.target.tagName) || "";
    if(tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    var k = (e.key || "").toLowerCase();
    if(k === "a" || k === "1"){ e.preventDefault(); mbtiAnswer("a", null); }
    else if(k === "b" || k === "2"){ e.preventDefault(); mbtiAnswer("b", null); }
    else if(k === "arrowleft" || k === "backspace"){ e.preventDefault(); mbtiBack(); }
  });
}
