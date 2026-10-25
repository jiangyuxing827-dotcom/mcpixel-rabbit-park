/* =========================================================
 * McPixel · 核心层
 * 工具 / 状态 / 购物车 / 徽章与皮肤解锁 / 扭蛋奖励 / 流星粒子 / M兔子
 * ========================================================= */
function $(s){ return document.querySelector(s); }
function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function yuan(n){ return "¥" + (Math.round(Number(n) * 100) / 100); }
function rnd(n){ return Math.floor(Math.random() * n); }
function pick(arr){ return arr[rnd(arr.length)]; }
function store(key, val){
  try{
    if(val === undefined){ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    localStorage.setItem(key, JSON.stringify(val));
  }catch(e){}
  return null;
}
var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 菜单数据 ---------- */
var MENU = normalizeMenu(DEMO_MENU);
var MENU_ORIGIN = "embedded";
/* 单文件离线版：页面内可能内联一份菜单 JSON（<script id="offline-menu">），
   用于 file:// 协议下 fetch 失败时仍展示与 data/menu.json 一致的数据。 */
function offlineMenu(){
  try{
    var el = document.getElementById("offline-menu");
    if(!el) return null;
    var j = JSON.parse(el.textContent || "{}");
    return (j && j.items && j.items.length) ? j : null;
  }catch(e){ return null; }
}
function loadMenu(){
  var inline = offlineMenu();
  if(inline){
    return fetch("data/menu.json", { cache:"no-store" })
      .then(function(r){ if(!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function(j){
        var m = normalizeMenu(j);
        if(!m.items.length) throw new Error("empty menu");
        MENU = m;
        MENU_ORIGIN = m.meta.mcdMcpConnected ? "mcp" : "file";
      })
      .catch(function(){ MENU = normalizeMenu(inline); MENU_ORIGIN = "file"; });
  }
  return fetch("data/menu.json", { cache:"no-store" })
    .then(function(r){ if(!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function(j){
      var m = normalizeMenu(j);
      if(!m.items.length) throw new Error("empty menu");
      MENU = m;
      MENU_ORIGIN = m.meta.mcdMcpConnected ? "mcp" : "file";
    })
    .catch(function(){
      MENU = normalizeMenu(DEMO_MENU);
      MENU_ORIGIN = "embedded";
    });
}

/* ---------- 状态 ---------- */
var state = {
  filter:"全部", q:"", sort:"default",
  basket: store("mcpixel_basket_v2") || [],
  mode:"1p2", slots:[],
  badges: store("mcpixel_badges_v2") || {},
  skins: store("mcpixel_skins_v2") || {},
  equippedSkin: store("mcpixel_skin_eq_v2") || "classic",
  notes: store("mcpixel_notes_v2") || [],
  history: store("mcpixel_history_v2") || [],
  endings: store("mcpixel_endings_v2") || {},
  saucesUsed: store("mcpixel_sauces_v2") || {},
  sauceCombos: store("mcpixel_saucecombos_v2") || [],
  bunnyClicks: store("mcpixel_bunny_v2") || 0,
  snakeBest: store("mcpixel_snakebest_v2") || 0,
  snakeScores: store("mcpixel_snakeboard_v2") || [],
  custom: store("mcpixel_custom_v2") || {},
  diy: store("mcpixel_diy_v2") || { bunTop:1, bunBottom:1, patty:2, pattyChicken:0, cheese:1, lettuce:1, tomato:0, egg:0, pickle:1, onion:0, bacon:0, sauce:0 },
  diyExpr: "idle",          /* 兔兔汉堡当前表情（不持久化，属即时反馈） */
  diyIdleTimer: 0,
  bucket: store("mcpixel_bucket_v2") || null,
  friesSauces: [],
  friesKingDone: store("mcpixel_friesking_v2") || false,

  /* ---- V2 统一玩家档案：模拟金币 / 各小游戏成绩与统计 ---- */
  coins:        store("mcpixel_coins_v3") || 0,
  workBest:     store("mcpixel_workbest_v3") || 0,
  workRank:     store("mcpixel_workrank_v3") || "intern",
  workDone:     store("mcpixel_workdone_v3") || 0,        /* 累计交付订单数 */
  workPerfect:  store("mcpixel_workperfect_v3") || 0,     /* 满分（三星）交付次数 */
  sliceBest:    store("mcpixel_slicebest_v3") || 0,
  sliceCombo:   store("mcpixel_slicecombobest_v3") || 0,
  sliceCuts:    store("mcpixel_slicecuts_v3") || 0,       /* 累计切割数 */
  sliceFries:   store("mcpixel_slicefries_v3") || 0,      /* 累计薯条切割数 */
  matchBest:    store("mcpixel_matchbest_v3") || 0,
  matchLevel:   store("mcpixel_matchlevel_v3") || 1,      /* 消消乐已解锁关卡 */
  matchStars:   store("mcpixel_matchstars_v3") || {},     /* 关卡 → 星级 */
  matchFriesBomb: store("mcpixel_matchbomb_v3") || 0,     /* 累计薯条炸弹 */
  matchMeteor:  store("mcpixel_matchmeteor_v3") || 0,     /* 累计流星甜筒 */
  matchStreak:  store("mcpixel_matchstreak_v3") || 0,     /* 连续通关计数 */

  /* ---- V2.6 麦门人格研究所 ---- */
  mbti: store("mcpixel_mbti_v1") || null,                  /* 当前/最近一次完整结果 */
  mbtiProgress: store("mcpixel_mbtiprog_v1") || null,      /* 未完成答题进度（可续答） */
  mbtiHistory: store("mcpixel_mbtihist_v1") || {},         /* 人格 → 获得次数 */
  mbtiSkins: store("mcpixel_mbtiskins_v1") || [],          /* 已解锁人格兔子 */
  mbtiEquipped: store("mcpixel_mbtiequip_v1") || "",       /* 装备中的人格兔子 */
  mbtiPairs: store("mcpixel_mbtipairs_v1") || [],          /* 已尝试的人格配对 */
  mbtiRead: store("mcpixel_mbtiread_v1") || {}             /* 已阅读的人格介绍 */
};
function save(){
  store("mcpixel_basket_v2", state.basket);
  store("mcpixel_badges_v2", state.badges);
  store("mcpixel_skins_v2", state.skins);
  store("mcpixel_skin_eq_v2", state.equippedSkin);
  store("mcpixel_notes_v2", state.notes);
  store("mcpixel_history_v2", state.history);
  store("mcpixel_endings_v2", state.endings);
  store("mcpixel_sauces_v2", state.saucesUsed);
  store("mcpixel_saucecombos_v2", state.sauceCombos);
  store("mcpixel_bunny_v2", state.bunnyClicks);
  store("mcpixel_snakebest_v2", state.snakeBest);
  store("mcpixel_snakeboard_v2", state.snakeScores);
  store("mcpixel_custom_v2", state.custom);
  store("mcpixel_diy_v2", state.diy);
  store("mcpixel_bucket_v2", state.bucket);
  store("mcpixel_friesking_v2", state.friesKingDone);
  /* ---- V2 玩家档案持久化 ---- */
  store("mcpixel_coins_v3", state.coins);
  store("mcpixel_workbest_v3", state.workBest);
  store("mcpixel_workrank_v3", state.workRank);
  store("mcpixel_workdone_v3", state.workDone);
  store("mcpixel_workperfect_v3", state.workPerfect);
  store("mcpixel_slicebest_v3", state.sliceBest);
  store("mcpixel_slicecombobest_v3", state.sliceCombo);
  store("mcpixel_slicecuts_v3", state.sliceCuts);
  store("mcpixel_slicefries_v3", state.sliceFries);
  store("mcpixel_matchbest_v3", state.matchBest);
  store("mcpixel_matchlevel_v3", state.matchLevel);
  store("mcpixel_matchstars_v3", state.matchStars);
  store("mcpixel_matchbomb_v3", state.matchFriesBomb);
  store("mcpixel_matchmeteor_v3", state.matchMeteor);
  store("mcpixel_matchstreak_v3", state.matchStreak);
  store("mcpixel_mbti_v1", state.mbti);
  store("mcpixel_mbtiprog_v1", state.mbtiProgress);
  store("mcpixel_mbtihist_v1", state.mbtiHistory);
  store("mcpixel_mbtiskins_v1", state.mbtiSkins);
  store("mcpixel_mbtiequip_v1", state.mbtiEquipped);
  store("mcpixel_mbtipairs_v1", state.mbtiPairs);
  store("mcpixel_mbtiread_v1", state.mbtiRead);
}

/* ---------- 模拟金币（仅用于游戏内装饰/道具解锁，与真实货币无关） ---------- */
function addCoins(n){
  n = Math.round(Number(n) || 0);
  if(!n) return state.coins;
  state.coins = Math.max(0, state.coins + n);
  save();
  if(typeof renderArcadeProfile === "function") renderArcadeProfile();
  return state.coins;
}
function spendCoins(n){
  if(state.coins < n) return false;
  state.coins -= n;
  save();
  if(typeof renderArcadeProfile === "function") renderArcadeProfile();
  return true;
}

/* ---------- 商品查找（菜单 + 自定义商品） ---------- */
function byId(id){
  for(var i = 0; i < MENU.items.length; i++) if(MENU.items[i].id === id) return MENU.items[i];
  if(state.custom[id]) return state.custom[id];
  return null;
}
function registerCustom(item){ state.custom[item.id] = item; save(); return item; }

/* ---------- Toast / 弹窗 ---------- */
function toast(msg, ico){
  var t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = '<span class="t-ico">' + esc(ico || "▶") + '</span><span>' + esc(msg) + "</span>";
  $("#toastWrap").appendChild(t);
  setTimeout(function(){ t.classList.add("out"); setTimeout(function(){ t.remove(); }, 260); }, 2200);
}
function showModal(html, wide){
  $("#modalBox").innerHTML = '<button class="modal-x" data-close="1" title="关闭">✕</button>' + html;
  $("#modalBox").classList.toggle("wide", !!wide);
  $("#modalMask").hidden = false;
}
function hideModal(){ $("#modalMask").hidden = true; }

/* =========================================================
 * 徽章：窗口状态 / 解锁
 * ========================================================= */
function todayMMDD(){
  var d = new Date();
  return (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1) + "-" + (d.getDate() < 10 ? "0" : "") + d.getDate();
}
function inWindow(w){
  var t = todayMMDD();
  return w && t >= w[0] && t <= w[1];
}
/* 徽章状态：unlocked | open | window | gone | hidden */
function badgeStatus(b){
  if(state.badges[b.id]) return "unlocked";
  if(b.hidden) return "hidden";
  if(b.window) return inWindow(b.window) ? "open" : "gone";
  return "open";
}
function badgeCount(){
  return BADGES.filter(function(b){ return state.badges[b.id]; }).length;
}
function unlockBadge(id, silent){
  var def = BADGE_BY_ID[id];
  if(!def || state.badges[id]) return false;
  if(def.window && !inWindow(def.window) && !def.hidden) return false; /* 限定窗口外不可解锁 */
  var d = new Date();
  state.badges[id] = { date:(d.getMonth()+1) + "/" + d.getDate(), fresh:true };
  save();
  if(typeof renderBadges === "function") renderBadges();
  if(typeof renderMuseumProgress === "function") renderMuseumProgress();
  if(!silent) toast("解锁徽章：" + def.name, "★");
  return true;
}
function unlockSkin(id, silent){
  if(state.skins[id]) return false;
  state.skins[id] = { date: todayMMDD() };
  save();
  if(typeof renderSkinGallery === "function") renderSkinGallery();
  if(typeof renderSkinPicker === "function") renderSkinPicker();
  if(!silent){
    var s = SKIN_BY_ID[id];
    toast("解锁皮肤：" + (s ? s.name : id), "🐍");
  }
  return true;
}

/* =========================================================
 * 解锁规则总检查（在各交互点调用）
 *   ctx.type: add | addCombo | checkout | diy | sauce | game | bunny | meteor | endings
 * ========================================================= */
function checkUnlocks(ctx){
  ctx = ctx || {};
  var unlocked = { badges:[], skins:[] };
  function tryBadge(id){ var ok = unlockBadge(id, true); if(ok) unlocked.badges.push(id); return ok; }
  function trySkin(id){ var ok = unlockSkin(id, true); if(ok) unlocked.skins.push(id); return ok; }

  if(ctx.type === "add" && ctx.item){
    tryBadge("first_add");
    if(ctx.item.art === "fries" || ctx.item.category === "小食" && /薯/.test(ctx.item.name)) tryBadge("fries");
  }
  if(ctx.type === "addCombo") tryBadge("combo");
  if(ctx.type === "checkout" && ctx.order){
    var o = ctx.order;
    tryBadge("checkout");
    if(o.cal < 700) tryBadge("light");
    if(o.cats["主食"] && o.cats["小食"] && o.cats["饮料"]) tryBadge("allcat");
    if(o.hasFries){
      if(inWindow(["10-20","11-02"])) tryBadge("halloween_fries");
      if(state.friesKingDone) tryBadge("hidden_king2");
    }
    if(o.hasDessert && inWindow(["12-18","12-26"])) tryBadge("christmas");
    if(inWindow(["01-25","02-15"])) tryBadge("spring_red");
    if(inWindow(["02-10","02-16"]) && o.hasCombo) tryBadge("valentine");
    if(inWindow(["10-24","10-31"])) tryBadge("anniversary");
    /* 主题套餐 → 皮肤 */
    if(o.hasFries) trySkin("fries");
    if(o.hasBigmac) trySkin("bigmac");
    if(o.hasDessert) trySkin("milkshake");
    if(o.hasBox) trySkin("bunny");
    if(inWindow(["12-18","12-26"])) trySkin("xmas");
    /* 薯条大王判定：≥3 种蘸酱组合 + 薯条主题订单 */
    if(state.sauceCombos.length >= 3 && o.hasFries){
      if(tryBadge("fries_king")){
        trySkin("king");
        state.friesKingDone = true; save();
        showFriesKingCeremony();
      }
    }
  }
  if(ctx.type === "diy"){
    if(ctx.cheese >= 3) tryBadge("cheese_lover");
    if(ctx.patty >= 10){ tryBadge("patty_architect"); trySkin("bigmac"); }
    if(ctx.patty >= 30) tryBadge("hidden_stack30");
    if(inWindow(["10-20","11-02"])) tryBadge("halloween_burger");
  }
  if(ctx.type === "sauce"){
    if(Object.keys(state.saucesUsed).length >= 6) tryBadge("sauce_scientist");
  }
  if(ctx.type === "game"){
    if(ctx.score >= 30) tryBadge("snake_rookie");
    if(ctx.score >= 100) tryBadge("snake_master");
    if(inWindow(["05-28","06-03"])) tryBadge("children");
  }
  if(ctx.type === "bunny"){
    tryBadge("bunny_first");
    trySkin("bunny");
    if(state.bunnyClicks >= 10) tryBadge("hidden_bunny10");
  }
  if(ctx.type === "meteor") tryBadge("bunny_meteor");
  if(ctx.type === "endings"){
    var n = Object.keys(state.endings).length;
    if(n >= 3) tryBadge("life_explorer");
    if(n >= LIFE_ENDINGS.length) tryBadge("life_god");
  }
  /* 徽章联锁：金色兔王 / 星星兔蛇 */
  if(badgeCount() >= 10) tryBadge("bunny_gold");
  if(state.badges["bunny_meteor"]) trySkin("star");

  if(unlocked.badges.length || unlocked.skins.length){
    if(typeof renderMuseumProgress === "function") renderMuseumProgress();
  }
  return unlocked;
}

/* =========================================================
 * 购物车
 * ========================================================= */
function basketTotals(){
  var t = { price:0, cal:0, qty:0 };
  state.basket.forEach(function(b){
    var x = byId(b.id);
    if(x){ t.price += x.price * b.qty; t.cal += x.calories * b.qty; t.qty += b.qty; }
  });
  return t;
}
function addToBasket(id, fromEl, silent){
  var x = byId(id); if(!x) return;
  var line = state.basket.filter(function(b){ return b.id === id; })[0];
  if(line) line.qty++;
  else state.basket.push({ id:id, qty:1 });
  save();
  if(fromEl) goldTrailToCart(fromEl);
  if(typeof renderCart === "function") renderCart();
  if(typeof renderMenu === "function") renderMenu();
  checkUnlocks({ type:"add", item:x });
  if(!silent) toast(x.name + " 跳进了餐盘", "＋");
}
function changeQty(id, d){
  var line = state.basket.filter(function(b){ return b.id === id; })[0];
  if(!line) return;
  line.qty += d;
  if(line.qty <= 0) state.basket = state.basket.filter(function(b){ return b.id !== id; });
  save();
  if(typeof renderCart === "function") renderCart();
  if(typeof renderMenu === "function") renderMenu();
}

/* =========================================================
 * 流星 / 粒子特效
 * ========================================================= */
function elBox(el){
  var r = el.getBoundingClientRect();
  return { left:r.left + window.scrollX, top:r.top + window.scrollY, w:r.width, h:r.height };
}
/* 在元素上方生成流星雨 */
function meteorAt(el, count){
  if(reducedMotion || !el) return;
  count = count || 3;
  var b = elBox(el);
  var field = document.createElement("div");
  field.className = "meteor-field";
  field.style.cssText = "position:fixed;left:" + b.left + "px;top:" + b.top + "px;width:" + b.w + "px;height:" + b.h + "px;pointer-events:none;z-index:90";
  document.body.appendChild(field);
  for(var i = 0; i < count; i++){
    (function(i){
      var m = document.createElement("div");
      m.className = "meteor" + (i % 3 === 0 ? " slow" : i % 3 === 1 ? "" : " fast");
      m.style.left = (rnd(b.w * 0.7)) + "px";
      m.style.top = (rnd(Math.max(10, b.h * 0.6))) + "px";
      m.style.animationDelay = (i * 0.35) + "s";
      field.appendChild(m);
    })(i);
  }
  setTimeout(function(){ field.remove(); }, 2600 + count * 350);
}
/* 点击爆开：流星散射 */
function meteorBurst(el){
  if(reducedMotion || !el) return;
  var b = elBox(el);
  var wrap = document.createElement("div");
  wrap.className = "meteor-burst";
  wrap.style.cssText = "position:fixed;left:" + (b.left + b.w/2) + "px;top:" + (b.top + b.h/2) + "px;width:0;height:0;z-index:95;pointer-events:none";
  document.body.appendChild(wrap);
  for(var i = 0; i < 8; i++){
    var r = document.createElement("div");
    r.className = "m-ray";
    r.style.transform = "rotate(" + (i * 45) + "deg)";
    r.style.animationDelay = (i * 0.03) + "s";
    wrap.appendChild(r);
  }
  setTimeout(function(){ wrap.remove(); }, 900);
}
/* 限定光环 */
function starHalo(el, ms){
  if(!el) return;
  var b = elBox(el);
  var h = document.createElement("div");
  h.className = "star-halo";
  h.style.cssText = "position:fixed;left:" + b.left + "px;top:" + b.top + "px;width:" + b.w + "px;height:" + b.h + "px";
  h.innerHTML = '<div class="sh-ring"></div>';
  for(var i = 0; i < 6; i++){
    var s = document.createElement("div");
    s.className = "sh-star";
    var a = (i / 6) * Math.PI * 2;
    s.style.left = (b.w/2 + Math.cos(a) * b.w * 0.52 - 4) + "px";
    s.style.top = (b.h/2 + Math.sin(a) * b.h * 0.52 - 4) + "px";
    s.style.animationDelay = (i * 0.15) + "s";
    h.appendChild(s);
  }
  document.body.appendChild(h);
  setTimeout(function(){ h.remove(); }, ms || 3200);
}
/* 加入购物车：金黄粒子轨迹 */
function goldTrailToCart(fromEl){
  if(reducedMotion) return;
  var svg = fromEl.querySelector("svg");
  var target = $("#navCart");
  if(!svg || !target) return;
  var r = svg.getBoundingClientRect(), tr = target.getBoundingClientRect();
  var n = 8;
  for(var i = 0; i < n; i++){
    (function(i){
      var p = document.createElement("div");
      p.className = "gold-particle";
      var sx = r.left + r.width/2, sy = r.top + r.height/2;
      p.style.left = sx + "px"; p.style.top = sy + "px";
      document.body.appendChild(p);
      requestAnimationFrame(function(){
        var dx = (tr.left + tr.width/2) - sx, dy = (tr.top + tr.height/2) - sy;
        p.style.transform = "translate(" + (dx + rnd(30) - 15) + "px," + (dy + rnd(30) - 15) + "px) scale(.3)";
        p.style.opacity = "0";
      });
      setTimeout(function(){ p.remove(); }, 720);
    })(i);
  }
}

/* =========================================================
 * M兔子助手
 * ========================================================= */
var BUNNY_LINES = [
  "欢迎光临麦麦流星兔子乐园！",
  "今天的薯条，格外笔直呢。",
  "要试试堆一座肉饼摩天楼吗？",
  "酱料实验室里，芝士酱在等你。",
  "据说集齐六种蘸酱的人，会加冕为王。",
  "流星划过的时候，要记得许愿。",
  "游戏厅的贪吃蛇，饿了一整天。",
  "慢慢选，我不着急（其实有点饿）。"
];
function mascotHTML(pose, size, cls){
  var art = pose && pose !== "idle" ? ART["bunny" + pose.charAt(0).toUpperCase() + pose.slice(1)] : ART.bunny;
  if(!art) art = ART.bunny;
  return '<span class="mascot ' + (pose || "idle") + " " + (cls || "") + '" data-bunny="1">' + artSVG("bunny" + (pose && pose !== "idle" ? pose.charAt(0).toUpperCase() + pose.slice(1) : ""), { size:size || 64 }) + "</span>";
}
function bunnySay(el, text){
  var old = el.querySelector(".mascot-bubble");
  if(old) old.remove();
  var b = document.createElement("span");
  b.className = "mascot-bubble";
  b.innerHTML = text;
  el.appendChild(b);
  setTimeout(function(){ b.remove(); }, 3600);
}
function bunnyInteract(el){
  state.bunnyClicks++;
  save();
  var m = (el && el.classList && el.classList.contains("mascot")) ? el : (el && el.querySelector ? el.querySelector(".mascot") : null);
  if(m){
    m.classList.remove("surprise");
    void m.offsetWidth;
    m.classList.add("surprise");
    setTimeout(function(){ m.classList.remove("surprise"); }, 1600);
  }
  bunnySay(el, pick(BUNNY_LINES));
  meteorBurst(el);
  checkUnlocks({ type:"bunny" });
  if(state.bunnyClicks === 10) toast("M兔子记住了你：兔子密友！", "🐰");
}
function renderFloatMascot(){
  var host = $("#floatMascot");
  if(!host) return;
  host.innerHTML = mascotHTML("idle", 74) + "";
  host.querySelector(".mascot").setAttribute("data-floatbunny", "1");
}

/* =========================================================
 * 兔兔汉堡角色（Bun Bunny）
 * 角色识别度全部来自造型：芝麻面包脸 + 长兔耳 + 豆豆眼 + 粉腮红
 * + 星星发饰。额头 / 脸 / 耳朵 / 头顶 / 面包表面均无 M 字母或品牌 Logo。
 * ========================================================= */
function bunnyExprCap(e){ return String(e || "idle").charAt(0).toUpperCase() + String(e || "idle").slice(1); }
function bunBunnySVG(expr, size, cls){
  var key = "bunBunny" + bunnyExprCap(expr);
  if(!ART[key]) key = "bunBunnyIdle";
  var pal = BUNNY_EXPR_PAL[String(expr || "idle")];
  return artSVG(key, { size:size || 96, cls:cls || "", palette:pal });
}
function bunTopFaceSVG(expr, size, cls){
  var key = "bunTopFace" + bunnyExprCap(expr);
  if(!ART[key]) key = "bunTopFaceIdle";
  var pal = BUNNY_EXPR_PAL[String(expr || "idle")];
  return artSVG(key, { size:size || 112, cls:cls || "", palette:pal });
}
/* 兔兔汉堡角色 HTML（可点击兔耳） */
function bunBunnyHTML(expr, size, cls){
  return '<span class="bunbunny ' + (expr || "idle") + " " + (cls || "") + '" data-bunnyears="1">' +
    bunBunnySVG(expr, size || 96) + "</span>";
}
/* 切换表情：ms 毫秒后自动回到 idle（0 = 保持） */
function setBunnyExpr(expr, ms){
  state.diyExpr = expr || "idle";
  if(state.diyIdleTimer){ clearTimeout(state.diyIdleTimer); state.diyIdleTimer = 0; }
  if(typeof renderBurger === "function") renderBurger();
  if(ms){
    state.diyIdleTimer = setTimeout(function(){
      state.diyExpr = "idle";
      if(typeof renderBurger === "function") renderBurger();
    }, ms);
  }
}
/* 点击兔耳：耳朵弹动 + 少量金色星星 */
function bunnyEarPoke(el){
  if(!el) return;
  el.classList.remove("ear-pop"); void el.offsetWidth; el.classList.add("ear-pop");
  setTimeout(function(){ el.classList.remove("ear-pop"); }, 700);
  if(reducedMotion) return;
  var b = elBox(el);
  for(var i = 0; i < 6; i++){
    (function(i){
      var s = document.createElement("div");
      s.className = "ear-star";
      s.style.left = (b.left + b.w * (0.3 + 0.4 * Math.random())) + "px";
      s.style.top = (b.top + b.h * 0.12) + "px";
      s.style.animationDelay = (i * 0.06) + "s";
      s.style.setProperty("--dx", (rnd(40) - 20) + "px");
      document.body.appendChild(s);
      setTimeout(function(){ s.remove(); }, 1400);
    })(i);
  }
}
/* 兔兔汉堡缩小成像素商品卡片，沿流星轨迹飞入购物车 */
function bunnyFlyToCart(fromEl, artName){
  if(reducedMotion || !fromEl) return;
  var target = $("#navCart");
  var src = fromEl.querySelector("svg") || fromEl;
  if(!target || !src) return;
  var r = src.getBoundingClientRect(), tr = target.getBoundingClientRect();
  var card = document.createElement("div");
  card.className = "fly-card";
  card.innerHTML = artSVG(artName || "bunBunnyIdle", { size:64 });
  card.style.left = (r.left + r.width/2 - 32) + "px";
  card.style.top = (r.top + r.height/2 - 32) + "px";
  document.body.appendChild(card);
  /* 流星拖尾 */
  var trail = document.createElement("div");
  trail.className = "fly-trail";
  trail.style.left = (r.left + r.width/2) + "px";
  trail.style.top = (r.top + r.height/2) + "px";
  var dx = (tr.left + tr.width/2) - (r.left + r.width/2);
  var dy = (tr.top + tr.height/2) - (r.top + r.height/2);
  var len = Math.sqrt(dx*dx + dy*dy);
  trail.style.width = len + "px";
  trail.style.transform = "rotate(" + (Math.atan2(dy, dx) * 180 / Math.PI) + "deg)";
  trail.style.transformOrigin = "0 50%";
  document.body.appendChild(trail);
  requestAnimationFrame(function(){
    card.style.transform = "translate(" + dx + "px," + dy + "px) scale(.28) rotate(14deg)";
    card.style.opacity = ".15";
  });
  setTimeout(function(){ card.remove(); trail.remove(); }, 900);
}

/* =========================================================
 * 薯条大王加冕仪式
 * ========================================================= */
function showFriesKingCeremony(){
  var el = $("#floatMascot") || document.body;
  meteorAt(el, 6);
  starHalo(el, 4000);
  setTimeout(function(){
    showModal(
      '<div class="king-card">' +
        '<div class="kc-head"><b>FRIES KING</b><span>加冕认证</span></div>' +
        '<div class="kc-art">' + artSVG("friesKing", { size:120 }) + "</div>" +
        '<div class="kc-body">' +
          '<div class="kc-title">薯条大王</div>' +
          '<p class="kc-text">恭喜！你已经加冕为薯条大王！<br>从今天开始，每一根薯条都是你的臣民。</p>' +
          '<div class="modal-lines" style="text-align:left">' +
            "<div><span>解锁徽章</span><b>薯条大王</b></div>" +
            "<div><span>解锁皮肤</span><b>薯条大王蛇</b></div>" +
            "<div><span>解锁装饰</span><b>金色皇冠 M兔子</b></div>" +
          "</div>" +
          '<p class="honest">奖励为本地演示收藏内容，保存在浏览器 localStorage；可在收藏馆查看与分享荣誉卡。</p>' +
        "</div>" +
        '<div class="kc-foot"><span>McPixel · 麦麦流星兔子乐园</span><span>' + todayMMDD() + "</span></div>" +
      "</div>", true
    );
  }, 700);
}
