/* =========================================================
 * McPixel · 麦麦切切乐（像素切割街机）
 * 鼠标拖动 / 手指划动 → 轨迹线段与食物真实碰撞判定 → 分裂物理 + 连击
 * ========================================================= */
var slice = null;

var SLICE_FOODS = [
  { id:"burger",  art:"burger",  score:10, r:30, crush:"汉堡" },
  { id:"fries",   art:"fries",   score:8,  r:26, crush:"薯条" },
  { id:"nuggets", art:"nuggets", score:9,  r:26, crush:"麦乐鸡" },
  { id:"cheese",  art:"cheese",  score:12, r:26, crush:"芝士" },
  { id:"cup",     art:"cup",     score:10, r:28, crush:"可乐" },
  { id:"swirl",   art:"swirl",   score:12, r:28, crush:"甜筒" }
];
var SLICE_MODES = [
  { id:"classic", name:"经典模式", desc:"漏掉 5 个食物即结束", lives:5,  bgm:"slice" },
  { id:"timed",   name:"限时 60 秒", desc:"时间内冲击高分",      time:60, bgm:"slice" },
  { id:"fries",   name:"疯狂薯条", desc:"大量薯条，连续切割提升倍率", lives:6, bgm:"slice", friesRush:true },
  { id:"meteor",  name:"流星挑战", desc:"特殊星食伴流星出现",      lives:5, bgm:"slice", meteorFood:true }
];
var SLICE_COMBO_WORDS = [
  { n:2, t:"二连切！" }, { n:3, t:"三连切！" }, { n:5, t:"薯条风暴！" },
  { n:8, t:"汉堡终结者！" }, { n:12, t:"麦门刀圣降临！" }
];

function sliceMode(){ return SLICE_MODES.filter(function(m){ return m.id === slice.mode; })[0] || SLICE_MODES[0]; }
/* 重力随画布高度缩放 → 上升高度与滞空时间在不同屏幕尺寸下保持一致 */
function sliceGravity(){ return (slice && slice.H ? slice.H : 360) * 2.4; }
function sliceDpr(){ return Math.min(2, Math.max(1, window.devicePixelRatio || 1)); }
/* 画布自适应：宽度受容器约束，高度受「视口 - HUD - 按钮」约束 */
function sliceSizeCanvas(cv){
  if(!cv) return;
  var shell = document.getElementById("arcadeSlice");
  var host = cv.parentNode;
  var availW = (host && host.clientWidth) || (shell && shell.clientWidth) || 480;
  availW = Math.floor(Math.max(200, availW));
  var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight || 640;
  var hud = shell ? shell.querySelector(".sl-hud") : null;
  var btns = shell ? shell.querySelector(".slice-btns") : null;
  var reserve = (hud ? hud.offsetHeight : 40) + (btns ? btns.offsetHeight : 40) + 96;
  var maxH = Math.max(200, Math.floor(vh - reserve));
  var W = Math.min(availW, 560), H = Math.round(W * 0.75);
  if(H > maxH){ H = maxH; W = Math.round(H / 0.75); }
  var dpr = sliceDpr();
  if(slice){ slice.W = W; slice.H = H; slice.dpr = dpr; }
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + "px"; cv.style.height = H + "px";
}
var _sliceRO = null;
function sliceBindResize(cv){
  sliceUnbindResize();
  if(!cv) return;
  _sliceRO = { lastW:0 };
  var trigger = function(){ sliceSizeCanvas(document.getElementById("sliceCanvas")); };
  if(window.ResizeObserver){
    _sliceRO.ro = new ResizeObserver(function(entries){
      var w = Math.round(entries[0].contentRect.width);
      if(w === _sliceRO.lastW) return;
      _sliceRO.lastW = w;
      trigger();
    });
    _sliceRO.ro.observe(cv.parentNode || cv);
  }
  _sliceRO.onResize = trigger;
  window.addEventListener("resize", trigger);
  window.addEventListener("orientationchange", trigger);
  if(window.visualViewport) window.visualViewport.addEventListener("resize", trigger);
}
function sliceUnbindResize(){
  if(!_sliceRO) return;
  if(_sliceRO.ro) _sliceRO.ro.disconnect();
  if(_sliceRO.onResize){
    window.removeEventListener("resize", _sliceRO.onResize);
    window.removeEventListener("orientationchange", _sliceRO.onResize);
    if(window.visualViewport) window.visualViewport.removeEventListener("resize", _sliceRO.onResize);
  }
  _sliceRO = null;
}

/* ---------- 生命周期（统一清理，避免隐藏计时器） ---------- */
function sliceStop(){
  sliceUnbindResize();
  if(!slice) return;
  if(slice.raf) cancelAnimationFrame(slice.raf);
  if(slice.spawnTimer) clearInterval(slice.spawnTimer);
  if(slice.timeTimer) clearInterval(slice.timeTimer);
  slice.raf = 0; slice.spawnTimer = 0; slice.timeTimer = 0;
}
function sliceReset(mode){
  sliceStop();
  slice = {
    mode:mode || "classic", running:true, paused:false, over:false,
    score:0, combo:0, comboBest:0, cuts:0, misses:0, friesCut:0, lives:sliceModeLives(mode),
    time:60, ents:[], parts:[], trail:[], texts:[], cutFx:[],
    canvas:null, ctx:null, raf:0, spawnTimer:0, timeTimer:0, last:0, acc:0,
    spawnEvery: 900
  };
  var cv = $("#sliceCanvas");
  if(cv){
    slice.canvas = cv;
    slice.ctx = cv.getContext("2d");
    sliceSizeCanvas(cv);
  }
  slice.lives = sliceModeLives(mode);
  var m = sliceMode();
  if(m.time){ slice.time = m.time; }
  sliceStartLoop();
  SFX.unlock();
  SFX.play("start");
  SFX.playBgm(m.bgm || "slice");
}
function sliceModeLives(mode){
  var m = SLICE_MODES.filter(function(x){ return x.id === mode; })[0] || SLICE_MODES[0];
  return m.lives || 0;
}

function sliceStartLoop(){
  var m = sliceMode();
  /* 手机端降低出场密度，保证玩家有足够反应时间 */
  var density = (window.innerWidth < 560) ? 1.4 : 1;
  slice.spawnEvery = Math.round((m.friesRush ? 420 : m.meteorFood ? 800 : 900) * density);
  slice.spawnTimer = setInterval(function(){
    if(!slice || !slice.running || slice.paused || slice.over) return;
    sliceSpawn();
  }, slice.spawnEvery);
  if(m.time){
    slice.timeTimer = setInterval(function(){
      if(!slice || !slice.running || slice.paused || slice.over) return;
      slice.time--;
      if(slice.time <= 0){ sliceGameOver(); }
      sliceRenderHud();
    }, 1000);
  }
  slice.last = performance.now();
  slice.raf = requestAnimationFrame(sliceLoop);
}

/* ---------- 生成食物 ---------- */
function sliceSpawn(){
  if(!slice) return;
  var m = sliceMode();
  var pool = SLICE_FOODS;
  if(m.friesRush && Math.random() < 0.6) pool = [SLICE_FOODS[1]];
  var f = pick(pool);
  var W = slice.W || 480, H = slice.H || 360;
  /* 出生点：横向 15%~85%，避免贴边出现即飞出 */
  var x = W * 0.15 + rnd(Math.max(20, W * 0.7));
  /* 水平速度：随机方向，靠边出生时朝向画面中心，保证轨迹覆盖可操作区 */
  var vx = (Math.random() - 0.5) * W * 0.24;
  if(x < W * 0.32) vx = Math.abs(vx) * 0.9;
  else if(x > W * 0.68) vx = -Math.abs(vx) * 0.9;
  /* 竖直初速由「目标最高点」反推：最高点落在画面顶部以下 20%~45%，
     重力与上升高度均随画布高度缩放 → 不同屏幕尺寸、不同刷新率表现一致 */
  var apexY = H * (0.20 + Math.random() * 0.25);
  var rise = (H + 40) - apexY;
  var vy = -Math.sqrt(2 * sliceGravity() * rise);
  var isStar = false;
  /* 流星挑战：特殊星食 */
  if(m.meteorFood && Math.random() < 0.18){
    f = { id:"swirl", art:"swirl", score:20, r:28, crush:"流星甜筒" };
    isStar = true;
  }
  /* 障碍物（误切扣分/断连击） */
  var isBomb = Math.random() < 0.1;
  slice.ents.push({
    x:x, y:(slice.H || 360) + 40, vx:vx, vy:vy, rot:(Math.random()-0.5)*0.6, vrot:(Math.random()-0.5)*4.5,
    size:f.r, art:f.art, artId:f.id, score:f.score, alive:true, cut:false, star:isStar,
    bomb:isBomb
  });
}

/* ---------- 输入：轨迹 ---------- */
function slicePoint(e){
  var rect = slice.canvas.getBoundingClientRect();
  var cx = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
  var cy = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
  var sx = (slice.W / rect.width), sy = (slice.H / rect.height);
  return { x:(cx - rect.left) * sx, y:(cy - rect.top) * sy };
}
function sliceBindInput(cv){
  if(!cv || cv._sliceBound) return;
  cv._sliceBound = true;
  function down(e){ if(!slice || !slice.running || slice.over) return; e.preventDefault(); SFX.unlock(); slice.trail = [slicePoint(e)]; }
  function move(e){
    if(!slice || !slice.running || slice.over || slice.paused) return;
    e.preventDefault();
    var p = slicePoint(e);
    var last = slice.trail[slice.trail.length - 1];
    if(!last){ slice.trail.push(p); return; }
    slice.trail.push(p);
    if(slice.trail.length > 14) slice.trail.shift();
    sliceCheckCut(last, p);
  }
  function up(e){ if(!slice) return; slice.trail = []; }
  cv.addEventListener("mousedown", down);
  cv.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  cv.addEventListener("touchstart", down, { passive:false });
  cv.addEventListener("touchmove", move, { passive:false });
  window.addEventListener("touchend", up);
}
/* 线段 (a,b) 与圆的碰撞 */
function sliceSegCircle(a, b, cx, cy, r){
  var dx = b.x - a.x, dy = b.y - a.y;
  var l2 = dx*dx + dy*dy;
  var t = l2 ? ((cx - a.x)*dx + (cy - a.y)*dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  var px = a.x + t*dx, py = a.y + t*dy;
  var d2 = (px-cx)*(px-cx) + (py-cy)*(py-cy);
  return d2 <= r*r;
}
function sliceCheckCut(a, b){
  if(!slice) return;
  /* 本刀已切到的数量（用于连击） */
  var hitThisStroke = -1;
  for(var i = 0; i < slice.ents.length; i++){
    var e = slice.ents[i];
    if(!e.alive || e.cut) continue;
    if(sliceSegCircle(a, b, e.x, e.y, e.size)){
      hitThisStroke++;
      sliceHit(e, i, hitThisStroke);
    }
  }
}
function sliceHit(e, idx, nth){
  e.cut = true; e.alive = false;
  if(e.bomb){
    /* 误切障碍：扣分并中断连击 */
    slice.score = Math.max(0, slice.score - 15);
    slice.combo = 0;
    SFX.play("fail");
    slice.texts.push({ x:e.x, y:e.y, t:"别切我！-15", life:900, born:performance.now(), bad:true });
    sliceSpawnCrumb(e, "#D8262C");
    return;
  }
  var mul = 1 + Math.floor(slice.combo / 4) * 0.5;
  var gain = Math.round(e.score * mul);
  slice.score += gain;
  slice.cuts++;
  if(e.artId === "fries"){ slice.friesCut++; state.sliceFries = (state.sliceFries||0) + 1; }
  slice.combo++;
  slice.comboBest = Math.max(slice.comboBest, slice.combo);
  /* 分裂两个半块 */
  var ang = Math.atan2(e.vy, e.vx);
  for(var s = 0; s < 2; s++){
    var sign = s ? 1 : -1;
    slice.parts.push({
      x:e.x, y:e.y, art:e.art, size:e.size,
      vx:e.vx/2 + Math.cos(ang + sign*1.2) * 90, vy:e.vy/2 + Math.sin(ang + sign*1.2) * 90,
      rot:e.rot, vrot:sign*3, side:sign, life:1400, born:performance.now()
    });
  }
  /* 像素碎屑 */
  sliceSpawnCrumb(e, e.star ? "#FFC72C" : (e.artId === "fries" ? "#FFD54F" : "#F0B429"));
  /* 流星奖励 */
  if(e.star){
    SFX.play("star");
    slice.texts.push({ x:e.x, y:e.y, t:"流星奖励 +" + gain, life:1100, born:performance.now(), star:true });
    for(var k = 0; k < 10; k++){
      slice.parts.push({ x:e.x, y:e.y, art:"star", size:8, vx:(Math.random()-0.5)*160, vy:-(80+Math.random()*120),
        rot:0, vrot:6, side:0, life:1200, born:performance.now() });
    }
  }else{
    SFX.play("slice");
    if(nth > 0) SFX.play("combo", Math.min(12, slice.combo));
  }
  if(slice.score > state.sliceBest){ state.sliceBest = slice.score; save(); }
  sliceRenderHud();
}
function sliceSpawnCrumb(e, color){
  if(reducedMotion) return;
  for(var i = 0; i < 12; i++){
    slice.parts.push({
      x:e.x, y:e.y, art:"crumb", size:3 + rnd(3), color:color,
      vx:(Math.random()-0.5)*180, vy:(Math.random()-0.5)*180 - 40,
      rot:0, vrot:0, side:0, life:700 + rnd(400), born:performance.now(), crumb:true
    });
  }
}

/* ---------- 主循环 ---------- */
function sliceLoop(t){
  if(!slice) return;
  slice.raf = requestAnimationFrame(sliceLoop);
  var dt = Math.min(50, t - (slice.last || t)) / 1000;
  slice.last = t;
  if(slice.paused || slice.over || !slice.running) { sliceDraw(); return; }
  var H = slice.H || 360, W = slice.W || 480;
  var g = sliceGravity();
  /* 食物物理 */
  for(var i = 0; i < slice.ents.length; i++){
    var e = slice.ents[i];
    if(!e.alive) continue;
    e.x += e.vx * dt; e.y += e.vy * dt; e.vy += g * dt; e.rot += e.vrot * dt;
    if(e.y > H + 80){
      e.alive = false;
      if(!e.bomb){
        slice.misses++;
        slice.combo = 0;
        if(sliceMode().lives){
          slice.lives--;
          SFX.play("impatient");
          if(slice.lives <= 0){ sliceGameOver(); return; }
        }
        sliceRenderHud();
      }
    }
  }
  slice.ents = slice.ents.filter(function(e){ return e.alive || performance.now() - (e.deadAt||0) < 10; });
  /* 半块与碎屑 */
  var now = performance.now();
  for(var p = 0; p < slice.parts.length; p++){
    var pt = slice.parts[p];
    pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += g * dt; pt.rot += pt.vrot * dt;
  }
  slice.parts = slice.parts.filter(function(pt){ return now - pt.born < pt.life; });
  slice.texts = slice.texts.filter(function(tx){ return now - tx.born < tx.life; });
  sliceDraw();
}

/* ---------- 绘制 ---------- */
function sliceDraw(){
  if(!slice || !slice.ctx) return;
  var ctx = slice.ctx, W = slice.W, H = slice.H;
  ctx.setTransform(slice.dpr || 1, 0, 0, slice.dpr || 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  /* 背景渐变 + 星空 */
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#282B46"); bg.addColorStop(1, "#3A2E4E");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  for(var s = 0; s < 26; s++){
    ctx.fillStyle = "rgba(255,199,44," + (0.15 + (s % 5) * 0.06) + ")";
    var stx = (s * 73) % W, sty = (s * 41) % (H * 0.6);
    ctx.fillRect(stx, sty, 3, 3);
  }
  /* 半块（裁剪绘制，模拟断面） */
  for(var i = 0; i < slice.parts.length; i++){
    var pt = slice.parts[i];
    if(pt.crumb){
      ctx.fillStyle = pt.color || "#FFD54F";
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      continue;
    }
    var cell = Math.max(1, Math.round(pt.size / 10));
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rot);
    ctx.beginPath();
    ctx.rect(-pt.size, pt.side > 0 ? 0 : -pt.size, pt.size * 2, pt.size);
    ctx.clip();
    drawArtOn(ctx, pt.art, -pt.size, -pt.size, cell, null);
    ctx.restore();
  }
  /* 完整食物 */
  for(var j = 0; j < slice.ents.length; j++){
    var e = slice.ents[j];
    if(!e.alive) continue;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    if(e.star){
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#FFC72C";
      ctx.beginPath(); ctx.arc(0, 0, e.size + 8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    var cell = Math.max(1, Math.round(e.size / 10));
    if(e.bomb){ drawArtOn(ctx, "ghost", -e.size, -e.size, cell, null); }
    else { drawArtOn(ctx, e.art, -e.size, -e.size, cell, null); }
    ctx.restore();
  }
  /* 切割轨迹残影 */
  if(slice.trail.length > 1){
    ctx.lineCap = "round";
    for(var t = 1; t < slice.trail.length; t++){
      var a = slice.trail[t-1], b = slice.trail[t];
      var alpha = t / slice.trail.length;
      ctx.strokeStyle = "rgba(255,199,44," + (alpha * 0.85) + ")";
      ctx.lineWidth = 2 + alpha * 7;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  /* 连击文案 */
  ctx.textAlign = "center";
  for(var k = 0; k < slice.texts.length; k++){
    var tx = slice.texts[k];
    var life = 1 - (performance.now() - tx.born) / tx.life;
    ctx.globalAlpha = Math.max(0, life);
    ctx.fillStyle = tx.bad ? "#FF6B6B" : tx.star ? "#FFC72C" : "#FFF7E8";
    ctx.font = "800 " + (16 + Math.round((1-life)*6)) + "px monospace";
    ctx.fillText(tx.t, tx.x, tx.y - (1-life) * 40);
    ctx.globalAlpha = 1;
  }
  /* 连击提示 */
  for(var c = 0; c < SLICE_COMBO_WORDS.length; c++){
    if(SLICE_COMBO_WORDS[c].n === slice.combo){
      ctx.fillStyle = "#FFC72C";
      ctx.font = "800 26px monospace";
      ctx.fillText(SLICE_COMBO_WORDS[c].t, W/2, 60);
    }
  }
  ctx.textAlign = "left";
}

/* ---------- 结束与奖励 ---------- */
function sliceGameOver(){
  if(!slice || slice.over) return;
  slice.over = true; slice.running = false;
  sliceStop();
  SFX.play("gameover");
  SFX.stopBgm();
  /* 持久化 */
  state.sliceBest = Math.max(state.sliceBest || 0, slice.score);
  state.sliceCombo = Math.max(state.sliceCombo || 0, slice.comboBest);
  state.sliceCuts = (state.sliceCuts || 0) + slice.cuts;
  save();
  addCoins(Math.round(slice.score / 6));
  /* 徽章与皮肤 */
  if(slice.score >= 3000){
    if(unlockSkin("chef")) toast("解锁皮肤：兔子厨师", "🐍");
  }
  if((state.sliceFries || 0) >= 100) unlockBadge("fries_saint");
  if(slice.comboBest >= 12) unlockBadge("slice_combo");
  checkUnlocks({ type:"game", score:Math.max(slice.score, state.snakeBest) });
  sliceRender();
}

/* ---------- DOM ---------- */
function sliceRenderHud(){
  if($("#slScore")) $("#slScore").textContent = slice.score;
  if($("#slCombo")) $("#slCombo").textContent = slice.combo;
  if($("#slBest")) $("#slBest").textContent = state.sliceBest;
  if($("#slLives")) $("#slLives").textContent = sliceMode().lives ? slice.lives : "∞";
  var timeEl = $("#slTime");
  if(timeEl) timeEl.textContent = sliceMode().time ? slice.time + "s" : "—";
}
function sliceRender(){
  var host = $("#arcadeSlice");
  if(!host) return;
  var inner = host.querySelector(".crt-inner") || host;
  if(!slice || slice.over){
    inner.innerHTML =
      '<div class="slice-shell">' +
        (slice && slice.over
          ? '<div class="sl-result"><h3>本局结束</h3>' +
            '<div class="sl-row"><span>得分</span><b>' + slice.score + "</b></div>" +
            '<div class="sl-row"><span>最高连击</span><b>' + slice.comboBest + "</b></div>" +
            '<div class="sl-row"><span>切割数量</span><b>' + slice.cuts + "</b></div>" +
            '<div class="sl-row"><span>历史最高</span><b>' + state.sliceBest + "</b></div>" +
            '<div class="slice-btns">' +
              '<button class="btn btn-sm" data-slagain="1">再来一局 ↻</button>' +
              '<button class="btn btn-sm btn-ghost" data-slback="1">返回菜单</button>' +
            "</div></div>"
          : '<div class="slice-start">' + mascotHTML("wave", 84) +
            "<h3>麦麦切切乐</h3><p>按住鼠标或用手指<b>划过</b>食物即可切割。<br>一次划过多个触发连击；小心<b>幽灵</b>，切到会扣分。</p>" +
            '<div class="slice-modes">' + SLICE_MODES.map(function(m){
              return '<button class="sm-btn" data-slmode="' + m.id + '"><b>' + m.name + "</b><small>" + m.desc + "</small></button>";
            }).join("") + "</div></div>") +
      "</div>";
    inner.querySelectorAll("[data-slmode]").forEach(function(b){
      b.addEventListener("click", function(){ sliceReset(b.getAttribute("data-slmode")); sliceRender(); });
    });
    var ag = inner.querySelector("[data-slagain]");
    if(ag) ag.addEventListener("click", function(){ sliceReset(slice.mode); sliceRender(); });
    var bk = inner.querySelector("[data-slback]");
    if(bk) bk.addEventListener("click", function(){ sliceStop(); slice = null; SFX.stopBgm(); sliceRender(); });
    return;
  }
  inner.innerHTML =
    '<div class="slice-shell play">' +
      '<div class="sl-hud">' +
        "<span>得分 <b id=\"slScore\">" + slice.score + "</b></span>" +
        "<span>连击 <b id=\"slCombo\">" + slice.combo + "</b></span>" +
        "<span>最高 <b id=\"slBest\">" + state.sliceBest + "</b></span>" +
        "<span>生命 <b id=\"slLives\">" + (sliceMode().lives ? slice.lives : "∞") + "</b></span>" +
        "<span>时间 <b id=\"slTime\">" + (sliceMode().time ? slice.time + "s" : "—") + "</b></span>" +
      "</div>" +
      '<div class="sl-canvas-wrap"><canvas id="sliceCanvas"></canvas></div>' +
      '<div class="slice-btns">' +
        '<button class="btn btn-sm" data-slpause="1">' + (slice.paused ? "继续 ▶" : "暂停 ‖") + "</button>" +
        '<button class="btn btn-sm btn-ghost" data-slquit="1">结束</button>' +
      "</div>" +
      '<p class="slice-tip">划过食物切割 · 一次多切触发连击 · 别切到幽灵</p>' +
    "</div>";
  var cv = $("#sliceCanvas");
  if(cv){
    slice.canvas = cv;
    slice.ctx = cv.getContext("2d");
    sliceSizeCanvas(cv);
    sliceBindInput(cv);
    sliceBindResize(cv);
  }
  var ps = inner.querySelector("[data-slpause]");
  if(ps) ps.addEventListener("click", function(){ slice.paused = !slice.paused; SFX.play("click"); sliceRender(); });
  var qt = inner.querySelector("[data-slquit]");
  if(qt) qt.addEventListener("click", function(){ sliceStop(); slice = null; SFX.stopBgm(); sliceRender(); });
}
