/* =========================================================
 * McPixel · 麦麦消消乐（McMatch · 像素三消）
 * 逻辑棋盘与渲染分离；交换/掉落/连锁动画期间锁定输入，防止状态错乱
 * ========================================================= */
var match = null;

var MATCH_TYPES = ["burger", "fries", "nuggets", "cup", "swirl", "cheese"];
var MATCH_ART  = { burger:"burger", fries:"fries", nuggets:"nuggets", cup:"cup", swirl:"swirl", cheese:"cheese" };
var MATCH_NAME = { burger:"汉堡", fries:"薯条", nuggets:"麦乐鸡", cup:"可乐", swirl:"甜筒", cheese:"芝士" };
var MATCH_N = 8, MATCH_CELL = 56;
/* 棋盘单元格动态范围：桌面保持 56px 的大棋盘，手机按可用空间缩小，但不低于可点击下限 */
var MATCH_CELL_MAX = 56, MATCH_CELL_MIN = 26;

var MATCH_LEVELS = [
  { id:1, name:"第一关 · 薯条热身", moves:20, goal:{ kind:"collect", type:"fries", n:15 },      blocks:0, desc:"消除 15 个薯条" },
  { id:2, name:"第二关 · 汉堡收集", moves:22, goal:{ kind:"collect", type:"burger", n:20 },     blocks:0, desc:"收集 20 个汉堡" },
  { id:3, name:"第三关 · 分数挑战", moves:18, goal:{ kind:"score", n:3000 },                    blocks:4, desc:"18 步内拿到 3000 分" },
  { id:4, name:"第四关 · 薯条轰炸", moves:20, goal:{ kind:"bomb", n:3 },                         blocks:6, desc:"触发 3 次薯条炸弹" },
  { id:5, name:"第五关 · 五连消除", moves:24, goal:{ kind:"five", n:1 },                         blocks:8, desc:"完成一次五连消除" }
];
var MATCH_MODES = [
  { id:"classic", name:"经典闯关", desc:"完成关卡目标" },
  { id:"timed",   name:"60 秒疯狂", desc:"限时冲刺高分" },
  { id:"zen",     name:"无限休闲", desc:"轻松刷高分" }
];

function matchLevel(){ return MATCH_LEVELS[Math.min((match.level || 1) - 1, MATCH_LEVELS.length - 1)]; }
function matchStop(){
  matchUnbindResize();
  if(!match) return;
  if(match.raf) cancelAnimationFrame(match.raf);
  if(match.timer) clearInterval(match.timer);
  match.raf = 0; match.timer = 0;
}

/* =========================================================
 * 棋盘自适应：同时受「容器可用宽度」与「视口可用高度」约束
 * 不使用 100vw / 固定像素，改由 ResizeObserver + 容器尺寸 + 动态视口高度计算
 * ========================================================= */
function matchDpr(){ return Math.min(2, Math.max(1, window.devicePixelRatio || 1)); }
/* 重算格子尺寸，并把已存在的像素坐标按比例缩放到新格子体系 */
function matchSetCell(cell){
  cell = Math.max(MATCH_CELL_MIN, Math.min(MATCH_CELL_MAX, Math.round(cell)));
  if(cell === MATCH_CELL) return;
  var f = cell / MATCH_CELL;
  if(match && match.board){
    for(var y = 0; y < MATCH_N; y++){
      if(!match.board[y]) continue;
      for(var x = 0; x < MATCH_N; x++){
        var c = match.board[y][x];
        if(!c) continue;
        c.x *= f; c.y *= f; c.tx *= f; c.ty *= f;
      }
    }
  }
  if(match) (match.floatTexts || []).forEach(function(ft){ ft.x *= f; ft.y *= f; });
  MATCH_CELL = cell;
}
function matchMeasure(){
  var host = document.getElementById("arcadeMatch");
  var wrap = host ? host.querySelector(".mt-board-wrap") : null;
  if(!wrap) return 0;
  var r = wrap.getBoundingClientRect();
  var availW = Math.floor(r.width) || wrap.clientWidth || 320;
  if(availW < 80) availW = 320;
  var ctrl = host ? host.querySelector(".mt-ctrl") : null;
  var reserve = (ctrl ? ctrl.offsetHeight : 48) + 28;
  var vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight || 640;
  var availH = Math.floor(vh - r.top - reserve);
  if(availH < 180 || !isFinite(availH)) availH = Math.floor(vh * 0.54);
  return Math.floor(Math.min(availW, availH) / MATCH_N);
}
function matchResize(){
  if(!match) return;
  var cv = document.getElementById("matchCanvas");
  if(!cv) return;
  var cell = matchMeasure();
  if(cell > 0) matchSetCell(cell);
  var S = MATCH_N * MATCH_CELL;
  var dpr = matchDpr();
  match.dpr = dpr;
  var bw = Math.round(S * dpr);
  if(cv.width !== bw){ cv.width = bw; cv.height = bw; }
  cv.style.width = S + "px";
  cv.style.height = S + "px";
}
var _matchRO = null;
function matchBindResize(){
  matchUnbindResize();
  var host = document.getElementById("arcadeMatch");
  var wrap = host ? host.querySelector(".mt-board-wrap") : null;
  if(!wrap) return;
  _matchRO = { lastW:0 };
  var trigger = function(){ matchResize(); };
  if(window.ResizeObserver){
    /* 只在「宽度」变化时重算，避免自身改变高度造成 ResizeObserver 回环 */
    _matchRO.ro = new ResizeObserver(function(entries){
      var w = Math.round(entries[0].contentRect.width);
      if(w === _matchRO.lastW) return;
      _matchRO.lastW = w;
      trigger();
    });
    _matchRO.ro.observe(wrap);
  }
  _matchRO.onResize = trigger;
  window.addEventListener("resize", trigger);
  window.addEventListener("orientationchange", trigger);
  if(window.visualViewport) window.visualViewport.addEventListener("resize", trigger);
}
function matchUnbindResize(){
  if(!_matchRO) return;
  if(_matchRO.ro) _matchRO.ro.disconnect();
  if(_matchRO.onResize){
    window.removeEventListener("resize", _matchRO.onResize);
    window.removeEventListener("orientationchange", _matchRO.onResize);
    if(window.visualViewport) window.visualViewport.removeEventListener("resize", _matchRO.onResize);
  }
  _matchRO = null;
}
/* ---------- 统一状态机：ready → playing → paused → playing → finished ----------
 * 历史问题：paused / over / busy 多个布尔量分散维护，且与遮罩 DOM 不同步，
 * 一旦遮罩显示但 paused=false，点击遮罩也不会恢复，游戏就永久卡在「已暂停」。
 * 现在只以 match.status 为唯一事实来源，paused / over 由它派生。 */
function matchSetStatus(s){
  if(!match) return;
  match.status = s;
  match.paused = (s === "paused");
  match.over   = (s === "finished");
  matchSyncStatusUI();
}
function matchSyncStatusUI(){
  if(!match) return;
  var v = document.getElementById("mtVeil");
  if(v) v.hidden = !match.paused;
  var pb = document.querySelector("[data-mtpause]");
  if(pb) pb.textContent = match.paused ? "继续 ▶" : "暂停 ‖";
}
function matchIsPlayable(){
  return !!match && match.status === "playing" && !match.busy;
}
function matchPause(){
  if(!match || match.over) return;
  if(match.status === "paused") return;
  matchSetStatus("paused");
  SFX.play("click");
  SFX.stopBgm();
}
function matchResume(){
  if(!match || match.over) return;
  if(match.status !== "paused") return;
  matchSetStatus("playing");
  match.sel = null;
  SFX.play("click");
  SFX.playBgm("arcade");
  if(!match.raf) matchStartLoop();
}
function matchTogglePause(){
  if(!match || match.over) return;
  if(match.status === "paused") matchResume(); else matchPause();
}

/* ---------- 初始化 ---------- */
function matchStart(mode, level){
  matchStop();
  match = {
    mode:mode || "classic", level:level || 1,
    board:[], moving:false, busy:false, lock:false, status:"playing",
    score:0, combo:0, comboBest:0, moves:0, collected:{}, bombCount:0, fiveCount:0,
    energy:0, energyMax:100, time:60, over:false, win:false, paused:false, dpr:1,
    sel:null, swapAnim:null, clears:[], floatTexts:[], fx:[],
    raf:0, timer:0, lastT:0, animT:0
  };
  if(match.mode === "classic") match.moves = matchLevel().moves;
  if(match.mode === "timed") match.time = 60;
  matchBuildBoard();
  matchRender();
  matchSetStatus("playing");
  matchStartLoop();
  SFX.unlock();
  SFX.play("start");
  SFX.playBgm("arcade");
  if(match.mode === "timed"){
    match.timer = setInterval(function(){
      if(!match || match.over || match.paused) return;
      match.time--;
      if(match.time <= 0){ matchEndGame(); return; }
      matchRenderHud();
    }, 1000);
  }
}
/* 初始棋盘：不含自动消除，且保证有可行走步 */
function matchBuildBoard(){
  var blocks = match.mode === "classic" ? matchLevel().blocks : 0;
  var total = MATCH_N * MATCH_N - blocks;
  var attempts = 0;
  do{
    match.board = [];
    for(var y = 0; y < MATCH_N; y++){
      match.board[y] = [];
      for(var x = 0; x < MATCH_N; x++) match.board[y][x] = null;
    }
    for(var i = 0; i < MATCH_N; i++) for(var j = 0; j < MATCH_N; j++){
      var ok = false, tries = 0, t;
      while(!ok && tries < 40){
        t = pick(MATCH_TYPES);
        /* 注意参数顺序：(y, x, type)；此处棋盘为 board[y][x] = board[j][i] */
        ok = !matchWouldMatch(j, i, t);
        tries++;
      }
      match.board[j][i] = { type:t, special:null, x:i*MATCH_CELL, y:j*MATCH_CELL, tx:i*MATCH_CELL, ty:j*MATCH_CELL, scale:1, dying:0, id:Math.random() };
    }
    /* 障碍格 */
    var placed = 0, guard = 0;
    while(placed < blocks && guard++ < 200){
      var bx = rnd(MATCH_N), by = rnd(MATCH_N);
      if(by < MATCH_N - 2 && match.board[by][bx] && !match.board[by][bx].block){
        match.board[by][bx].block = true; placed++;
      }
    }
    attempts++;
  } while(attempts < 12 && !matchHasMove());
}
function matchWouldMatch(y, x, t){
  var b = match.board;
  if(x >= 2 && b[y][x-1] && b[y][x-2] && b[y][x-1].type === t && b[y][x-2].type === t) return true;
  if(y >= 2 && b[y-1][x] && b[y-2][x] && b[y-1][x].type === t && b[y-2][x].type === t) return true;
  return false;
}

/* ---------- 匹配检测 ---------- */
function matchFindGroups(){
  var b = match.board, groups = [], seen = {};
  function key(x, y){ return x + "," + y; }
  /* 横向（run 存坐标，类型需单独记录，否则 run[0].type 恒为 undefined） */
  for(var y = 0; y < MATCH_N; y++){
    var run = [], runType = null;
    for(var x = 0; x <= MATCH_N; x++){
      var c = x < MATCH_N ? b[y][x] : null;
      var t = (c && !c.block) ? c.type : null;
      if(t && t === runType){ run.push({ x:x, y:y }); }
      else{
        if(run.length >= 3){
          var g = run.slice();
          g.forEach(function(p){ seen[key(p.x,p.y)] = true; });
          groups.push({ type:runType, cells:g, len:run.length, dir:"h" });
        }
        run = t ? [{ x:x, y:y }] : [];
        runType = t;
      }
    }
  }
  /* 纵向 */
  for(var x2 = 0; x2 < MATCH_N; x2++){
    var run2 = [], runType2 = null;
    for(var y2 = 0; y2 <= MATCH_N; y2++){
      var c2 = y2 < MATCH_N ? b[y2][x2] : null;
      var t2 = (c2 && !c2.block) ? c2.type : null;
      if(t2 && t2 === runType2){ run2.push({ x:x2, y:y2 }); }
      else{
        if(run2.length >= 3){
          var g2 = run2.slice();
          groups.push({ type:runType2, cells:g2, len:run2.length, dir:"v" });
        }
        run2 = t2 ? [{ x:x2, y:y2 }] : [];
        runType2 = t2;
      }
    }
  }
  return groups;
}
/* 合并成"形状组"，用于判定 T/L → 巨无霸炸弹 */
function matchMergeShapes(groups){
  var byKey = {}, shapes = [];
  groups.forEach(function(g, gi){
    g.cells.forEach(function(p){
      var k = p.x + "," + p.y;
      (byKey[k] = byKey[k] || []).push(gi);
    });
  });
  var used = {};
  groups.forEach(function(g, gi){
    if(used[gi]) return;
    var cluster = [gi], cells = {}, queue = [gi];
    while(queue.length){
      var cur = queue.pop();
      groups[cur].cells.forEach(function(p){
        var k = p.x + "," + p.y;
        (byKey[k] || []).forEach(function(n){
          if(!cluster.some(function(z){ return z===n; })){ cluster.push(n); queue.push(n); }
        });
      });
    }
    var allCells = [], types = {}, dirs = {};
    cluster.forEach(function(i){
      used[i] = true;
      groups[i].cells.forEach(function(p){ allCells.push(p); });
      types[groups[i].type] = true;
      dirs[groups[i].dir] = true;
    });
    /* 去重 */
    var uniq = {}, res = [];
    allCells.forEach(function(p){ var k = p.x+","+p.y; if(!uniq[k]){ uniq[k]=1; res.push(p); } });
    shapes.push({ cells:res, type:Object.keys(types)[0], size:res.length, multiDir:Object.keys(dirs).length > 1, len:Math.max.apply(null, cluster.map(function(i){ return groups[i].len; })) });
  });
  return shapes;
}

/* ---------- 交换 ---------- */
function matchCanSwapS(x1, y1, x2, y2){
  return Math.abs(x1-x2) + Math.abs(y1-y2) === 1;
}
function matchTrySwap(x1, y1, x2, y2){
  if(!matchIsPlayable()) return;
  var a = match.board[y1][x1], b = match.board[y2][x2];
  if(!a || !b || a.block || b.block) return;
  /* 流星甜筒：与普通食物交换 → 清除全场该类型 */
  if(a.special === "color" || b.special === "color"){
    var colorTile = a.special === "color" ? a : b;
    var other = a.special === "color" ? b : a;
    SFX.play("star");
    var targetType = other.type;
    var cleared = [];
    for(var y = 0; y < MATCH_N; y++) for(var x = 0; x < MATCH_N; x++){
      var c = match.board[y][x];
      if(c && !c.block && c.type === targetType){ cleared.push({ x:x, y:y }); }
    }
    cleared.push({ x:x1, y:y1 }, { x:x2, y:y2 });
    matchDoClear(cleared, targetType, true);
    match.meteorUse = (match.meteorUse || 0) + 1;
    state.matchMeteor = (state.matchMeteor || 0) + 1;
    if(!match.fx) match.fx = [];
    for(var s = 0; s < 12; s++) match.fx.push({ kind:"meteor", born:performance.now(), life:900, i:s });
    return;
  }
  match.busy = true;
  /* 先交换再检测 */
  match.board[y1][x1] = b; match.board[y2][x2] = a;
  b.tx = x1*MATCH_CELL; b.ty = y1*MATCH_CELL;
  a.tx = x2*MATCH_CELL; a.ty = y2*MATCH_CELL;
  var groups = matchFindGroups();
  if(!groups.length){
    /* 无效交换 → 复位 */
    SFX.play("fail");
    setTimeout(function(){
      var na = match.board[y2][x2], nb = match.board[y1][x1];
      match.board[y1][x1] = na; match.board[y2][x2] = nb;
      na.tx = x1*MATCH_CELL; na.ty = y1*MATCH_CELL;
      nb.tx = x2*MATCH_CELL; nb.ty = y2*MATCH_CELL;
      match.busy = false;
      toast("这一步不会形成消除", "✕");
    }, 220);
    return;
  }
  SFX.play("click");
  if(match.mode === "classic"){ match.moves--; }
  match.moving = true;
  setTimeout(function(){ matchResolve(); }, 200);
}

/* ---------- 消除 → 重力 → 连锁 ---------- */
function matchResolve(){
  if(!match || match.over) return;
  var groups = matchFindGroups();
  if(!groups.length){
    match.combo = 0;
    match.busy = false;
    if(!matchHasMove()){
      /* 无可用步 → 自动洗牌 */
      SFX.play("gacha");
      matchBuildBoard();
      matchRender();
      toast("没有可消除的组合，已重新洗牌", "↻");
      return;
    }
    matchCheckGoal();
    return;
  }
  var shapes = matchMergeShapes(groups);
  match.combo++;
  match.comboBest = Math.max(match.comboBest, match.combo);
  var cleared = [], lakes = [], spawn = {};
  shapes.forEach(function(sh){
    sh.cells.forEach(function(p){ cleared.push(p); });
    /* 生成道具 */
    if(sh.len >= 5){
      match.fiveCount++;
      spawn[pick(sh.cells).x + "," + pick(sh.cells).y] = "color";
      SFX.play("star");
    }else if(sh.multiDir || sh.size >= 6){
      spawn[pick(sh.cells).x + "," + pick(sh.cells).y] = "big";
    }else if(sh.len === 4){
      spawn[pick(sh.cells).x + "," + pick(sh.cells).y] = "bomb";
    }
  });
  var typeOf = groups[0].type;
  matchDoClear(cleared, typeOf, false, spawn);
}
function matchDoClear(cells, type, isMeteor, spawn){
  var uniq = {}, list = [];
  cells.forEach(function(p){ var k = p.x+","+p.y; if(!uniq[k]){ uniq[k]=1; list.push(p); } });
  /* 特殊道具连锁引爆 */
  var extra = [];
  list.forEach(function(p){
    var c = match.board[p.y] && match.board[p.y][p.x];
    if(c && c.special){
      if(c.special === "bomb" || c.special === "big"){
        var clearFull = c.special === "bomb";
        var box = [];
        if(clearFull){
          for(var x = 0; x < MATCH_N; x++) box.push({ x:x, y:p.y });
          for(var y2 = 0; y2 < MATCH_N; y2++) box.push({ x:p.x, y:y2 });
          match.bombCount++; state.matchFriesBomb = (state.matchFriesBomb||0)+1;
          SFX.play("gacha");
        }else{
          for(var dy = -1; dy <= 1; dy++) for(var dx = -1; dx <= 1; dx++){
            var nx = p.x+dx, ny = p.y+dy;
            if(nx>=0&&ny>=0&&nx<MATCH_N&&ny<MATCH_N) box.push({ x:nx, y:ny });
          }
          SFX.play("combo", 6);
        }
        box.forEach(function(q){ extra.push(q); });
      }
    }
  });
  extra.forEach(function(p){ var k = p.x+","+p.y; if(!uniq[k]){ uniq[k]=1; list.push(p); } });
  /* 计分 */
  var base = 10 + Math.round(list.length * 2);
  var mul = 1 + (match.combo - 1) * 0.5;
  var gain = Math.round(base * mul * list.length * 0.6);
  match.score += gain;
  /* 收集目标 */
  if(type){ match.collected[type] = (match.collected[type] || 0) + list.length; }
  else {
    list.forEach(function(p){
      var c = match.board[p.y] && match.board[p.y][p.x];
      if(c && c.type) match.collected[c.type] = (match.collected[c.type] || 0) + 1;
    });
  }
  /* 能量 */
  match.energy = Math.min(match.energyMax, match.energy + list.length * 4);
  SFX.play(list.length >= 6 ? "achievement" : "slice");
  if(match.combo >= 2) SFX.play("combo", Math.min(12, match.combo));
  match.pushText && match.pushText;
  (match.floatTexts = match.floatTexts || []).push({ t:(isMeteor ? "流星清除！" : match.combo >= 2 ? "COMBO ×" + match.combo + "！" : "+" + gain), born:performance.now(), life:1000, x:list[0].x*MATCH_CELL, y:list[0].y*MATCH_CELL });
  /* 标记消除 + 生成道具 */
  list.forEach(function(p){
    var c = match.board[p.y] && match.board[p.y][p.x];
    if(!c || c.block) return;
    var sp = spawn && spawn[p.x + "," + p.y];
    if(sp){ match.board[p.y][p.x] = { type:c.type, special:sp, x:p.x*MATCH_CELL, y:p.y*MATCH_CELL, tx:p.x*MATCH_CELL, ty:p.y*MATCH_CELL, scale:1, dying:0, id:Math.random() }; }
    else { c.dying = performance.now(); }
  });
  match.clears = list;
  match.moving = true;
  setTimeout(function(){ matchGravity(); }, 260);
}
function matchGravity(){
  if(!match) return;
  var moved = false;
  for(var x = 0; x < MATCH_N; x++){
    var write = MATCH_N - 1;
    for(var y = MATCH_N - 1; y >= 0; y--){
      var c = match.board[y][x];
      if(c && !c.dying && !c.block){
        if(write !== y){
          match.board[write][x] = c; match.board[y][x] = null;
          c.tx = x*MATCH_CELL; c.ty = write*MATCH_CELL;
          moved = true;
        }
        write--;
      }else if(c && c.dying){ match.board[y][x] = null; }
      else if(c && c.block){ write = y - 1; }
    }
    /* 顶部补充新块 */
    for(var y2 = write; y2 >= 0; y2--){
      var cell = match.board[y2][x];
      if(cell && cell.block) continue;
      var t = pick(MATCH_TYPES);
      match.board[y2][x] = { type:t, special:null, x:x*MATCH_CELL, y:-(write-y2+1)*MATCH_CELL, tx:x*MATCH_CELL, ty:y2*MATCH_CELL, scale:1, dying:0, id:Math.random() };
      moved = true;
    }
  }
  if(moved) SFX.play("cart");
  setTimeout(function(){ matchResolve(); }, 300);
}
/* 是否有可用移动 */
function matchHasMove(){
  for(var y = 0; y < MATCH_N; y++) for(var x = 0; x < MATCH_N; x++){
    var c = match.board[y][x];
    if(!c || c.block) continue;
    if(x+1 < MATCH_N){ var r = match.board[y][x+1]; if(r && !r.block && matchSwapWouldWork(x,y,x+1,y)) return true; }
    if(y+1 < MATCH_N){ var d = match.board[y+1][x]; if(d && !d.block && matchSwapWouldWork(x,y,x,y+1)) return true; }
  }
  return false;
}
function matchSwapWouldWork(x1,y1,x2,y2){
  var b = match.board;
  var a = b[y1][x1], c = b[y2][x2];
  b[y1][x1] = c; b[y2][x2] = a;
  var ok = matchWouldMatch(y1,x1,c.type) || matchWouldMatch(y2,x2,a.type);
  b[y1][x1] = a; b[y2][x2] = c;
  return ok;
}
/* 兔兔幸运星：把随机若干格变成同一类型 */
function matchUseStar(){
  if(!match || match.busy || match.over || match.energy < match.energyMax) return;
  match.energy = 0;
  match.busy = true;
  var t = pick(MATCH_TYPES);
  var count = 0;
  for(var i = 0; i < 9; i++){
    var x = rnd(MATCH_N), y = rnd(MATCH_N);
    var c = match.board[y] && match.board[y][x];
    if(c && !c.block && !c.special && c.type !== t){ c.type = t; count++; }
  }
  SFX.play("upgrade");
  toast("兔兔幸运星发动！变身 " + MATCH_NAME[t], "★");
  (match.floatTexts = match.floatTexts || []).push({ t:"幸运星！", born:performance.now(), life:1200, x:MATCH_CELL*3, y:MATCH_CELL*4 });
  setTimeout(function(){ matchResolve(); }, 320);
}
/* 目标与结束 */
function matchCheckGoal(){
  if(!match || match.mode !== "classic") return;
  var L = matchLevel(), g = L.goal, done = false;
  if(g.kind === "collect") done = (match.collected[g.type] || 0) >= g.n;
  else if(g.kind === "score") done = match.score >= g.n;
  else if(g.kind === "bomb") done = match.bombCount >= g.n;
  else if(g.kind === "five") done = match.fiveCount >= g.n;
  if(done){ matchWin(); return; }
  if(match.moves <= 0){ matchEndGame(); }
}
function matchWin(){
  match.win = true;
  matchSetStatus("finished");
  matchStop();
  SFX.play("achievement");
  SFX.stopBgm();
  var L = matchLevel();
  var stars = 1;
  if(match.moves >= Math.ceil(L.moves * 0.4)) stars = 2;
  if(match.moves >= Math.ceil(L.moves * 0.6)) stars = 3;
  state.matchStars[L.id] = Math.max(state.matchStars[L.id] || 0, stars);
  state.matchLevel = Math.max(state.matchLevel, Math.min(MATCH_LEVELS.length, L.id + 1));
  match.streak_push = true;
  state.matchStreak = (state.matchStreak || 0) + 1;
  state.matchBest = Math.max(state.matchBest || 0, match.score);
  save();
  addCoins(40 + stars * 20);
  /* 徽章 */
  if(match.score >= 3000) unlockBadge("match_master");
  if(match.bombCount >= 5) unlockBadge("fries_storm");
  if((state.matchMeteor || 0) >= 10) unlockBadge("meteor_collector");
  if((state.matchStreak || 0) >= 5) unlockBadge("lucky_star");
  var allDone = MATCH_LEVELS.every(function(l){ return (state.matchStars[l.id] || 0) >= 2; });
  if(allDone) unlockBadge("match_god");
  matchRender();
}
function matchEndGame(){
  if(!match || match.over) return;
  match.win = false;
  matchSetStatus("finished");
  matchStop();
  SFX.play("gameover");
  SFX.stopBgm();
  state.matchBest = Math.max(state.matchBest || 0, match.score);
  save();
  addCoins(Math.round(match.score / 20));
  if(match.score >= 3000) unlockBadge("match_master");
  matchRender();
}
/* ---------- 渲染 ---------- */
function matchRenderHud(){
  var h = $("#mtScore"); if(h) h.textContent = match.score;
  var c = $("#mtCombo"); if(c) c.textContent = match.combo;
  var b = $("#mtBest"); if(b) b.textContent = state.matchBest;
  var m = $("#mtMoves"); if(m) m.textContent = match.mode === "classic" ? match.moves : "∞";
  var t = $("#mtTime"); if(t) t.textContent = match.mode === "timed" ? match.time + "s" : "—";
  var e = $("#mtEnergy"); if(e) e.style.width = (match.energy / match.energyMax * 100) + "%";
  var g = $("#mtGoal");
  if(g && match.mode === "classic"){
    var L = matchLevel(), gg = L.goal;
    var cur = gg.kind === "collect" ? (match.collected[gg.type]||0) : gg.kind === "score" ? match.score : gg.kind === "bomb" ? match.bombCount : match.fiveCount;
    g.textContent = L.desc + "（" + Math.min(cur, gg.n) + "/" + gg.n + "）";
  }else if(g){ g.textContent = "自由消除 · 刷新最高分"; }
}
function matchRender(){
  var host = $("#arcadeMatch");
  if(!host) return;
  var inner = host.querySelector(".crt-inner") || host;
  if(!match){
    inner.innerHTML = '<div class="match-start">' + mascotHTML("wave", 84) +
      "<h3>麦麦消消乐</h3><p>交换相邻食物，三个以上连成一线即可消除。<br>四连生成<b>薯条炸弹</b>，T/L 形生成<b>巨无霸炸弹</b>，五连生成<b>流星甜筒</b>。</p>" +
      '<div class="match-modes">' + MATCH_MODES.map(function(m){
        return '<button class="mm-btn" data-mtmode="' + m.id + '"><b>' + m.name + "</b><small>" + m.desc + "</small></button>";
      }).join("") + "</div>" +
      '<div class="match-levels">' + MATCH_LEVELS.map(function(L){
        var unlocked = L.id <= (state.matchLevel || 1);
        var st = state.matchStars[L.id] || 0;
        return '<button class="ml-btn' + (unlocked ? "" : " locked") + '" data-mtlevel="' + L.id + '"' + (unlocked ? "" : " disabled") + '><b>' + L.name + "</b><small>" +
          (unlocked ? L.desc + " · " + (st ? "★".repeat(st) : "未通关") : "未解锁") + "</small></button>";
      }).join("") + "</div></div>";
    inner.querySelectorAll("[data-mtmode]").forEach(function(b){
      b.addEventListener("click", function(){ matchStart(b.getAttribute("data-mtmode"), 1); });
    });
    inner.querySelectorAll("[data-mtlevel]").forEach(function(b){
      b.addEventListener("click", function(){ matchStart("classic", +b.getAttribute("data-mtlevel")); });
    });
    return;
  }
  if(match.over){
    inner.innerHTML = '<div class="match-result">' +
      '<div class="mr-art">' + mascotHTML(match.win ? "jump" : "sad", 84) + "</div>" +
      "<h3>" + (match.win ? "关卡完成！" : "本局结束") + "</h3>" +
      '<div class="mr-row"><span>得分</span><b>' + match.score + "</b></div>" +
      '<div class="mr-row"><span>最高连击</span><b>' + match.comboBest + "</b></div>" +
      '<div class="mr-row"><span>历史最高</span><b>' + state.matchBest + "</b></div>" +
      (match.win ? '<div class="mr-stars">' + "★".repeat(state.matchStars[matchLevel().id] || 1) + "</div>" : "") +
      '<div class="match-btns">' +
        (match.win && match.level < MATCH_LEVELS.length ? '<button class="btn btn-sm" data-mtnext="1">下一关 ▶</button>' : "") +
        '<button class="btn btn-sm btn-ghost" data-mtagain="1">再玩一次 ↻</button>' +
        '<button class="btn btn-sm btn-night" data-mtback="1">返回菜单</button>' +
      "</div></div>";
    var nx = inner.querySelector("[data-mtnext]");
    if(nx) nx.addEventListener("click", function(){ matchStart("classic", match.level + 1); });
    var ag = inner.querySelector("[data-mtagain]");
    if(ag) ag.addEventListener("click", function(){ matchStart(match.mode, match.level); });
    var bk = inner.querySelector("[data-mtback]");
    if(bk) bk.addEventListener("click", function(){ matchStop(); match = null; SFX.stopBgm(); matchRender(); });
    return;
  }
  inner.innerHTML =
    '<div class="match-shell">' +
      '<div class="mt-hud">' +
        '<div class="mt-title">麦麦消消乐<small>' + (match.mode === "classic" ? matchLevel().name : match.mode === "timed" ? "60 秒疯狂" : "无限休闲") + "</small></div>" +
        '<div class="mt-stats">' +
          "<span>得分 <b id=\"mtScore\">" + match.score + "</b></span>" +
          "<span>连击 <b id=\"mtCombo\">" + match.combo + "</b></span>" +
          "<span>最高 <b id=\"mtBest\">" + state.matchBest + "</b></span>" +
          "<span>步数 <b id=\"mtMoves\">" + (match.mode === "classic" ? match.moves : "∞") + "</b></span>" +
          "<span>时间 <b id=\"mtTime\">" + (match.mode === "timed" ? match.time + "s" : "—") + "</b></span>" +
        "</div>" +
        '<div class="mt-goal" id="mtGoal"></div>' +
      "</div>" +
      '<div class="mt-body">' +
        '<div class="mt-board-wrap">' +
          '<canvas id="matchCanvas"></canvas>' +
          '<div class="mt-veil" id="mtVeil" hidden><b>已暂停</b><span>点击继续</span></div>' +
        "</div>" +
        '<div class="mt-side">' + mascotHTML("idle", 56) +
          '<div class="mt-energy"><span>兔兔能量</span><div class="me-bar"><i id="mtEnergy"></i></div></div>' +
        "</div>" +
      "</div>" +
      '<div class="mt-ctrl">' +
        '<button class="btn btn-sm" id="mtSkill" disabled>★ 兔兔幸运星</button>' +
        '<button class="btn btn-sm btn-ghost" data-mtpause="1">暂停 ‖</button>' +
        '<button class="btn btn-sm btn-ghost" data-mtrestart="1">重开 ↻</button>' +
        '<button class="btn btn-sm btn-night" data-mtquit="1">返回</button>' +
      "</div>" +
    "</div>";
  var cv = $("#matchCanvas");
  if(cv){
    matchBindCanvas(cv);
    matchResize();
    matchBindResize();
  }
  var sk = $("#mtSkill");
  if(sk) sk.addEventListener("click", matchUseStar);
  var veil = $("#mtVeil");
  if(veil) veil.addEventListener("click", function(){ if(match && match.paused) matchResume(); });
  var pp = inner.querySelector("[data-mtpause]");
  if(pp) pp.addEventListener("click", matchTogglePause);
  var rs = inner.querySelector("[data-mtrestart]");
  if(rs) rs.addEventListener("click", function(){ SFX.play("page"); matchStart(match.mode, match.level); });
  var qt = inner.querySelector("[data-mtquit]");
  if(qt) qt.addEventListener("click", function(){ matchStop(); match = null; SFX.stopBgm(); matchRender(); });
  /* 状态与 UI 对齐：遮罩只在真正暂停时出现 */
  matchSyncStatusUI();
  /* 从别的游戏页签切回来时，动画循环可能被 stop 过，这里补启，避免棋盘静止不动 */
  if(!match.raf && !match.over && match.status !== "paused") matchStartLoop();
  matchRenderHud();
  matchBindVisibility();
}
/* 切到后台 / 其他标签页时暂停：暂停后必须能通过「继续」真正恢复 */
function matchBindVisibility(){
  if(matchBindVisibility.done) return;
  matchBindVisibility.done = true;
  document.addEventListener("visibilitychange", function(){
    if(!match || match.over) return;
    if(document.hidden){ if(match.status === "playing") matchPause(); }
  });
}
/* canvas 交互 */
function matchBindCanvas(cv){
  if(!cv || cv._mtBound) return;
  cv._mtBound = true;
  var down = null;
  function cell(e){
    var r = cv.getBoundingClientRect();
    var cx = e.touches && e.touches.length ? e.touches[0].clientX : e.clientX;
    var cy = e.touches && e.touches.length ? e.touches[0].clientY : e.clientY;
    var sx = (MATCH_N*MATCH_CELL) / r.width, sy = (MATCH_N*MATCH_CELL) / r.height;
    return { x:Math.floor((cx - r.left) * sx / MATCH_CELL), y:Math.floor((cy - r.top) * sy / MATCH_CELL) };
  }
  cv.addEventListener("mousedown", function(e){ SFX.unlock(); down = cell(e); });
  cv.addEventListener("mouseup", function(e){
    if(!down || !matchIsPlayable()) return;
    var up = cell(e);
    if(matchCanSwapS(down.x, down.y, up.x, up.y)) matchTrySwap(down.x, down.y, up.x, up.y);
    down = null;
  });
  cv.addEventListener("touchstart", function(e){ SFX.unlock(); if(e.cancelable) e.preventDefault(); down = cell(e); }, { passive:false });
  cv.addEventListener("touchmove", function(e){ if(e.cancelable) e.preventDefault(); }, { passive:false });
  cv.addEventListener("touchend", function(e){
    if(e.cancelable) e.preventDefault();
    if(!down || !matchIsPlayable()) return;
    var t = e.changedTouches && e.changedTouches[0];
    var up = null;
    if(t){
      var r = cv.getBoundingClientRect();
      var sx = (MATCH_N*MATCH_CELL) / r.width, sy = (MATCH_N*MATCH_CELL) / r.height;
      up = { x:Math.floor((t.clientX - r.left) * sx / MATCH_CELL), y:Math.floor((t.clientY - r.top) * sy / MATCH_CELL) };
    }
    if(up && matchCanSwapS(down.x, down.y, up.x, up.y)) matchTrySwap(down.x, down.y, up.x, up.y);
    down = null;
  });
}
/* 主绘制循环 */
function matchStartLoop(){
  match.lastT = performance.now();
  function loop(t){
    if(!match) return;
    match.raf = requestAnimationFrame(loop);
    matchDraw();
  }
  match.raf = requestAnimationFrame(loop);
}
function matchDraw(){
  var cv = document.getElementById("matchCanvas");
  if(!cv || !match) return;
  var ctx = cv.getContext("2d");
  var S = MATCH_N * MATCH_CELL;
  /* 高分屏清晰：按 dpr 放大画布位图，绘制坐标仍使用 CSS 像素 */
  ctx.setTransform(match.dpr || 1, 0, 0, match.dpr || 1, 0, 0);
  ctx.fillStyle = "#FFF7E8"; ctx.fillRect(0, 0, S, S);
  /* 棋盘格 */
  for(var y = 0; y < MATCH_N; y++) for(var x = 0; x < MATCH_N; x++){
    ctx.fillStyle = ((x + y) % 2) ? "rgba(244,163,64,.10)" : "rgba(255,199,44,.07)";
    ctx.fillRect(x*MATCH_CELL, y*MATCH_CELL, MATCH_CELL, MATCH_CELL);
  }
  /* 方块 */
  for(var y2 = 0; y2 < MATCH_N; y2++) for(var x2 = 0; x2 < MATCH_N; x2++){
    var c = match.board[y2] && match.board[y2][x2];
    if(!c) continue;
    /* 缓动到目标位置 */
    c.x += (c.tx - c.x) * 0.28;
    c.y += (c.ty - c.y) * 0.28;
    if(Math.abs(c.tx - c.x) < 0.6) c.x = c.tx;
    if(Math.abs(c.ty - c.y) < 0.6) c.y = c.ty;
    var dying = c.dying ? (performance.now() - c.dying) : 0;
    var scale = c.dying ? Math.max(0, 1 - dying / 260) : 1;
    ctx.save();
    ctx.translate(c.x + MATCH_CELL/2, c.y + MATCH_CELL/2);
    if(c.block){
      ctx.fillStyle = "#5F4531";
      ctx.fillRect(-MATCH_CELL/2 + 4, -MATCH_CELL/2 + 4, MATCH_CELL - 8, MATCH_CELL - 8);
      ctx.restore(); continue;
    }
    ctx.scale(scale, scale);
    var cell = Math.round(MATCH_CELL / 10);
    drawArtOn(ctx, MATCH_ART[c.type] || c.type, -MATCH_CELL/2 + 4, -MATCH_CELL/2 + 4, Math.max(1, cell - 1), null);
    /* 道具标记 */
    if(c.special){
      ctx.globalAlpha = 0.85;
      if(c.special === "bomb"){ ctx.strokeStyle = "#D8262C"; ctx.lineWidth = 3; ctx.strokeRect(-MATCH_CELL/2+3, -MATCH_CELL/2+3, MATCH_CELL-6, MATCH_CELL-6); }
      if(c.special === "big"){ ctx.strokeStyle = "#FFC72C"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, MATCH_CELL/2 - 4, 0, Math.PI*2); ctx.stroke(); }
      if(c.special === "color"){ ctx.fillStyle = "rgba(255,199,44,.35)"; ctx.fillRect(-MATCH_CELL/2+3, -MATCH_CELL/2+3, MATCH_CELL-6, MATCH_CELL-6); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  /* 选中高亮 */
  if(match.sel){
    ctx.strokeStyle = "#FFC72C"; ctx.lineWidth = 4;
    ctx.strokeRect(match.sel.x*MATCH_CELL+2, match.sel.y*MATCH_CELL+2, MATCH_CELL-4, MATCH_CELL-4);
  }
  /* 浮动文字 */
  var now = performance.now();
  (match.floatTexts || []).forEach(function(f){
    var life = 1 - (now - f.born) / f.life;
    if(life <= 0) return;
    ctx.globalAlpha = Math.max(0, life);
    ctx.fillStyle = "#D8262C";
    ctx.font = "800 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(f.t, f.x + MATCH_CELL/2, f.y + MATCH_CELL/2 - (1-life)*40);
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  });
  match.floatTexts = (match.floatTexts || []).filter(function(f){ return now - f.born < f.life; });
  /* 能量按钮状态 */
  var sk = document.getElementById("mtSkill");
  if(sk){ sk.disabled = match.energy < match.energyMax; }
  matchRenderHud();
}
