/* =========================================================
 * McPixel · 脆汁鸡桶 & M兔子盒 & 薯条酱料实验室
 * ========================================================= */

/* =========================================================
 * 一、脆汁鸡桶（M兔子盒包装）
 * ========================================================= */
function bucketSize(){ return BUCKET_SIZES.filter(function(s){ return s.id === (state.bucket && state.bucket.size); })[0] || BUCKET_SIZES[1]; }
function bucketParts(){ return (state.bucket && state.bucket.parts) || []; }
function bucketAddons(){ return (state.bucket && state.bucket.addons) || { nuggets:0, fries:0, drink:0 }; }
function bucketSauces(){ return (state.bucket && state.bucket.sauces) || []; }
function bucketTotals(){
  var t = { price:0, cal:0 };
  bucketParts().forEach(function(p){ var x = PART_BY_ID[p]; if(x){ t.price += x.price; t.cal += x.cal; } });
  BUCKET_ADDONS.forEach(function(a){
    var n = bucketAddons()[a.id] || 0;
    t.price += a.price * n; t.cal += a.cal * n;
  });
  bucketSauces().forEach(function(sid){ var s = SAUCE_BY_ID[sid]; if(s){ t.price += s.price; t.cal += s.cal; } });
  t.price += BUCKET_BOX_FEE;
  t.box = BUCKET_BOX_FEE;
  return t;
}
function setBucketSize(id){
  var size = BUCKET_SIZES.filter(function(s){ return s.id === id; })[0];
  if(!size) return;
  var parts = [];
  for(var i = 0; i < size.pieces; i++) parts.push(i % 3 === 0 ? "leg" : i % 3 === 1 ? "wing" : "breast");
  state.bucket = { size:id, parts:parts, addons:{ nuggets:0, fries:0, drink:0 }, sauces:[] };
  save();
  renderBucket();
}
function bucketCyclePart(i){
  var parts = bucketParts().slice();
  if(!parts[i]) return;
  var order = ["leg","wing","breast"];
  parts[i] = order[(order.indexOf(parts[i]) + 1) % order.length];
  state.bucket.parts = parts;
  save();
  renderBucket();
}
function bucketAdjustAddon(id, d){
  var a = BUCKET_ADDONS.filter(function(x){ return x.id === id; })[0];
  if(!a) return;
  var addons = bucketAddons();
  addons[id] = Math.max(0, Math.min(a.max, (addons[id] || 0) + d));
  state.bucket.addons = addons;
  save();
  renderBucket();
}
function bucketToggleSauce(id){
  var s = bucketSauces().slice();
  var i = s.indexOf(id);
  if(i >= 0) s.splice(i, 1);
  else { if(s.length >= 2){ toast("分享盒最多选 2 种酱料", "！"); return; } s.push(id); }
  state.bucket.sauces = s;
  save();
  renderBucket();
}
function bucketAddToCart(){
  var t = bucketTotals();
  var size = bucketSize();
  var id = "bucket_" + Date.now();
  var detail = size.name + " · " + bucketParts().map(function(p){ return PART_BY_ID[p].name; }).join("/");
  var adds = [];
  BUCKET_ADDONS.forEach(function(a){ var n = bucketAddons()[a.id] || 0; if(n) adds.push(a.name + "×" + n); });
  if(adds.length) detail += " · " + adds.join(" · ");
  if(bucketSauces().length) detail += " · 酱：" + bucketSauces().map(function(s){ return SAUCE_BY_ID[s].name; }).join("+");
  registerCustom({
    id:id, name:"M兔子鸡桶分享盒", price:t.price, calories:t.cal,
    art:"bucket", category:"小食", tags:["分享","鸡桶"], custom:true, box:true, detail:detail
  });
  addToBasket(id, $("#bucketStage"));
}
function renderBucket(){
  var host = $("#bucketBuilder");
  if(!host) return;
  var size = bucketSize(), t = bucketTotals();
  if(!state.bucket) setBucketSize("m");
  var sizeHTML = BUCKET_SIZES.map(function(s){
    return '<button class="bucket-size' + (s.id === size.id ? " active" : "") + '" data-bsize="' + s.id + '">' + s.name +
      "<small>" + s.pieces + "块 · " + yuan(s.price) + " · " + s.note + "</small></button>";
  }).join("");
  var piecesHTML = bucketParts().map(function(p, i){
    return '<button class="piece" data-bpiece="' + i + '" title="点击切换部位">' + artSVG(PART_BY_ID[p].art, { size:30 }) + "</button>";
  }).join("");
  var addonHTML = BUCKET_ADDONS.map(function(a){
    var n = bucketAddons()[a.id] || 0;
    return '<div class="bucket-addon">' + artSVG(a.art, { size:32 }) +
      "<b>" + esc(a.name) + "<br><small>" + yuan(a.price) + " · " + a.cal + " kcal</small></b>" +
      '<div class="ing-ctrl"><button class="ing-btn minus" data-baddon="' + a.id + '" data-d="-1">−</button>' +
      '<span class="ing-num">' + n + '</span><button class="ing-btn plus" data-baddon="' + a.id + '" data-d="1">+</button></div></div>';
  }).join("");
  var sauceHTML = SAUCES.map(function(s){
    var on = bucketSauces().indexOf(s.id) >= 0;
    return '<button class="sauce-item' + (on ? " on" : "") + '" data-bsauce="' + s.id + '">' +
      artSVG("sauceCup", { size:34, palette:s.palette }) + esc(s.name) + "<small>" + (s.price ? yuan(s.price) : "免费") + "</small></button>";
  }).join("");
  host.innerHTML =
    '<div class="bucket-stage" id="bucketStage">' +
      '<div class="bucket-art-wrap">' +
        '<div class="bunny-box bucket" id="bucketBox">' +
          '<div class="bb-glow"></div>' +
          '<div class="bb-ear bb-ear-l"></div><div class="bb-ear bb-ear-r"></div>' +
          '<div class="bb-inside"><div class="bi-stars"></div><div class="bi-content">' +
            bucketParts().slice(0,4).map(function(p){ return artSVG(PART_BY_ID[p].art, { size:26 }); }).join("") +
            BUCKET_ADDONS.filter(function(a){ return (bucketAddons()[a.id]||0) > 0; }).map(function(a){ return artSVG(a.art, { size:24 }); }).join("") +
          '</div><span class="bi-label">M兔子盒 · 已开盖</span></div>' +
          '<div class="bb-lid"></div>' +
          '<div class="bb-body"><div class="bb-face">' + artSVG("boxFace", { size:56 }) + '</div><span class="bb-m">' + artSVG("star", { size:16 }) + "</span></div>" +
          '<div class="bucket-pieces">' + piecesHTML + "</div>" +
        "</div>" +
        '<span class="bb-boxcap">点击盒子开盖预览 →</span>' +
      "</div>" +
      '<div class="bucket-info">' +
        '<div class="bucket-size-row">' + sizeHTML + "</div>" +
        '<div class="bucket-addons">' + addonHTML + "</div>" +
        '<div class="bucket-sauces">' + sauceHTML + "</div>" +
        '<div class="bucket-total"><span>合计（含 M兔子盒 ' + yuan(BUCKET_BOX_FEE) + '）</span><b>' + yuan(t.price) + " · " + t.cal + " kcal</b></div>" +
        '<div class="bucket-actions"><button class="btn" id="bucketAdd">装进餐盘 +</button>' +
        '<button class="btn btn-ghost" id="bucketOpen">开盖看看</button></div>' +
      "</div>" +
    "</div>";
  var box = $("#bucketBox");
  if(box){
    box.addEventListener("click", function(){ toggleBunnyBox(box); });
  }
  var openBtn = $("#bucketOpen");
  if(openBtn){
    openBtn.addEventListener("click", function(){
      box.classList.add("open");
      meteorAt(box, 4);
      meteorBurst(box);
    });
  }
  var addBtn = $("#bucketAdd");
  if(addBtn) addBtn.addEventListener("click", bucketAddToCart);
}
function toggleBunnyBox(box){
  box.classList.toggle("open");
  if(box.classList.contains("open")){
    meteorAt(box, 3);
    meteorBurst(box);
    /* 内部星星 */
    var stars = box.querySelector(".bi-stars");
    if(stars && !stars.children.length){
      for(var i = 0; i < 10; i++){
        var s = document.createElement("div");
        s.className = "bi-star";
        s.style.left = rnd(90) + "%";
        s.style.top = rnd(90) + "%";
        s.style.animationDelay = (i * 0.2) + "s";
        stars.appendChild(s);
      }
    }
  }
}

/* =========================================================
 * 二、M兔子盒规格展示（可点击开盖）
 * ========================================================= */
function renderBunnyBoxes(){
  var host = $("#bunnyBoxes");
  if(!host) return;
  host.innerHTML = BUNNY_BOXES.map(function(b, i){
    return '<div class="box-item" data-boxspec="' + b.id + '">' +
      '<div class="bunny-box ' + b.spec + '" data-box="' + b.id + '">' +
        '<div class="bb-glow"></div>' +
        '<div class="bb-ear bb-ear-l"></div><div class="bb-ear bb-ear-r"></div>' +
        '<div class="bb-inside"><div class="bi-stars"></div><div class="bi-content">' +
          b.arts.map(function(a){ return artSVG(a, { size:26 }); }).join("") +
        '</div><span class="bi-label">' + esc(b.content[0]) + "</span></div>" +
        '<div class="bb-lid"></div>' +
        '<div class="bb-body"><div class="bb-face">' + artSVG("boxFace", { size:52 }) + '</div><span class="bb-m">' + artSVG("star", { size:14 }) + "</span></div>" +
      "</div>" +
      '<div style="text-align:center"><b>' + esc(b.name) + "</b><br>" +
      '<small style="font-family:var(--font-px);color:var(--caramel)">' + esc(b.content.join(" · ")) + " · 盒 " + yuan(b.boxPrice) + "</small></div>" +
    "</div>";
  }).join("");
  host.querySelectorAll("[data-box]").forEach(function(box){
    box.addEventListener("click", function(){ toggleBunnyBox(box); });
    box.addEventListener("mouseenter", function(){ meteorAt(box, 2); });
  });
  /* 限定商品光环 */
  var limited = host.querySelector('[data-boxspec="bucket"] .bunny-box');
  if(limited) starHalo(limited, 5000);
}

/* =========================================================
 * 三、薯条酱料实验室
 * ========================================================= */
function friesSauces(){ return state.friesSauces; }
function friesLabTotals(){
  var t = { price:FRIES_BASE.price, cal:FRIES_BASE.cal };
  var list = friesSauces();
  list.forEach(function(sid, i){
    var s = SAUCE_BY_ID[sid];
    if(s){
      if(i > 0) t.price += s.price;   /* 第一种酱免费，其余加购 */
      t.cal += s.cal;
    }
  });
  return t;
}
function friesToggleSauce(id){
  var list = friesSauces().slice();
  var i = list.indexOf(id);
  if(i >= 0) list.splice(i, 1);
  else { if(list.length >= 4){ toast("最多选 4 种酱，克制一点", "！"); return; } list.push(id); }
  state.friesSauces = list;
  renderSauceLab();
}
function friesAddToCart(){
  var list = friesSauces();
  if(!list.length){ toast("先选至少一种蘸酱", "！"); return; }
  var t = friesLabTotals();
  list.forEach(function(sid){ state.saucesUsed[sid] = (state.saucesUsed[sid] || 0) + 1; });
  var comboKey = list.slice().sort().join("+");
  if(list.length >= 2 && state.sauceCombos.indexOf(comboKey) < 0){
    state.sauceCombos.push(comboKey);
    toast("新蘸酱组合已记录：" + list.map(function(s){ return SAUCE_BY_ID[s].name; }).join("+"), "🧪");
  }
  var id = "frieslab_" + Date.now();
  registerCustom({
    id:id, name:"薯条·酱料实验室", price:t.price, calories:t.cal,
    art:"fries", category:"小食", tags:["蘸酱"], custom:true,
    detail:"酱：" + list.map(function(s){ return SAUCE_BY_ID[s].name; }).join(" + ")
  });
  addToBasket(id, $("#friesStage"));
  checkUnlocks({ type:"sauce" });
  save();
}
function renderSauceLab(){
  var host = $("#sauceLab");
  if(!host) return;
  var t = friesLabTotals();
  var list = friesSauces();
  var shelfHTML = SAUCES.map(function(s){
    var on = list.indexOf(s.id) >= 0;
    return '<button class="sauce-item' + (on ? " on" : "") + '" data-fsauce="' + s.id + '">' +
      artSVG("sauceCup", { size:36, palette:s.palette }) + esc(s.name) + "<small>" + (s.price ? yuan(s.price) : "免费") + "</small></button>";
  }).join("");
  var dipHTML = list.map(function(sid, i){
    var s = SAUCE_BY_ID[sid];
    return '<span class="dip-blob" style="width:' + (26 + i * 8) + 'px;background:' + s.color + '"></span>';
  }).join("");
  host.innerHTML =
    '<div class="sauce-stage" id="friesStage">' +
      '<div class="fries-dip">' + artSVG("fries", { size:96 }) + dipHTML + "</div>" +
      '<div style="max-width:220px;font-size:13px;color:var(--caramel);line-height:1.8">' +
        "给薯条选蘸酱：<b>第一种免费</b>，之后每种按价加购。<br>集齐 6 种解锁「酱料科学家」，组合 3 种以上并下单薯条主题套餐即可加冕 <b>薯条大王</b>。" +
      "</div>" +
    "</div>" +
    '<div class="sauce-shelf">' + shelfHTML + "</div>" +
    '<div class="sauce-total"><span>合计（已选 ' + list.length + ' 种）</span><b>' + yuan(t.price) + " · " + t.cal + " kcal</b></div>" +
    '<div class="sauce-actions"><button class="btn" id="friesAdd">加入餐盘 +</button>' +
    '<button class="btn btn-ghost" id="friesReset">重新选酱</button></div>' +
    '<p class="sauce-tip">提示：点击酱料杯即可选中 / 取消，薯条底部会出现对应颜色的蘸酱效果。</p>';
  var addBtn = $("#friesAdd");
  if(addBtn) addBtn.addEventListener("click", friesAddToCart);
  var resetBtn = $("#friesReset");
  if(resetBtn) resetBtn.addEventListener("click", function(){ state.friesSauces = []; renderSauceLab(); });
}
