/* =========================================================
 * McPixel · DIY 汉堡创造工坊
 * 无限叠饼 / 食材自由组合 / 实时可视化 / 彩蛋称号 / 收藏卡
 * ========================================================= */
var DIY_VIEW_H = 320;      /* 预览视口高度 */
var DIY_MIN_SCALE = 0.28;  /* 最小缩放，低于此值改用滚动 */

function diyCounts(){ return state.diy; }
function diyPattyTotal(){ return (state.diy.patty || 0) + (state.diy.pattyChicken || 0); }

/* 食材从上到下的分配顺序（番茄 / 太阳蛋为新增配料） */
var DIY_TOPPINGS = ["cheese","lettuce","tomato","egg","pickle","onion","bacon"];

/* 食材 id → 像素画 key（部分食材的 art 名称与其 id 不同，例如 sauce → sauceDrip） */
function ingArt(id){ var g = ING_BY_ID[id]; return (g && g.art) ? g.art : id; }

/* 组装分层（自上而下）：兔兔汉堡脸顶 → 酱料 → [每个肉饼分配配料] → 面包底 */
function assembleBurger(){
  var c = state.diy, layers = [];
  if(c.bunTop > 0) layers.push({ id:"bunTop", n:1 });
  if(c.sauce > 0) layers.push({ id:"sauce", n:c.sauce });
  var pattyTotal = (c.patty || 0) + (c.pattyChicken || 0);
  var toppings = DIY_TOPPINGS;
  /* 每个肉饼分配一份配料（按数量从上到下），多余配料追加到最后 */
  var leftover = {};
  toppings.forEach(function(t){ leftover[t] = Math.max(0, (c[t] || 0) - pattyTotal); });
  var seq = [];
  for(var p = 0; p < (c.patty || 0); p++) seq.push("patty");
  for(var q = 0; q < (c.pattyChicken || 0); q++) seq.push("pattyChicken");
  for(var i = 0; i < seq.length; i++){
    toppings.forEach(function(t){
      if((c[t] || 0) > 0 && (c[t] - leftover[t]) > i) layers.push({ id:t, n:1 });
    });
    layers.push({ id:seq[i], n:1 });
  }
  toppings.forEach(function(t){
    for(var k = 0; k < leftover[t]; k++) layers.push({ id:t, n:1 });
  });
  if(c.bunBottom > 0) layers.push({ id:"bunBottom", n:1 });
  return layers;
}
function burgerStats(){
  var c = state.diy, price = 0, cal = 0;
  INGREDIENTS.forEach(function(x){
    var n = x.fixed ? 1 : (c[x.id] || 0);
    price += x.price * n; cal += x.cal * n;
  });
  return { price:price, cal:cal, layers:assembleBurger().length, patty:diyPattyTotal() };
}
function burgerTitle(){
  var t = null;
  PATTY_TITLES.forEach(function(x){ if(diyPattyTotal() >= x.at && (!t || x.at > t.at)) t = x; });
  return t;
}
function burgerDetailText(){
  var c = state.diy, parts = [];
  if(c.patty) parts.push("牛肉饼×" + c.patty);
  if(c.pattyChicken) parts.push("鸡肉饼×" + c.pattyChicken);
  if(c.cheese) parts.push("芝士×" + c.cheese);
  if(c.lettuce) parts.push("生菜×" + c.lettuce);
  if(c.tomato) parts.push("番茄×" + c.tomato);
  if(c.egg) parts.push("太阳蛋×" + c.egg);
  if(c.pickle) parts.push("酸黄瓜×" + c.pickle);
  if(c.onion) parts.push("洋葱×" + c.onion);
  if(c.bacon) parts.push("培根×" + c.bacon);
  if(c.sauce) parts.push("酱料×" + c.sauce);
  return parts.join(" · ") || "原味面包";
}

/* ---------- 渲染 ---------- */
function renderDIY(){
  var host = $("#diyIngredients");
  if(!host) return;
  var groups = {}, order = [];
  INGREDIENTS.forEach(function(x){
    if(!groups[x.group]){ groups[x.group] = []; order.push(x.group); }
    groups[x.group].push(x);
  });
  var html = "";
  order.forEach(function(g){
    html += '<div class="ing-group"><div class="ing-group-title">' + esc(g) + "</div>";
    groups[g].forEach(function(x){
      var n = x.fixed ? 1 : (state.diy[x.id] || 0);
      var maxed = n >= x.max;
      html += '<div class="ing-row' + (maxed ? " maxed" : "") + '" data-ing="' + x.id + '">' +
        (x.id === "bunTop" ? bunTopFaceSVG("idle", 34) : artSVG(x.art, { size:34 })) +
        '<div class="ing-info"><b>' + esc(x.name) + '</b><small>' + yuan(x.price) + " · " + x.cal + " kcal</small></div>" +
        '<div class="ing-ctrl">' +
          '<button class="ing-btn minus" data-ingdec="' + x.id + '" ' + (x.fixed ? "disabled" : "") + ' title="减少">−</button>' +
          '<span class="ing-num">' + n + "</span>" +
          '<button class="ing-btn plus" data-inginc="' + x.id + '" ' + (maxed ? "disabled" : "") + ' title="增加">+</button>' +
        "</div></div>";
    });
    html += "</div>";
  });
  host.innerHTML = html;
  renderBurger();
  renderDIYPanel();
}
function renderBurger(animateTop){
  var layers = assembleBurger();
  var stack = $("#burgerStack");
  var vp = $("#burgerViewport");
  if(!stack || !vp) return;
  var html = "";
  layers.forEach(function(l, i){
    var isTop = i === layers.length - 1;
    /* 顶层永远是兔兔汉堡的脸与耳朵（随表情变化），下层才是食材 */
    var svg = (l.id === "bunTop")
      ? bunTopFaceSVG(state.diyExpr || "idle", 132, "bunny-face")
      : artSVG(ingArt(l.id), { size:112 });
    html += '<div class="layer' + (l.id === "bunTop" ? " layer-face" : "") + (animateTop && isTop ? "" : "") + '" style="' + (animateTop && isTop ? "" : "animation:none") + '"' +
      (l.id === "bunTop" ? ' data-bunnyears="1" title="点一下兔耳朵"' : "") + ">" + svg + "</div>";
  });
  stack.innerHTML = html;
  /* 高度自适应：缩放优先，超出最小缩放后允许滚动 */
  var totalH = 0;
  layers.forEach(function(l){
    var a = l.id === "bunTop" ? ART["bunTopFace" + bunnyExprCap(state.diyExpr || "idle")] : ART[ingArt(l.id)];
    var rows = a.rows.length, w = Math.max.apply(null, a.rows.map(function(r){ return r.length; }));
    totalH += 112 * rows / w + 2;
  });
  var scale = Math.min(1, (DIY_VIEW_H - 16) / totalH);
  var hint = $("#diyScaleHint");
  if(scale >= DIY_MIN_SCALE){
    stack.style.transform = "scale(" + scale.toFixed(2) + ")";
    vp.classList.remove("scrollable");
    if(hint) hint.textContent = scale < 0.98 ? ("已自动缩放至 " + Math.round(scale*100) + "% · 完整显示 " + layers.length + " 层") : (layers.length + " 层 · 完整显示");
  }else{
    stack.style.transform = "scale(" + DIY_MIN_SCALE + ")";
    vp.classList.add("scrollable");
    if(hint) hint.textContent = "摩天楼模式：" + layers.length + " 层 · 可滚动查看全貌";
  }
  /* 计数与称号 */
  var pattyN = $("#diyPattyCount");
  if(pattyN) pattyN.textContent = "肉饼 ×" + diyPattyTotal() + " · 共 " + layers.length + " 层";
  var tag = $("#diyTitleTag"), title = burgerTitle();
  if(tag){
    if(title){ tag.textContent = "「" + title.title + "」"; tag.className = "diy-title-tag " + title.cls; }
    else { tag.textContent = "新手汉堡"; tag.className = "diy-title-tag"; }
  }
  /* 创意模式：明显超出实际制作能力的组合（≥10 层肉饼）明确标注，不假装真实可售 */
  var cr = $("#diyCreative");
  if(cr) cr.hidden = diyPattyTotal() < 10;
}
/* 兔兔汉堡表情切换（6 种：平静 / 开心 / 惊讶 / 困倦 / 害羞 / 吃一口） */
var BUNNY_EXPR_LABELS = { idle:"平静", happy:"开心", surprise:"惊讶", sleepy:"困倦", shy:"害羞", bite:"吃一口" };
function renderDIYExpr(){
  var host = $("#diyExprRow");
  if(!host) return;
  host.innerHTML = BUNNY_EXPRS.map(function(e){
    return '<button class="diy-expr' + ((state.diyExpr || "idle") === e ? " on" : "") + '" data-bunexpr="' + e + '" title="' + esc(BUNNY_EXPR_LABELS[e]) + '">' +
      bunTopFaceSVG(e, 30) + "<span>" + esc(BUNNY_EXPR_LABELS[e]) + "</span></button>";
  }).join("");
}
function renderDIYPanel(){
  var s = burgerStats();
  $("#diyPrice").textContent = yuan(s.price);
  $("#diyCal").textContent = s.cal;
  $("#diyLayers").textContent = s.layers;
  $("#diyPattyStat").textContent = s.patty;
  var canAdd = s.layers > 1;
  var addBtn = $("#diyAddBtn");
  if(addBtn) addBtn.disabled = !canAdd;
  renderDIYExpr();
  renderDIYSaved();
}
function renderDIYSaved(){
  var box = $("#diySavedList");
  if(!box) return;
  var saved = store("mcpixel_diysaved_v2") || [];
  if(!saved.length){ box.innerHTML = '<span style="font-size:12px;color:var(--caramel)">还没有收藏，做好汉堡后点「生成收藏卡」保存。</span>'; return; }
  box.innerHTML = saved.map(function(d, i){
    return '<button class="diy-saved-item" data-diyload="' + i + '">' + esc(d.name) + "<small>" + yuan(d.price) + " · " + d.cal + " kcal</small></button>";
  }).join("");
}

/* ---------- 交互 ---------- */
function diyAdjust(id, d){
  var ing = ING_BY_ID[id];
  if(!ing) return;
  if(ing.fixed){ toast(ing.name + "是盒子的底气，不能拿走", "！"); return; }
  var before = diyPattyTotal();
  var n = (state.diy[id] || 0) + d;
  if(n < 0) return;
  if(n > ing.max){ toast(ing.name + "最多 " + ing.max + " 份啦", "！"); return; }
  state.diy[id] = n;
  save();
  renderDIY();
  if(d > 0) renderBurger(true);
  /* 加料反馈：汉堡弹跳 + 兔兔汉堡切换表情（肉饼→惊讶，配料→开心） */
  burgerBounce();
  var isPatty = (id === "patty" || id === "pattyChicken");
  if(d > 0){
    setBunnyExpr(isPatty ? "surprise" : "happy", 1500);
    if(isPatty && diyPattyTotal() % 5 === 0) meteorAt($("#burgerViewport"), 3);
  }else if(d < 0){
    setBunnyExpr("shy", 1200);
  }
  var after = diyPattyTotal();
  /* 彩蛋判定 */
  var t = burgerTitle();
  if(after > before && t){
    var crossed = PATTY_TITLES.filter(function(x){ return x.at > before && x.at <= after; })[0];
    if(crossed){
      showBurgerEgg(crossed);
      checkUnlocks({ type:"diy", cheese:state.diy.cheese || 0, patty:after });
      return;
    }
  }
  if(after !== before) checkUnlocks({ type:"diy", cheese:state.diy.cheese || 0, patty:after });
}
function showBurgerEgg(egg){
  var box = $("#burgerEgg");
  if(box){
    box.innerHTML = '<span class="egg-title">' + esc(egg.title) + "</span><span class='egg-sub'>" + esc(egg.line) + "</span>";
    setTimeout(function(){ box.innerHTML = ""; }, 3200);
  }
  var stack = $("#burgerStack");
  if(stack){ stack.classList.remove("shake"); void stack.offsetWidth; stack.classList.add("shake"); }
  /* 兔兔汉堡自己惊讶 + 监理兔子惊讶 */
  setBunnyExpr("surprise", 2600);
  var bunny = $("#diyBunny");
  if(bunny){
    bunny.classList.remove("surprise"); void bunny.offsetWidth; bunny.classList.add("surprise");
    setTimeout(function(){ bunny.classList.remove("surprise"); }, 1600);
  }
  meteorBurst($("#burgerViewport"));
  meteorAt($("#burgerViewport"), 4);
  toast("称号解锁：" + egg.title, "🏗");
}
/* 汉堡轻微弹跳（加料 / 达成彩蛋时） */
function burgerBounce(){
  var stack = $("#burgerStack");
  if(!stack || reducedMotion) return;
  stack.classList.remove("bounce"); void stack.offsetWidth; stack.classList.add("bounce");
  setTimeout(function(){ stack.classList.remove("bounce"); }, 520);
}
/* 点击兔耳：弹动 + 金色星星 + 表情反馈 */
function pokeBunnyEars(el){
  bunnyEarPoke(el);
  setBunnyExpr(pick(["happy","surprise","bite"]), 1600);
  var sub = $("#diyBunnySub");
  if(sub) sub.textContent = pick(["「呀！耳朵痒痒的。」", "「再叠一层试试？」", "「我数着呢，别偷懒。」", "「嗯…刚刚那口很香。」"]);
  checkUnlocks({ type:"bunny" });
}
function diyAddToCart(){
  var s = burgerStats();
  var nameInput = $("#diyName");
  var name = (nameInput.value || "").trim();
  var id = "diy_" + Date.now();
  var item = registerCustom({
    id:id, name:"DIY·" + (name || "自定义汉堡"), price:s.price, calories:s.cal,
    art:"burger", category:"主食", tags:["DIY","自创"], custom:true,
    detail:burgerDetailText(), patty:s.patty
  });
  addToBasket(id, $("#burgerViewport"));
  /* 兔兔汉堡缩小成像素卡片，沿流星轨迹飞进购物车 */
  setBunnyExpr("bite", 1400);
  bunnyFlyToCart($("#burgerStack"), "bunBunny" + bunnyExprCap("bite"));
  checkUnlocks({ type:"diy", cheese:state.diy.cheese || 0, patty:diyPattyTotal() });
  var title = burgerTitle();
  if(title) toast("「" + title.title + "」已加入餐盘", "🍔");
}
function diySaveCard(){
  var s = burgerStats();
  var nameInput = $("#diyName");
  var name = (nameInput.value || "").trim() || "无名神堡";
  var design = { name:name, price:s.price, cal:s.cal, layers:s.layers, patty:s.patty, expr:state.diyExpr || "idle", diy:JSON.parse(JSON.stringify(state.diy)), ts:Date.now() };
  var saved = store("mcpixel_diysaved_v2") || [];
  saved.unshift(design);
  saved = saved.slice(0, 8);
  store("mcpixel_diysaved_v2", saved);
  renderDIYSaved();
  toast("收藏卡已生成", "🃏");
  openDiyCardModal(design);
}
function diyLoad(i){
  var saved = store("mcpixel_diysaved_v2") || [];
  var d = saved[i];
  if(!d) return;
  state.diy = JSON.parse(JSON.stringify(d.diy));
  save();
  renderDIY();
  toast("已载入「" + d.name + "」", "📂");
}
/* 收藏卡：canvas 绘制 → PNG 下载 */
function openDiyCardModal(design){
  showModal(
    '<h3>像素汉堡收藏卡</h3>' +
    '<div class="collect-card" id="diyCard"></div>' +
    '<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">' +
      '<button class="btn" id="diyCardSave">保存图片 ⬇</button>' +
      '<button class="btn btn-ghost" data-close="1">关闭</button>' +
    "</div>", true
  );
  var host = $("#diyCard");
  var title = null;
  PATTY_TITLES.forEach(function(x){ if(design.patty >= x.at) title = x; });
  host.innerHTML =
    '<div class="cc-head"><b>McPixel 收藏卡</b><span>' + todayMMDD() + "</span></div>" +
    '<div class="cc-art" id="diyCardArt">' + burgerStackSVG(design, 200) + "</div>" +
    '<div class="cc-body">' +
      '<p class="cc-name">' + esc(design.name) + "</p>" +
      '<div class="cc-meta"><span>价格</span><b>' + yuan(design.price) + "</b><span>" + design.cal + " kcal</span></div>" +
      '<div class="cc-meta"><span>肉饼</span><b>×' + design.patty + "</b><span>" + design.layers + " 层</span></div>" +
      '<div class="cc-flavor">' + esc(title ? "称号：" + title.title + " · " + title.line : "一份平静的自定义汉堡。") + "</div>" +
    "</div>" +
    '<div class="cc-foot"><span>麦麦流星兔子乐园</span><span>概念演示数据</span></div>';
  var btn = $("#diyCardSave");
  if(btn){
    btn.addEventListener("click", function(){
      downloadCard("diyCard", "McPixel-汉堡收藏卡-" + design.name);
    });
  }
}
/* 用像素行拼一个汉堡塔 SVG（收藏卡用，可指定最大高度） */
function burgerStackSVG(design, maxH){
  var c = design.diy, layers = [];
  if(c.sauce > 0) for(var si = 0; si < c.sauce; si++) layers.push("sauce");
  var seq = [];
  for(var p = 0; p < (c.patty||0); p++) seq.push("patty");
  for(var q = 0; q < (c.pattyChicken||0); q++) seq.push("pattyChicken");
  var toppings = DIY_TOPPINGS;
  for(var s = 0; s < seq.length; s++){
    toppings.forEach(function(t){
      if((c[t]||0) > 0 && (c[t]) > s) layers.push(t);
    });
    layers.push(seq[s]);
  }
  toppings.forEach(function(t){
    var extra = Math.max(0, (c[t]||0) - seq.length);
    for(var k = 0; k < extra; k++) layers.push(t);
  });
  layers.push("bunBottom");
  var w = 16, totalRows = 0;
  /* 顶部固定为兔兔汉堡脸（含耳朵），底部为面包底 */
  var faceA = ART["bunTopFace" + bunnyExprCap(design.expr || "idle")] || ART.bunTopFaceIdle;
  totalRows += faceA.rows.length;
  layers.forEach(function(n){ totalRows += (ART[ingArt(n)] || ART.bunBunnyIdle).rows.length; });
  var cell = Math.max(1, Math.floor(maxH / totalRows));
  var rects = "", y = 0;
  /* 先画脸 */
  for(var fr = 0; fr < faceA.rows.length; fr++){
    for(var fx = 0; fx < faceA.rows[fr].length; fx++){
      var fch = faceA.rows[fr][fx];
      if(fch === "." || fch === " ") continue;
      rects += '<rect x="' + (fx * cell) + '" y="' + (y + fr) * cell + '" width="' + cell + '" height="' + cell + '" fill="' + (faceA.p[fch] || "#000") + '"/>';
    }
  }
  y += faceA.rows.length;
  layers.forEach(function(n){
    var a = ART[ingArt(n)] || ART.bunBunnyIdle, rw = Math.max.apply(null, a.rows.map(function(r){ return r.length; }));
    for(var r = 0; r < a.rows.length; r++){
      for(var x2 = 0; x2 < a.rows[r].length; x2++){
        var ch = a.rows[r][x2];
        if(ch === "." || ch === " ") continue;
        rects += '<rect x="' + (x2 * cell) + '" y="' + (y + r) * cell + '" width="' + cell + '" height="' + cell + '" fill="' + (a.p[ch] || "#000") + '"/>';
      }
    }
    y += a.rows.length;
  });
  var h = totalRows * cell;
  return '<svg class="art" viewBox="0 0 ' + (w * cell) + " " + h + '" width="' + Math.min(120, w * cell) + '" height="' + h + '" shape-rendering="crispEdges">' + rects + "</svg>";
}
/* HTML 卡片 → canvas → PNG 下载 */
function downloadCard(elId, filename){
  var el = document.getElementById(elId);
  if(!el) return;
  var w = el.offsetWidth, h = el.offsetHeight;
  var canvas = document.createElement("canvas");
  canvas.width = w * 2; canvas.height = h * 2;
  var ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  ctx.fillStyle = "#FFF7E8";
  ctx.fillRect(0, 0, w, h);
  /* 简化处理：把卡片内 SVG 序列化后绘制 */
  var svgs = el.querySelectorAll("svg");
  var done = 0;
  if(!svgs.length){ finish(); return; }
  svgs.forEach(function(svg, i){
    var s = new XMLSerializer().serializeToString(svg);
    var img = new Image();
    img.onload = function(){
      var vb = svg.getAttribute("viewBox").split(" ");
      var sw = +vb[2], sh = +vb[3];
      var box = svg.getBoundingClientRect();
      var rel = { left: box.left - el.getBoundingClientRect().left, top: box.top - el.getBoundingClientRect().top };
      var scale = Math.min(box.width / sw, box.height / sh);
      ctx.drawImage(img, rel.left + (box.width - sw*scale)/2, rel.top + (box.height - sh*scale)/2, sw*scale, sh*scale);
      if(++done === svgs.length) finish();
    };
    img.onerror = function(){ if(++done === svgs.length) finish(); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  });
  function finish(){
    /* 文字信息 */
    ctx.fillStyle = "#5F4531";
    ctx.font = "800 17px monospace";
    var nameEl = el.querySelector(".cc-name, .kc-title");
    if(nameEl) ctx.fillText(nameEl.textContent, 16, h - 16);
    var a = document.createElement("a");
    a.download = filename + ".png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    toast("收藏卡图片已保存", "⬇");
  }
}
