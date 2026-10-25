/* =========================================================
 * McPixel · 点餐场景层
 * 首页 / 每日推荐 / 菜单 / 套餐工坊 / 购物车 / 结账与奖励演出
 * ========================================================= */

/* 套餐工坊模式（产品设计演示规则） */
var MODES = {
  "1p1":   { label:"1+1 套餐", desc:"一份主食 + 一份小食/饮品", slots:[{cat:"主食",label:"主食"},{cat:"任意",label:"小食/饮品"}] },
  "1p2":   { label:"1+2 套餐", desc:"一款主食 + 两种配餐/饮品", slots:[{cat:"主食",label:"主食"},{cat:"任意",label:"配餐/饮品"},{cat:"任意",label:"配餐/饮品"}] },
  "1p3":   { label:"1+3 套餐", desc:"一款主食 + 三种配餐/饮品", slots:[{cat:"主食",label:"主食"},{cat:"任意",label:"配餐/饮品"},{cat:"任意",label:"配餐/饮品"},{cat:"任意",label:"配餐/饮品"}] },
  "fries1": { label:"薯条 +1", desc:"以薯条为基础，自选一种搭配", slots:[{cat:"base",label:"薯条（中）"},{cat:"任意",label:"自选搭配"}] }
};
var _comboFlag = false;

/* =========================================================
 * 渲染：首页 / 数据条
 * ========================================================= */
function renderChrome(){
  $("#brandArt").innerHTML = artSVG("logo", { size:34, palette:{ r:"#F4A340", b:"#FFC72C" } });
  $("#wsPlateArt").innerHTML = artSVG("bunBurgerIcon", { size:26 });
  /* 首页场景：M兔子 + 兔兔汉堡角色 + 薯条 + 饮料 + 流星 */
  $("#sceneItems").innerHTML =
    artSVG("bunny", { size:78, cls:"scene-chicken" }) + artSVG("cup", { size:52 }) +
    '<span class="scene-bunbunny" data-bunnyears="1">' + bunBunnySVG("idle", 96) + "</span>" +
    artSVG("fries", { size:58 }) + artSVG("comet", { size:34 });
  var d = new Date();
  $("#todayStr").textContent = (d.getMonth() + 1) + "/" + d.getDate();

  var chip = $("#dataChip"), live = MENU.meta.mcdMcpConnected;
  chip.textContent = MENU.meta.label + " · " + MENU.meta.updatedAt;
  chip.classList.toggle("live", false);
  chip.title = "官方营养与活动快照；价格、库存与未匹配热量为演示";
  $("#dataNotice").style.display = "";
  $("#footData").textContent = MENU.meta.label + " · " + MENU.meta.updatedAt;
  $("#noticeTitle").textContent = "官方营养与活动已接入 · 价格为演示";
  $("#noticeText").textContent = "标注官方营养的餐品使用麦当劳MCP数据快照；其他热量和所有价格仍为演示。未验证门店库存，不产生真实订单。获取于 " + MENU.meta.updatedAt;
  renderFloatMascot();
}

/* =========================================================
 * 渲染：每日推荐（组合灵感，非官方优惠）
 * ========================================================= */
function renderDaily(){
  var items = MENU.items;
  function totals(list){ return { price:list.reduce(function(a,x){return a+x.price},0), cal:list.reduce(function(a,x){return a+x.calories},0) }; }
  function card(title, desc, list, stamp){
    if(!list.length) return "";
    var t = totals(list);
    var arts = list.slice(0,4).map(function(x){ return artSVG(x.art, { size:44 }); }).join("");
    return '<div class="daily-card poster"><span class="stamp">' + esc(stamp) + '</span>' +
      '<div class="daily-arts">' + arts + '</div><h3>' + esc(title) + '</h3>' +
      '<p class="daily-desc">' + esc(desc) + '</p>' +
      '<div class="daily-nums"><span>合计</span><b>' + yuan(t.price) + '</b><span>' + t.cal + ' kcal</span></div>' +
      '<button class="btn btn-yellow" data-daily="' + list.map(function(x){return x.id}).join(",") + '">一键加入餐盘</button></div>';
  }
  var mains = items.filter(function(x){ return x.category === "主食"; }),
      sides = items.filter(function(x){ return x.category === "小食"; }),
      drinks = items.filter(function(x){ return x.category === "饮料"; }),
      sweets = items.filter(function(x){ return x.category === "甜品"; });
  var out = "";
  if(mains.length && sides.length && drinks.length){
    var best = null;
    mains.forEach(function(m){ sides.forEach(function(s){ drinks.forEach(function(d){
      var t = m.price + s.price + d.price;
      if(!best || t < best.t) best = { t:t, list:[m,s,d] };
    }); }); });
    out += card("均衡搭配", "主食 + 小食 + 饮料，一人食刚好", best.list, "组合灵感");
  }
  if(mains.length && sweets.length){
    var happy = null;
    mains.forEach(function(m){ sweets.forEach(function(d){
      var t = m.price + d.price;
      if(!happy || t < happy.t) happy = { t:t, list:[m,d] };
    }); });
    if(happy) out += card("开心时刻", "主食 + 甜品，像素幸福配方", happy.list, "组合灵感");
  }
  var light = null;
  for(var i = 0; i < items.length; i++) for(var j = 0; j < items.length; j++){
    if(i === j) continue;
    var c = items[i].calories + items[j].calories;
    if(c > 700) continue;
    if(!light || c < light.c) light = { c:c, list:[items[i], items[j]] };
  }
  if(light) out += card("轻卡之选", "两件组合，总热量 ≤ 700 kcal", light.list, "组合灵感");
  if(mains.length){
    var cheap = mains.slice().sort(function(a,b){ return a.price - b.price; })[0];
    out += card("饱腹低价", "预算优先时的主食选择", [cheap], "组合灵感");
  }
  $("#dailyGrid").innerHTML = out || '<div class="poster" style="padding:20px">菜单数据不足，暂无推荐。</div>';
}

/* 活动日历（campaign-calendar 工具数据，仅 MCP 提供时显示） */
function renderCampaigns(){
  var strip = $("#campaignStrip");
  if(!MENU.campaigns.length){ strip.innerHTML = ""; return; }
  strip.innerHTML = MENU.campaigns.slice(0,6).map(function(c){
    var name = c.name || c.title || "活动";
    var date = c.date || c.time || c.period || "";
    return '<span class="campaign-chip">' + esc(name) + (date ? " · " + esc(date) : "") + "</span>";
  }).join("");
}

/* 门店优惠（query-store-coupons / available-coupons 工具数据，仅 MCP 提供时显示） */
function renderDeals(){
  var sec = $("#deals");
  if(!MENU.deals.length){ sec.hidden = true; return; }
  sec.hidden = false;
  $("#dealGrid").innerHTML = MENU.deals.map(function(d){
    return '<div class="deal-card poster"><span class="stamp">官方数据</span><h3>' + esc(d.name || "优惠") + "</h3>" +
      '<p class="deal-desc">' + esc(d.desc || d.description || "") + "</p>" +
      '<div class="deal-meta">' + esc(d.priceText || d.value || "") + "</div></div>";
  }).join("");
}

/* =========================================================
 * 渲染：菜单
 * ========================================================= */
function categories(){
  var set = ["全部"], seen = {};
  MENU.items.forEach(function(x){ if(!seen[x.category]){ seen[x.category] = 1; set.push(x.category); } });
  return set;
}
function renderTabs(){
  $("#catTabs").innerHTML = categories().map(function(c){
    return '<button class="tab' + (state.filter === c ? " active" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
  }).join("");
}
function renderMenu(){
  var list = MENU.items.filter(function(x){
    if(state.filter !== "全部" && x.category !== state.filter) return false;
    if(state.q){
      var hay = (x.name + " " + x.tags.join(" ") + " " + x.category).toLowerCase();
      if(hay.indexOf(state.q.toLowerCase()) < 0) return false;
    }
    return true;
  });
  if(state.sort === "priceAsc") list.sort(function(a,b){ return a.price - b.price; });
  if(state.sort === "calAsc") list.sort(function(a,b){ return a.calories - b.calories; });
  $("#menuCount").textContent = "共 " + list.length + " 款 · 数据更新于 " + MENU.meta.updatedAt;
  $("#menuEmpty").hidden = list.length > 0;
  $("#menuGrid").innerHTML = list.map(function(x){
    var inBasket = state.basket.some(function(b){ return b.id === x.id; });
    return '<article class="food-card' + (inBasket ? " added" : "") + '" data-id="' + esc(x.id) + '">' +
      '<div class="food-art">' + artSVG(x.art, { size:64 }) + "</div>" +
      "<h3>" + esc(x.name) + "</h3>" +
      '<div class="food-tags">' + (x.tags.map(function(t){
        return '<span class="tag' + (t === "辣" || t === "人气" ? " hot" : "") + '">' + esc(t) + "</span>";
      }).join("")) + '<span class="tag">' + esc(x.category) + "</span></div>" +
      '<div class="food-meta"><span class="price">演示价 ' + yuan(x.price) + '</span><span class="kcal">' + x.calories + " kcal</span></div>" +
      (x.nutrition ? '<div class="food-nut">' + nutLine(x.nutrition) + "</div>" : "") +
      '<button class="btn" data-add="' + esc(x.id) + '">加入餐盘 +</button></article>';
  }).join("");
}

/* =========================================================
 * 渲染：套餐工坊
 * ========================================================= */
function renderWorkshop(){
  var mode = MODES[state.mode];
  $("#wsModes").innerHTML = Object.keys(MODES).map(function(k){
    return '<button class="ws-mode' + (state.mode === k ? " active" : "") + '" data-mode="' + k + '"><b>' + MODES[k].label + "</b><span>" + MODES[k].desc + "</span></button>";
  }).join("");
  var friesItem = MENU.items.filter(function(x){ return x.art === "fries"; })[0] || MENU.items.filter(function(x){ return x.category === "小食"; })[0];
  if(state.mode === "fries1"){
    state.slots = [friesItem ? friesItem.id : null, state.slots[1] || null];
  }
  var slotHTML = state.slots.map(function(id, i){
    var sc = mode.slots[i];
    var it = id ? byId(id) : null;
    var cls = "slot" + (it ? " filled" : "") + (sc.cat === "base" ? " locked" : "");
    var inner = it
      ? artSVG(it.art, { size:36 }) + "<span><b>" + esc(it.name) + '</b><br><span style="font-family:var(--font-px);font-size:12px;color:var(--caramel)">' + yuan(it.price) + " · " + it.calories + " kcal</span></span>" +
        (sc.cat === "base" ? "" : '<button class="slot-x" data-clearslot="' + i + '" title="移除">×</button>')
      : '<span class="slot-empty">' + (sc.cat === "base" ? "🔒 薯条（中）" : "空槽位 · " + sc.label) + "</span>";
    return '<div class="' + cls + '" data-slot="' + i + '">' + inner + "</div>";
  }).join("");
  $("#wsSlots").innerHTML = slotHTML;

  var cand = MENU.items.filter(function(x){ return state.slots.indexOf(x.id) < 0; });
  $("#wsCandidates").innerHTML = cand.map(function(x){
    var inSlot = state.slots.indexOf(x.id) >= 0;
    return '<button class="ws-item' + (inSlot ? " in-slot" : "") + '" data-fill="' + esc(x.id) + '">' +
      artSVG(x.art, { size:40 }) + esc(x.name) + "<small>" + yuan(x.price) + " · " + x.calories + " kcal</small></button>";
  }).join("");

  var filled = state.slots.filter(Boolean);
  var t = { price:0, cal:0 };
  filled.forEach(function(id){ var x = byId(id); if(x){ t.price += x.price; t.cal += x.calories; } });
  $("#wsPrice").textContent = yuan(t.price);
  $("#wsCal").textContent = t.cal;
  var missing = state.slots.length - filled.length;
  var hint = $("#wsHint");
  if(missing > 0){ hint.textContent = "还差 " + missing + " 个槽位，点击中间食物放入餐盘"; hint.classList.remove("ok"); }
  else { hint.textContent = "齐了！可以把套餐加入餐盘"; hint.classList.add("ok"); }
  $("#wsAdd").disabled = missing > 0;
}
function fillSlot(id){
  var mode = MODES[state.mode];
  var item = byId(id); if(!item) return;
  function ok(sc){ return sc.cat === "任意" ? item.category !== "主食" : sc.cat === "主食" ? item.category === "主食" : item.id === state.slots[0]; }
  var target = -1;
  for(var i = 0; i < state.slots.length; i++){
    if(!state.slots[i] && ok(mode.slots[i])){ target = i; break; }
  }
  if(target < 0){
    for(var j = state.slots.length - 1; j >= 0; j--){
      if(state.slots[j] && mode.slots[j].cat !== "base" && ok(mode.slots[j])){ target = j; break; }
    }
  }
  if(target < 0){ toast("这个分类放不进当前槽位", "！"); return; }
  state.slots[target] = id;
  renderWorkshop();
}
function addCombo(){
  var mode = MODES[state.mode];
  if(state.slots.some(function(s){ return !s; })) return;
  state.slots.forEach(function(id){ addToBasket(id, null, true); });
  if(state.mode === "1p2" || state.mode === "1p3") _comboFlag = true;
  checkUnlocks({ type:"addCombo" });
  if(state.mode === "fries1") unlockBadge("fries");
  toast(mode.label + " 已加入餐盘", "🧪");
}

/* =========================================================
 * 渲染：购物车
 * ========================================================= */
function renderCart(){
  var t = basketTotals();
  $("#cartCount").textContent = t.qty;
  $("#cartSub").textContent = t.qty + " 件 · 合计 " + yuan(t.price) + " · " + t.cal + " kcal";
  $("#cartEmpty").style.display = state.basket.length ? "none" : "";
  $("#cartRows").innerHTML = state.basket.map(function(b){
    var x = byId(b.id); if(!x) return "";
    return '<div class="cart-row" data-id="' + esc(b.id) + '">' + artSVG(x.art, { size:40 }) +
      '<div><div class="row-name">' + esc(x.name) + '</div><div class="row-sub">' + yuan(x.price) + " · " + x.calories + " kcal" + (x.detail ? " · " + esc(x.detail) : "") + "</div></div>" +
      '<div class="qty"><button data-dec="' + esc(b.id) + '">−</button><span>' + b.qty + '</span><button data-inc="' + esc(b.id) + '">+</button></div>' +
      '<div class="row-line">' + yuan(x.price * b.qty) + "</div>" +
      '<button class="row-del" data-del="' + esc(b.id) + '" title="移除">✕</button></div>';
  }).join("");
  $("#cartPrice").textContent = yuan(t.price);
  $("#cartCal").textContent = t.cal + " kcal";
  $("#cartQty").textContent = t.qty;
  var pct = Math.min(100, t.qty * 14);
  $("#trayFill").style.width = pct + "%";
  $("#trayPct").textContent = pct + "%";
  $("#trayItems").innerHTML = state.basket.length
    ? state.basket.map(function(b){ var x = byId(b.id); return x ? artSVG(x.art, { size:36 }) : ""; }).join("")
    : '<span class="cart-bunny-empty">' + mascotHTML("sad", 56) + '<span style="margin-left:10px;color:var(--caramel);font-size:13px">M兔子抱着空盒子在等你…</span></span>';
  renderNoteChips();
  renderHistory();
}
function renderNoteChips(){
  var all = NOTE_PRESETS.concat(state.notes.filter(function(n){ return NOTE_PRESETS.indexOf(n) < 0; }));
  $("#noteChips").innerHTML = all.map(function(n){
    return '<button class="note-chip' + (state.notes.indexOf(n) >= 0 ? " saved" : "") + '" data-note="' + esc(n) + '">' + esc(n) + "</button>";
  }).join("");
}
function renderHistory(){
  var box = $("#historyBox");
  if(!state.history.length){ box.innerHTML = "<h4>历史套餐</h4><p class='his-item'>还没有记录，完成一单后会出现在这里。</p>"; return; }
  var h = state.history[0];
  var d = new Date(h.ts);
  box.innerHTML = "<h4>历史套餐</h4><p class='his-item'>" + esc(h.items.map(function(i){ return i.name + "×" + i.qty; }).join("、")) +
    "<br>" + yuan(h.total) + " · " + h.cal + " kcal · " + (d.getMonth()+1) + "/" + d.getDate() + " " + d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0") + "</p>" +
    '<button class="btn btn-ghost btn-sm" data-repeat="1">再来一单 ↻</button>';
}
var NOTE_PRESETS = ["少冰","去冰","不要番茄","不要生菜","加辣","分开打包","带走","多加酱"];

/* =========================================================
 * 结账：订单信息 → 存档 → 解锁检查 → 奖励演出
 * ========================================================= */
function orderInfo(){
  var lines = state.basket.map(function(b){
    var x = byId(b.id);
    return x ? { name:x.name, qty:b.qty, price:x.price * b.qty, art:x.art, category:x.category, id:x.id } : null;
  }).filter(Boolean);
  var cats = {}, o = { lines:lines, hasFries:false, hasBigmac:false, hasDessert:false, hasBox:false, hasCombo:_comboFlag };
  lines.forEach(function(l){
    cats[l.category] = 1;
    if(l.art === "fries" || /薯条/.test(l.name)) o.hasFries = true;
    if(/巨无霸|双层吉士/.test(l.name) || l.art === "burger2") o.hasBigmac = true;
    if(l.category === "甜品" || l.art === "swirl" || l.art === "pie") o.hasDessert = true;
    var item = byId(l.id);
    if(item && item.box) o.hasBox = true;
  });
  o.cats = cats;
  var t = basketTotals();
  o.price = t.price; o.cal = t.cal; o.qty = t.qty;
  return o;
}
function checkout(){
  var t = basketTotals();
  if(!t.qty){ toast("餐盘还是空的，先选点吃的", "！"); return; }
  var o = orderInfo();
  var note = $("#noteInput").value.trim();
  state.history.unshift({ items:o.lines.map(function(l){ return { name:l.name, qty:l.qty }; }), total:o.price, cal:o.cal, note:note, ts:Date.now() });
  state.history = state.history.slice(0, 5);
  state.basket = [];
  save();
  _comboFlag = false;
  var unlocked = checkUnlocks({ type:"checkout", order:o });
  renderCart(); renderMenu();
  if(unlocked.badges.length || unlocked.skins.length){
    showRewardSequence(unlocked, o);
  } else {
    showModal(
      '<div class="modal-stamp">CLEAR!</div>' +
      '<div style="display:flex;justify-content:center;margin-bottom:10px">' + mascotHTML("jump", 84) + "</div>" +
      "<h3>任务完成</h3><p>像素餐盘已备好（模拟流程）</p>" +
      '<div class="modal-lines">' + o.lines.map(function(l){
        return "<div><span>" + esc(l.name) + " ×" + l.qty + '</span><b>' + yuan(l.price) + "</b></div>";
      }).join("") +
      '<div style="border-top:2px dashed var(--ink);margin-top:6px;padding-top:6px"><span>合计</span><b>' + yuan(o.price) + " · " + o.cal + " kcal</b></div></div>" +
      "<p style='font-size:13px;text-align:left'><b>备注：</b>" + esc(note || "无") + "</p>" +
      '<p class="honest">这是概念原型演示：未连接 mcd-mcp 实时菜单与官方下单渠道，不会产生真实订单。真实价格、优惠与库存以门店和官方渠道为准。</p>' +
      '<button class="btn btn-lg btn-block" data-close="1">收下这份快乐</button>'
    );
    var scene = $("#cart");
    if(scene){ meteorAt(scene, 3); }
  }
}

/* ---------- 奖励演出：宝箱 → 流星 → 卡片翻转 → 金币飞入 ---------- */
function showRewardSequence(unlocked, o){
  var badgeCards = unlocked.badges.map(function(id){
    var b = BADGE_BY_ID[id]; if(!b) return "";
    return '<div class="reward-card flip" style="animation-delay:' + (0.15 + Math.random()*0.2) + 's">' +
      '<div class="rc-ico">' + artSVG(b.icon, { size:44 }) + "</div><b>" + esc(b.name) + "</b><small>徽章 · " + b.rarity + "</small>" +
      '<span class="rc-new">NEW</span></div>';
  }).join("");
  var skinCards = unlocked.skins.map(function(id){
    var s = SKIN_BY_ID[id]; if(!s) return "";
    return '<div class="reward-card flip" style="animation-delay:' + (0.15 + Math.random()*0.2) + 's">' +
      '<div class="rc-ico">' + artSVGRows(s.head, s.pal, 44) + "</div><b>" + esc(s.name) + "</b><small>贪吃蛇皮肤</small>" +
      '<span class="rc-new">NEW</span></div>';
  }).join("");
  showModal(
    '<div class="modal-stamp">CLEAR!</div><h3>任务完成，宝箱已掉落</h3>' +
    '<div style="display:flex;justify-content:center;align-items:flex-end;gap:6px;margin-bottom:10px">' +
      bunBunnyHTML("happy", 88) + mascotHTML("jump", 74) + "</div>" +
    '<div class="gacha-stage" id="gachaStage">' +
      '<div class="gacha-chest" id="gachaChest">' + artSVG("chest", { size:120 }) + "</div>" +
      "<p style='margin-top:12px;font-weight:800'>点击宝箱开启奖励</p>" +
    "</div>" +
    '<div id="gachaRewards" hidden><div class="gacha-rewards">' + badgeCards + skinCards + "</div>" +
    "<p style='font-size:13px;color:var(--caramel);margin-top:14px'>奖励已收入「麦麦收藏馆」，本地永久保存。</p>" +
    '<button class="btn btn-lg btn-block" data-close="1" style="margin-top:10px">去收藏馆看看</button></div>' +
    '<p class="honest">概念原型演示：奖励为本地收藏内容，不涉及真实支付与官方权益。</p>', true
  );
  var chest = $("#gachaChest");
  if(chest){
    chest.addEventListener("click", function(){
      chest.classList.add("opening");
      setTimeout(function(){
        chest.innerHTML = artSVG("chestOpen", { size:120 });
        meteorBurst(chest);
        meteorAt(chest, 5);
        var r = $("#gachaRewards");
        if(r) r.hidden = false;
        flyCoins();
      }, 480);
    });
  }
}
function flyCoins(){
  if(reducedMotion) return;
  var mask = $("#modalMask").getBoundingClientRect();
  var target = $("#navMuseum") ? $("#navMuseum").getBoundingClientRect() : { left: mask.left + 40, top: mask.top + 40, width: 40, height: 40 };
  for(var i = 0; i < 8; i++){
    (function(i){
      var c = document.createElement("div");
      c.className = "coin-fly";
      c.textContent = "◉";
      c.style.left = (mask.left + mask.width/2 + rnd(80) - 40) + "px";
      c.style.top = (mask.top + mask.height/2) + "px";
      c.style.fontSize = (12 + rnd(8)) + "px";
      document.body.appendChild(c);
      requestAnimationFrame(function(){
        c.style.transform = "translate(" + ((target.left + target.width/2) - (mask.left + mask.width/2)) + "px," + ((target.top - mask.top - mask.height/2)) + "px) scale(.6)";
        c.style.opacity = "0";
      });
      setTimeout(function(){ c.remove(); }, 780);
    })(i);
  }
}
