/* =========================================================
 * McPixel · 麦麦打工日记（餐厅经营模拟）
 * 接单 → 制作（含煎/炸进度）→ 配餐 → 交付 → 星级评分
 * 独立组件，不与点餐系统强耦合
 * ========================================================= */
var work = null;

var WORK_BURGER_PARTS = [
  { id:"patty",   name:"牛肉饼", art:"patty",       cook:"grill" },
  { id:"cheese",  name:"芝士",   art:"cheese" },
  { id:"lettuce", name:"生菜",   art:"lettuce" },
  { id:"tomato",  name:"番茄",   art:"tomato" },
  { id:"pickle",  name:"酸黄瓜", art:"pickle" },
  { id:"onion",   name:"洋葱",   art:"onion" },
  { id:"sauce",   name:"酱料",   art:"sauceDrip" }
];
var WORK_SIDES = [
  { id:"fries",   name:"薯条",   art:"fries",   cook:"fryer" },
  { id:"nuggets", name:"麦乐鸡", art:"nuggets", cook:"fryer" },
  { id:"drink",   name:"可乐",   art:"cup" }
];
var WORK_CUSTOMERS = [
  { id:"normal", name:"普通顾客",     art:"bunny",        patience:52, tip:1,    desc:"慢慢来，我不着急" },
  { id:"office", name:"赶时间上班族", art:"bunnySurprise", patience:26, tip:1.6,  desc:"30 秒后我有个会！" },
  { id:"picky",  name:"挑食顾客",     art:"bunnySad",     patience:44, tip:1.4,  desc:"这个不要，那个也不要" },
  { id:"special",name:"隐藏特殊角色", art:"bunnyWave",    patience:60, tip:2.5,  desc:"我要的有点多…" }
];
var WORK_RANKS = [
  { id:"intern", name:"实习店员", need:0,    desc:"工牌还是新的" },
  { id:"senior", name:"正式店员", need:8,    desc:"托盘已经稳了" },
  { id:"gold",   name:"金牌店员", need:20,   desc:"微笑从不掉线" },
  { id:"manager",name:"麦麦店长", need:40,   desc:"钥匙串很沉" }
];
var WORK_LEVELS = [
  { id:1, name:"新手期",   customers:3, maxWait:1, complexity:2, patienceMul:1.35, desc:"一次只有一位顾客，时间充裕" },
  { id:2, name:"早餐高峰", customers:4, maxWait:1, complexity:3, patienceMul:1.15, desc:"订单开始挑剔起来" },
  { id:3, name:"午市高峰", customers:5, maxWait:2, complexity:3, patienceMul:1.0,  desc:"两位顾客同时等待" },
  { id:4, name:"晚市 rush",customers:6, maxWait:2, complexity:4, patienceMul:0.9,  desc:"超大订单出没" },
  { id:5, name:"特别营业", customers:7, maxWait:3, complexity:5, patienceMul:0.8,  desc:"隐藏角色也会光临" }
];
var WORK_EVENTS = [
  { id:"ev_stack", text:"★ 随机事件：一位顾客指名要「十层肉饼」，做得到吗？", apply:function(w){
      if(w.customers.length){ var c = w.customers[w.customers.length-1]; c.req.burger.patty = 10; c.desc10 = true; }
    } },
  { id:"ev_bunny", text:"★ 随机事件：M兔子偷偷吃掉一根薯条，悄悄补上了。", apply:function(w){
      w.friesStock = Math.max(0, (w.friesStock||0) - 1);
    } },
  { id:"ev_sauce", text:"★ 随机事件：顾客要求一种「不存在的神秘酱料」，请随意发挥。", apply:function(w){
      w.mysteryBonus = true;
    } },
  { id:"ev_rush",  text:"★ 随机事件：突然进来一波人！又多了一位顾客。", apply:function(w){
      if(w.pending && w.pending.length){ w.customers.push(w.pending.shift()); }
    } }
];

function workRankInfo(){ for(var i=0;i<WORK_RANKS.length;i++) if(WORK_RANKS[i].id===state.workRank) return WORK_RANKS[i]; return WORK_RANKS[0]; }

/* ---------- 难度阶段（V2.5） ---------- */
var WORK_STAGES = [
  { id:"rookie",    name:"新手模式", levels:[1,2], desc:"一次一位顾客 · 订单简单 · 耐心充足" },
  { id:"normal",    name:"普通模式", levels:[3,4], desc:"最多两位顾客 · 偶尔一项配料要求" },
  { id:"challenge", name:"挑战模式", levels:[5],   desc:"多位顾客 · 组合订单 · 隐藏角色" }
];
function workStageOf(level){
  for(var i = 0; i < WORK_STAGES.length; i++){
    if(WORK_STAGES[i].levels.indexOf(level) >= 0) return WORK_STAGES[i];
  }
  return WORK_STAGES[0];
}
/* 可去掉的配料（必须是真实存在的食材） */
var WORK_SPECIAL_NO = ["pickle", "onion", "tomato"];

/* ---------- 订单生成（V2.5：有效性受控，难度随阶段递增） ---------- */
function workShuffle(a){
  for(var i = a.length - 1; i > 0; i--){ var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/* 校验订单是否在当前游戏内确实可完成：食材存在、数量为非负整数、备注合法 */
function workOrderValid(req){
  var okIds = {}, sideIds = {}, i;
  for(i = 0; i < WORK_BURGER_PARTS.length; i++) okIds[WORK_BURGER_PARTS[i].id] = 1;
  for(i = 0; i < WORK_SIDES.length; i++) sideIds[WORK_SIDES[i].id] = 1;
  if(!req || !req.burger || !(req.burger.patty >= 1)) return false;
  for(var k in req.burger){
    if(!okIds[k]) return false;
    var v = req.burger[k];
    if(typeof v !== "number" || v < 0 || Math.round(v) !== v) return false;
  }
  for(var s = 0; s < (req.sides || []).length; s++) if(!sideIds[req.sides[s]]) return false;
  for(var n = 0; n < (req.no || []).length; n++) if(!okIds[req.no[n]] || WORK_SPECIAL_NO.indexOf(req.no[n]) < 0) return false;
  return true;
}
function workMakeOrder(level, opts){
  opts = opts || {};
  var L = WORK_LEVELS[Math.min(level - 1, WORK_LEVELS.length - 1)];
  var stage = workStageOf(level).id;
  var validIds = WORK_BURGER_PARTS.map(function(p){ return p.id; });

  /* 顾客类型：新手阶段不出现挑食与隐藏角色 */
  var pool = stage === "rookie"  ? ["normal","normal","normal","office"] :
             stage === "normal"  ? ["normal","normal","normal","office","picky"] :
                                   ["normal","normal","office","picky","special"];
  var tw = opts.forceCustomer || pick(pool);
  var cu = WORK_CUSTOMERS.filter(function(c){ return c.id === tw; })[0] || WORK_CUSTOMERS[0];

  /* 肉饼层数：新手 ≤2，普通 ≤3，挑战 ≤4（荒诞超大订单仅在趣味事件里出现） */
  var maxPatty = stage === "rookie" ? 2 : stage === "normal" ? 3 : 4;
  var burger = { patty: 1 + rnd(maxPatty) };

  /* 配料：只从可制作清单中选，每样只要 1 份，种类数受阶段限制 */
  var extraKinds = stage === "rookie" ? 1 : stage === "normal" ? 2 : Math.min(3, Math.max(2, L.complexity));
  var cand = workShuffle(validIds.filter(function(id){ return id !== "patty"; }));
  for(var i = 0; i < extraKinds && i < cand.length; i++) burger[cand[i]] = 1;

  /* 特殊要求：每笔订单最多 1 项，且新手阶段不出现 */
  var no = [];
  if(cu.id === "picky" && stage !== "rookie"){
    var pickable = Object.keys(burger).filter(function(k){ return k !== "patty" && WORK_SPECIAL_NO.indexOf(k) >= 0; });
    if(pickable.length){
      var n = pick(pickable); delete burger[n]; no.push(n);
    }else{
      var d = pick(WORK_SPECIAL_NO); burger[d] = 0; no.push(d);
    }
  }

  /* 配餐：新手 ≤1 份，普通 ≤2 份，挑战 ≤3 份 */
  var maxSides = stage === "rookie" ? 1 : stage === "normal" ? 2 : 3;
  var sides = [], want = rnd(maxSides + 1);
  for(var s2 = 0; s2 < want; s2++) sides.push(pick(WORK_SIDES).id);
  /* 隐藏角色：稍大但仍可完成的订单（不再是堆到无法制作） */
  if(cu.id === "special" && stage === "challenge"){
    burger.patty = Math.min(4, burger.patty + 1);
    if(sides.length < 2) sides.push("fries");
  }

  var need = 0;
  for(var k2 in burger) need += burger[k2];
  need += sides.length;
  var req = { burger:burger, no:no, sides:sides, need:need, extraTip:cu.tip, cuId:cu.id, stage:stage };
  /* 有效性兜底：任何异常都退化为一个必定可完成的基础订单 */
  if(!workOrderValid(req)) return { burger:{ patty:1 }, no:[], sides:[], need:1, extraTip:1, cuId:"normal", stage:stage };
  return req;
}
/* 订单复杂度 → 用于动态计算耐心值 */
function workOrderComplexity(req){
  var n = 0;
  for(var k in req.burger) n += (req.burger[k] || 0);
  n += (req.sides || []).length;
  n += (req.no || []).length * 1.5;
  return n;
}
/* 耐心值：订单越复杂给越久，特殊订单额外加时；不再因稍慢几秒直接失败 */
function workPatienceFor(cu, req, L){
  var typeMul = { office:0.85, normal:1, picky:1.2, special:1.4 }[cu.id] || 1;
  var base = 20 + workOrderComplexity(req) * 4.2;
  var v = base * typeMul * (L.patienceMul || 1);
  if(req.no && req.no.length) v *= 1.15;          /* 有特殊备注 → 给足时间 */
  return Math.max(28, Math.round(v));
}
function workOrderText(req){
  var names = { patty:"肉饼", cheese:"芝士", lettuce:"生菜", tomato:"番茄", pickle:"酸黄瓜", onion:"洋葱", sauce:"酱料" };
  var snames = { fries:"薯条", nuggets:"麦乐鸡", drink:"可乐" };
  var pattyName = { 1:"汉堡", 2:"双层汉堡", 3:"三层汉堡", 4:"四层汉堡" }[req.burger.patty] || (req.burger.patty + " 层汉堡");
  var parts = ["要一个<b>" + pattyName + "</b>"];
  var extras = [];
  for(var k in req.burger){
    if(k === "patty") continue;
    if(req.burger[k] > 0) extras.push(names[k] + " ×" + req.burger[k]);
  }
  if(extras.length) parts.push("加" + extras.join("、"));
  if(req.no && req.no.length) parts.push("<b>不要" + req.no.map(function(n){ return names[n]; }).join("、") + "</b>");
  if(req.sides && req.sides.length) parts.push("再来一份" + req.sides.map(function(s){ return snames[s]; }).join("和"));
  return parts.join("，") + "！";
}

/* ---------- 操作引导：始终告诉玩家下一步该做什么 ---------- */
var WORK_PART_NAME = { patty:"肉饼", cheese:"芝士", lettuce:"生菜", tomato:"番茄", pickle:"酸黄瓜", onion:"洋葱", sauce:"酱料" };
var WORK_SIDE_NAME = { fries:"薯条", nuggets:"麦乐鸡", drink:"可乐" };
function workGuide(){
  if(!work || !work.active) return "";
  var req = work.active.req, b = work.built.burger || {}, sides = work.built.sides || [];
  var needPatty = (req.burger.patty || 0) - (b.patty || 0);
  if(needPatty > 0) return work.pattyStock > 0 ? ("放 " + needPatty + " 块肉饼") : "到煎台煎一块肉饼";
  for(var k in req.burger){
    if(k === "patty") continue;
    if((req.burger[k] || 0) > (b[k] || 0)) return "加" + (WORK_PART_NAME[k] || k);
  }
  var need = {}, got = {};
  (req.sides || []).forEach(function(s){ need[s] = (need[s] || 0) + 1; });
  sides.forEach(function(s){ got[s] = (got[s] || 0) + 1; });
  for(var s2 in need){
    if((need[s2] || 0) > (got[s2] || 0)){
      var nm = WORK_SIDE_NAME[s2] || s2;
      if(s2 === "fries" && work.friesStock <= 0) return "到炸锅炸一份薯条";
      if(s2 === "nuggets" && work.nuggetStock <= 0) return "到炸锅炸一份麦乐鸡";
      return "配一份" + nm;
    }
  }
  for(var k2 in b) if((req.burger[k2] || 0) < (b[k2] || 0)) return "多了东西，点托盘上的食材可以撤掉";
  for(var s3 in got) if((got[s3] || 0) > (need[s3] || 0)) return "配餐多了，点托盘可以撤掉";
  return "配齐了，点「交给顾客 ✓」交付";
}

/* ---------- 生命周期 ---------- */
function workStop(){
  if(work && work.timer){ clearInterval(work.timer); work.timer = 0; }
}
function workStart(level){
  workStop();
  SFX.unlock();
  var L = WORK_LEVELS[Math.min(level-1, WORK_LEVELS.length-1)];
  var all = [], lastHard = false;
  for(var i = 0; i < L.customers; i++){
    /* 不允许连续出现多个高难度顾客 */
    var req = workMakeOrder(level, lastHard ? { forceCustomer:"normal" } : {});
    lastHard = (req.cuId === "picky" || req.cuId === "special");
    all.push(req);
  }
  /* 顾客类型与订单严格配对（以订单生成时确定的类型为准） */
  var queue = all.map(function(req, idx){
    var cu = WORK_CUSTOMERS.filter(function(c){ return c.id === (req.cuId || "normal"); })[0] || WORK_CUSTOMERS[0];
    var p = workPatienceFor(cu, req, L);
    return { idx:idx, type:cu, req:req, patience:p, patienceMax:p, state:"waiting", id:"c" + idx };
  });
  work = {
    level:level, cfg:L, pending:queue,
    customers:[], active:null,
    grill:[], fryer:[], pattyStock:0, friesStock:0, nuggetStock:0, drinkStock:99,
    built:{ burger:{}, sides:[] },
    served:0, perfect:0, total:0, coins:0, stars:0, left:0,
    hint:[], timer:0, running:true, paused:false, phase:"play", events:[]
  };
  for(var j = 0; j < L.maxWait && j < queue.length; j++) work.customers.push(queue[j]);
  work.pending = queue.slice(L.maxWait);
  if(!work.active && work.customers.length) work.active = work.customers[0];
  workRender();
  work.timer = setInterval(workTick, 100);
  SFX.play("start");
  SFX.playBgm("restaurant");
}
function workEnsureVisible(){
  var host = $("#arcadeWork");
  return host && !host.hidden;
}
function workTick(){
  if(!work || !work.running || work.paused) return;
  if(!workEnsureVisible()){ workStop(); return; }
  var dt = 0.1;
  /* 顾客耐心 */
  work.customers.forEach(function(c){
    if(c.state === "left" || c.state === "done") return;
    c.patience -= dt;
    if(c.patience <= 0.3 && c.state !== "leaving"){
      c.state = "leaving";
      SFX.play("impatient");
      work.hint.unshift("顾客离开：" + c.type.name + "等太久了…");
      work.left++;
    }
  });
  /* 移除离开的顾客 */
  var before = work.customers.length;
  work.customers = work.customers.filter(function(c){ return c.state !== "leaving"; });
  if(work.customers.length !== before){
    work.dirty = true;
    if(!work.active || work.customers.indexOf(work.active) < 0){
      work.active = work.customers[0] || null;
      if(work.active) workResetBuild();
    }
  }
  /* 趣味随机事件：每关最多触发 2 次，且真正改变订单/库存状态 */
  if(work.events.length < 2 && Math.random() < 0.02 && work.total >= 1){
    var ev = pick(WORK_EVENTS);
    ev.apply(work);
    work.events.push(ev.id);
    work.hint.unshift(ev.text);
    work.dirty = true;
    SFX.play("star");
    meteorAt($("#arcadeWork"), 4);
  }
  /* 补位 */
  while(work.customers.length < work.cfg.maxWait && work.pending.length){
    work.customers.push(work.pending.shift());
    work.dirty = true;
  }
  /* 烹饪进度 */
  work.grill.forEach(function(g){ if(!g.done){ g.p += dt / 2.6; if(g.p >= 1){ g.done = true; work.pattyStock++; SFX.play("ready"); } } });
  work.fryer.forEach(function(f){ if(!f.done){ f.p += dt / 2.2; if(f.p >= 1){ f.done = true; if(f.id === "fries") work.friesStock++; else work.nuggetStock++; SFX.play("ready"); } } });
  /* 关卡完成 */
  if(!work.pending.length && !work.customers.some(function(c){ return c.state !== "done"; })){
    workLevelFinish();
    return;
  }
  /* 只有结构发生变化（顾客进出 / 随机事件）才重建 DOM；
     否则仅做局部数值刷新，避免打断玩家正在进行的点击。 */
  if(work.dirty){ work.dirty = false; workRender(); }
  else workLiveUpdate();
}
function workResetBuild(){
  work.built = { burger:{}, sides:[] };
}

/* ---------- 操作 ---------- */
function workSelect(id){
  if(!work || !work.running || work.paused) return;
  var c = work.customers.filter(function(x){ return x.id === id; })[0];
  if(!c) return;
  work.active = c; workResetBuild(); SFX.play("click"); workRender();
}
function workGrill(){
  if(!work || work.grill.filter(function(g){ return !g.done; }).length >= 3) return;
  work.grill.push({ done:false, p:0 }); SFX.play("page"); workRender();
}
function workFry(id){
  if(!work) return;
  if(work.fryer.filter(function(f){ return !f.done; }).length >= 3) return;
  work.fryer.push({ id:id, done:false, p:0 }); SFX.play("page"); workRender();
}
function workAddPart(pid){
  if(!work || !work.active || work.paused) return;
  var part = WORK_BURGER_PARTS.filter(function(p){ return p.id === pid; })[0];
  if(part.cook === "grill"){
    if(work.pattyStock <= 0){ toast("先从煎台煎一块肉饼", "！"); SFX.play("fail"); return; }
    work.pattyStock--;
  }
  work.built.burger[pid] = (work.built.burger[pid] || 0) + 1;
  SFX.play("stack");
  toast("已加入" + part.name + "（×" + work.built.burger[pid] + "）", "＋");
  workRender();
}
function workUndoPart(pid){
  if(!work) return;
  if(!work.built.burger[pid]) return;
  work.built.burger[pid]--;
  if(!work.built.burger[pid]) delete work.built.burger[pid];
  if(pid === "patty") work.pattyStock++;
  SFX.play("hover");
  toast("已撤销" + (WORK_PART_NAME[pid] || pid), "－");
  workRender();
}
function workAddSide(sid){
  if(!work || !work.active || work.paused) return;
  if(sid === "fries"){
    if(work.friesStock <= 0){ toast("薯条还没炸好，先用炸锅", "！"); SFX.play("fail"); return; }
    work.friesStock--;
  }else if(sid === "nuggets"){
    if(work.nuggetStock <= 0){ toast("麦乐鸡还没炸好", "！"); SFX.play("fail"); return; }
    work.nuggetStock--;
  }
  work.built.sides.push(sid); SFX.play("cart");
  var sname = (WORK_SIDES.filter(function(x){ return x.id === sid; })[0] || {}).name || sid;
  toast("已配" + sname, "＋");
  workRender();
}
function workRemoveSide(i){
  if(!work) return;
  var s = work.built.sides.splice(i, 1)[0];
  if(s === "fries") work.friesStock++;
  if(s === "nuggets") work.nuggetStock++;
  SFX.play("hover"); workRender();
}
/* 交付并评分 */
function workDeliver(){
  if(!work || !work.active || work.paused) return;
  var c = work.active;
  var req = c.req, built = work.built;
  var diff = 0;
  WORK_BURGER_PARTS.forEach(function(p){
    diff += Math.abs((req.burger[p.id] || 0) - (built.burger[p.id] || 0));
  });
  (req.no || []).forEach(function(n){ if((built.burger[n] || 0) > 0) diff += 2; });
  /* 配餐比对（多重集合） */
  var needSides = req.sides.slice().sort().join(",");
  var gotSides = built.sides.slice().sort().join(",");
  if(needSides !== gotSides){
    var needCount = {}, gotCount = {};
    req.sides.forEach(function(s){ needCount[s] = (needCount[s]||0)+1; });
    built.sides.forEach(function(s){ gotCount[s] = (gotCount[s]||0)+1; });
    var keys = {};
    for(var k in needCount) keys[k]=1; for(var k2 in gotCount) keys[k2]=1;
    for(var kk in keys) diff += Math.abs((needCount[kk]||0)-(gotCount[kk]||0));
  }
  var ratio = c.patience / c.patienceMax;
  var stars = 0;
  /* 以准确率为主：稍慢不影响星级，小失误依然可以继续经营 */
  if(diff === 0) stars = 3;
  else if(diff <= 2) stars = 2;
  else if(diff <= 4) stars = 1;
  /* 时间奖励/惩罚 */
  if(stars === 3 && ratio > 0.6) stars = 3;
  if(diff >= 5) stars = 0;
  var coins = Math.round((stars * 12 + 4) * (req.extraTip || 1));
  work.total++;
  work.stars += stars;
  work.coins += coins;
  if(stars === 3) work.perfect++;
  work.served++;
  addCoins(coins);
  c.state = "done";
  work.customers = work.customers.filter(function(x){ return x.id !== c.id; });
  work.active = work.customers[0] || null;
  workResetBuild();
  var msg = stars === 3 ? "完美交付！★×3" : stars === 2 ? "不错！★×2" : stars === 1 ? "勉强过关 ★×1" : "订单错误…顾客皱眉了";
  work.hint.unshift(msg + "（+" + coins + " 金币）");
  if(stars >= 2){ SFX.play("deliver"); }
  else { SFX.play("fail"); }
  if(stars === 3){
    state.workPerfect = (state.workPerfect || 0) + 1;
    unlockBadge("gold_staff", true);
    if(state.workPerfect >= 10) unlockBadge("gold_staff");
  }
  state.workDone = (state.workDone || 0) + 1;
  save();
  if(!work.pending.length && !work.customers.length){ workLevelFinish(); return; }
  /* 立即补位，避免交付后出现「没有顾客可服务」的空窗期 */
  while(work.customers.length < work.cfg.maxWait && work.pending.length){
    work.customers.push(work.pending.shift());
  }
  if(!work.active){
    work.active = work.customers[0] || null;
    if(work.active) workResetBuild();
  }
  workRender();
}
function workLevelFinish(){
  workStop();
  if(!work) return;
  work.running = false; work.phase = "cleared";
  workRender();
  SFX.play("achievement");
  /* 晋升判定 */
  var ranks = WORK_RANKS.slice().reverse();
  for(var i = 0; i < ranks.length; i++){
    if(state.workDone >= ranks[i].need){
      if(state.workRank !== ranks[i].id){
        state.workRank = ranks[i].id; save();
        toast("晋升！" + ranks[i].name, "★");
        SFX.play("upgrade");
        if(ranks[i].id === "manager") unlockBadge("work_manager");
      }
      break;
    }
  }
  var best = Math.max(state.workBest, work.coins);
  state.workBest = best; save();
  renderWorkProfile();
}

/* ---------- 渲染 ---------- */
function workRenderProgressBar(p, label){
  return '<div class="wb-item"><span>' + label + '</span><div class="wb-bar"><i style="width:' + Math.round(Math.min(1,p)*100) + '%"></i></div><b>' +
    (p >= 1 ? "OK" : Math.round(p*100) + "%") + "</b></div>";
}
function workRender(){
  var host = $("#arcadeWork");
  if(!host) return;
  var inner = host.querySelector(".crt-inner") || host;
  if(!work){
    inner.innerHTML = workIntroHTML();
    workDelegate(inner);
    return;
  }
  if(work.phase === "cleared"){
    inner.innerHTML =
      '<div class="work-clear">' +
        '<div class="wc-art">' + mascotHTML("jump", 96) + "</div>" +
        "<h3>关卡完成！</h3>" +
        '<div class="wc-line">本关交付 <b>' + work.served + "</b> 单 · 三星 <b>" + work.perfect + "</b> 次 · 累计 ★" + work.stars + "</div>" +
        '<div class="wc-line">本关金币 <b>' + work.coins + "</b> · 当前职级 <b>" + workRankInfo().name + "</b></div>" +
        '<div class="wc-line small">顾客流失 ' + work.left + " 人</div>" +
        '<div class="work-btns">' +
          (work.level < WORK_LEVELS.length ? '<button class="btn btn-sm" id="workNext">下一关 ▶</button>' : '<span class="wc-all">全部关卡通过！</span>') +
          '<button class="btn btn-sm btn-ghost" id="workRetry">重玩本关 ↻</button>' +
          '<button class="btn btn-sm btn-night" id="workBack">回到 introduction</button>' +
        "</div>" +
      "</div>";
    workDelegate(inner);
    return;
  }
  /* 进行中 */
  var rank = workRankInfo();
  var html =
    '<div class="work-head">' + workHeadHTML() + "</div>" +
    '<div class="work-customers">' + work.customers.map(function(c){
      var pct = Math.max(0, Math.min(1, c.patience / c.patienceMax));
      var cls = pct > 0.5 ? "ok" : pct > 0.2 ? "warn" : "bad";
      return '<div class="work-cust' + (work.active === c ? " active" : "") + '" data-wcust="' + c.id + '">' +
        '<div class="wc-avatar">' + artSVG(c.type.art, { size:44 }) + "</div>" +
        '<div class="wc-body"><div class="wc-name">' + c.type.name + '<small>' + c.type.desc + "</small></div>" +
        '<div class="wc-order">' + workOrderText(c.req) + "</div>" +
        '<div class="wc-pat ' + cls + '"><i style="width:' + (pct*100) + '%"></i></div></div></div>';
    }).join("") + "</div>" +
    (work.hint.length ? '<div class="work-hint">' + esc(work.hint[0]) + "</div>" : "") +
    (work.active ? '<div class="work-guide">🧭 下一步：' + esc(workGuide()) + "</div>" : "") +
    '<div class="work-mid">' +
      '<div class="work-panel"><h4>① 制作汉堡<span class="wp-sub">点击食材组装（叠错了点一下撤掉）</span></h4>' +
        '<div class="work-tray">' + (Object.keys(work.built.burger).length ? Object.keys(work.built.burger).map(function(k){
          var part = WORK_BURGER_PARTS.filter(function(p){ return p.id===k; })[0];
          return '<button class="wt-chip" data-wundo="' + k + '" title="点击移除">' + artSVG(part.art, { size:28 }) + "<span>×" + work.built.burger[k] + "</span></button>";
        }).join("") : '<span class="wt-empty">还没有放料</span>') + "</div>" +
        '<div class="work-parts">' + WORK_BURGER_PARTS.map(function(p){
          var lack = (p.cook === "grill" && work.pattyStock <= 0);
          return '<button class="wp-btn' + (lack ? " lack" : "") + '" data-wpart="' + p.id + '"' +
            (lack ? ' title="需要先到煎台煎一块肉饼"' : "") + ">" +
            artSVG(p.art, { size:26 }) + esc(p.name) + (lack ? "<small>需先煎</small>" : "") + "</button>";
        }).join("") + "</div></div>" +
      '<div class="work-panel"><h4>② 配餐<span class="wp-sub">先煎/炸，再加入</span></h4>' +
        '<div class="work-tray">' + (work.built.sides.length ? work.built.sides.map(function(s, i){
          var sd = WORK_SIDES.filter(function(x){ return x.id===s; })[0];
          return '<button class="wt-chip" data-wside="' + i + '" title="点击移除">' + artSVG(sd.art, { size:26 }) + "</button>";
        }).join("") : '<span class="wt-empty">还没有配餐</span>') + "</div>" +
        '<div class="work-parts">' + WORK_SIDES.map(function(s){
          var lack = (s.id === "fries" && work.friesStock <= 0) || (s.id === "nuggets" && work.nuggetStock <= 0);
          return '<button class="wp-btn' + (lack ? " lack" : "") + '" data-wsideadd="' + s.id + '"' +
            (lack ? ' title="需要先到炸锅炸好"' : "") + ">" +
            artSVG(s.art, { size:26 }) + esc(s.name) + (lack ? "<small>需先炸</small>" : "") + "</button>";
        }).join("") + "</div>" +
        '<div class="work-stock">' + workStockHTML() + "</div>" +
      "</div>" +
    "</div>" +
    '<div class="work-cook">' +
      '<div class="wcook-col"><h4>煎台</h4>' +
        work.grill.map(function(g, i){ return workRenderProgressBar(g.p, "肉饼 " + (i+1)); }).join("") +
        '<button class="btn btn-sm" data-wgrill="1">煎一块肉饼</button></div>' +
      '<div class="wcook-col"><h4>炸锅</h4>' +
        work.fryer.map(function(f, i){ return workRenderProgressBar(f.p, (f.id==="fries"?"薯条":"麦乐鸡") + " " + (i+1)); }).join("") +
        '<button class="btn btn-sm" data-wfry="fries">炸薯条</button>' +
        '<button class="btn btn-sm" data-wfry="nuggets">炸麦乐鸡</button></div>' +
      '<div class="wcook-col deliv"><h4>③ 交付</h4>' +
        '<button class="btn btn-lg" data-wdeliver="1">交给顾客 ✓</button>' +
        '<div class="work-btns">' +
          '<button class="btn btn-sm btn-ghost" data-wpause="1">' + (work.paused ? "继续 ▶" : "暂停 ‖") + "</button>" +
          '<button class="btn btn-sm btn-night" data-wquit="1">结束</button>' +
        "</div></div>" +
    "</div>";
  inner.innerHTML = html;
  /* 采用事件委托：容器上的监听只注册一次，
     即使 innerHTML 被重建也不会丢失点击，彻底解决「点了没反应 / 要反复点」。 */
  workDelegate(inner);
  workLiveUpdate();
}

/* ---------- 事件委托（一次性绑定在容器上） ---------- */
function workDelegate(inner){
  if(!inner || inner.__wDelegated) return;
  inner.__wDelegated = true;
  inner.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var el;
    /* 首页 / 结算页按钮 */
    if(t.closest("#workBegin")){ SFX.play("page"); workStart(1); return; }
    if((el = t.closest("[data-wsstage]"))){
      var st = el.getAttribute("data-wsstage");
      var S = WORK_STAGES.filter(function(x){ return x.id === st; })[0] || WORK_STAGES[0];
      SFX.play("page"); workStart(S.levels[0]); return;
    }
    if(t.closest("#workNext")){ SFX.play("page"); workStart(work.level + 1); return; }
    if(t.closest("#workRetry")){ SFX.play("page"); workStart(work.level); return; }
    if(t.closest("#workBack")){ workStop(); work = null; SFX.stopBgm(); workRender(); return; }
    /* 游戏内操作 */
    if(!work) return;
    if((el = t.closest("[data-wcust]"))){ workSelect(el.getAttribute("data-wcust")); return; }
    if((el = t.closest("[data-wpart]"))){ workAddPart(el.getAttribute("data-wpart")); return; }
    if((el = t.closest("[data-wundo]"))){ workUndoPart(el.getAttribute("data-wundo")); return; }
    if((el = t.closest("[data-wsideadd]"))){ workAddSide(el.getAttribute("data-wsideadd")); return; }
    if((el = t.closest("[data-wside]"))){ workRemoveSide(+el.getAttribute("data-wside")); return; }
    if(t.closest("[data-wgrill]")){ workGrill(); return; }
    if((el = t.closest("[data-wfry]"))){ workFry(el.getAttribute("data-wfry")); return; }
    if(t.closest("[data-wdeliver]")){ workDeliver(); return; }
    if(t.closest("[data-wpause]")){ workTogglePause(); return; }
    if(t.closest("[data-wquit]")){ workStop(); work = null; SFX.stopBgm(); workRender(); return; }
  });
}
function workTogglePause(){
  if(!work) return;
  work.paused = !work.paused;
  SFX.play("click");
  if(work.paused) SFX.stopBgm(); else SFX.playBgm("restaurant");
  workRender();
}
/* ---------- 局部刷新：只改动数值，不重建 DOM ----------
 * 旧实现每 100ms 整块重写 innerHTML，玩家按下与抬起之间节点可能已被替换，
 * click 事件因此丢失，表现为「食材点了没反应、要反复点」。计时器现在只做局部更新。 */
function workLiveUpdate(){
  if(!work) return;
  var host = $("#arcadeWork");
  var inner = host ? host.querySelector(".crt-inner") : null;
  if(!inner) return;
  /* 顾客耐心条 */
  var custs = inner.querySelectorAll(".work-cust");
  for(var i = 0; i < custs.length && i < work.customers.length; i++){
    var c = work.customers[i];
    if(!c) continue;
    var pct = Math.max(0, Math.min(1, c.patience / c.patienceMax));
    var bar = custs[i].querySelector(".wc-pat i");
    if(bar) bar.style.width = (pct * 100) + "%";
    var pat = custs[i].querySelector(".wc-pat");
    if(pat) pat.className = "wc-pat " + (pct > 0.5 ? "ok" : pct > 0.2 ? "warn" : "bad");
  }
  /* 煎台 / 炸锅进度 */
  var prog = [];
  work.grill.forEach(function(g, gi){ prog.push({ p:g.p, txt:(g.p >= 1 ? "OK" : Math.round(g.p * 100) + "%") }); });
  work.fryer.forEach(function(f, fi){ prog.push({ p:f.p, txt:(f.p >= 1 ? "OK" : Math.round(f.p * 100) + "%") }); });
  var items = inner.querySelectorAll(".wb-item");
  for(var j = 0; j < items.length && j < prog.length; j++){
    var b2 = items[j].querySelector(".wb-bar i");
    var t2 = items[j].querySelector("b");
    if(b2) b2.style.width = Math.round(Math.min(1, prog[j].p) * 100) + "%";
    if(t2) t2.textContent = prog[j].txt;
  }
  /* 备料数量 */
  var st = inner.querySelector(".work-stock");
  if(st) st.innerHTML = workStockHTML();
  /* 下一步引导 */
  var gd = inner.querySelector(".work-guide");
  if(gd && work.active) gd.innerHTML = "🧭 下一步：" + esc(workGuide());
  /* 头部统计 */
  var hd = inner.querySelector(".work-head");
  if(hd) hd.innerHTML = workHeadHTML();
}
function workStockHTML(){
  return "备料：肉饼 <b>" + work.pattyStock + "</b> · 薯条 <b>" + work.friesStock +
         "</b> · 麦乐鸡 <b>" + work.nuggetStock + "</b>";
}
function workHeadHTML(){
  var rank = workRankInfo();
  return "<span>关卡 <b>" + work.cfg.name + "</b>（" + work.level + "/" + WORK_LEVELS.length + "）</span>" +
    "<span>已交付 <b>" + work.served + "</b>/" + work.cfg.customers + "</span>" +
    "<span>本关金币 <b>" + work.coins + "</b></span>" +
    "<span>职级 <b>" + rank.name + "</b></span>";
}
function workIntroHTML(){
  return '<div class="work-start">' +
    '<div style="display:flex;justify-content:center;margin-bottom:10px">' + mascotHTML("wave", 92) + "</div>" +
    "<h3>麦麦打工日记</h3>" +
    "<p>你是一名麦当劳店员。接待顾客 → 照订单做汉堡 → 配薯条鸡块饮料 → 交付评分。<br>煎肉饼和炸薯条需要时间，合理安排顺序；顾客有耐心值，超时会离开。</p>" +
    '<div class="work-stages">' + WORK_STAGES.map(function(S){
      return '<button class="ws-btn' + (S.id === "rookie" ? " ws-def" : "") + '" data-wsstage="' + S.id + '">' +
        "<b>" + S.name + "</b><small>" + S.desc + "</small></button>";
    }).join("") + "</div>" +
    '<div class="work-levels">' + WORK_STAGES.map(function(S){
      return '<div class="wl-item"><b>' + S.name + "</b><small>" + S.levels.map(function(n){
        var L = WORK_LEVELS[n - 1];
        return "第" + n + "关 · " + L.name + "（" + L.customers + " 位顾客）";
      }).join(" ｜ ") + "</small></div>";
    }).join("") + "</div>" +
    '<button class="btn btn-lg" id="workBegin">开始上班 ▶（新手模式）</button>' +
  "</div>";
}
/* 侧栏玩家档案 */
function renderWorkProfile(){
  var host = $("#workProfile");
  if(!host) return;
  var rank = workRankInfo();
  var nextRank = null;
  for(var i = 0; i < WORK_RANKS.length; i++){ if(WORK_RANKS[i].need > state.workDone){ nextRank = WORK_RANKS[i]; break; } }
  host.innerHTML =
    "<h4>职级</h4>" +
    '<div class="wrank">' + artSVG("cap", { size:34 }) + "<div><b>" + rank.name + "</b><small>" + rank.desc + "</small></div></div>" +
    (nextRank ? '<div class="wnext">晋升下一级还需交付 <b>' + (nextRank.need - state.workDone) + "</b> 单</div>" : '<div class="wnext">已是最高职级</div>') +
    "<h4>战绩</h4>" +
    "<div class=\"wstat\"><span>累计交付</span><b>" + state.workDone + "</b></div>" +
    "<div class=\"wstat\"><span>三星次数</span><b>" + state.workPerfect + "</b></div>" +
    "<div class=\"wstat\"><span>单关最高金币</span><b>" + state.workBest + "</b></div>";
}
