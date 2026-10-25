/* =========================================================
 * McPixel · 麦麦游戏厅
 * 一、麦门人生模拟器（M兔子引导 / 流星命运事件 / 结局收集）
 * 二、像素麦麦贪吃蛇（皮肤 / 主题地图 / 粒子 / 触屏）
 * ========================================================= */

/* =========================================================
 * 一、麦门人生模拟器
 * ========================================================= */
var life = null;
var LIFE_TOTAL_EVENTS = 12;
var LIFE_ENDING_CATS = { legend:"传奇", rare:"稀有", absurd:"荒诞", normal:"普通" };
var LIFE_ATTR_ORDER = ["wealth","happy","luck","full","fame"];

function lifeStart(){
  life = { phase:"identity", identity:null, attrs:{}, queue:[], idx:0, meteorUsed:false, log:[], items:[], coins:0 };
  LIFE_ATTR_ORDER.forEach(function(k){ life.attrs[k] = 1; });
  renderLife();
}
function lifeEvById(id){
  for(var i = 0; i < LIFE_EVENTS.length; i++) if(LIFE_EVENTS[i].id === id) return LIFE_EVENTS[i];
  for(var j = 0; j < LIFE_METEORS.length; j++) if(LIFE_METEORS[j].id === id) return LIFE_METEORS[j];
  return null;
}
function lifePickIdentity(id){
  var ids = LIFE_IDENTITIES.filter(function(x){ return x.id === id; })[0];
  if(!ids || !life) return;
  life.identity = ids;
  LIFE_ATTR_ORDER.forEach(function(k){ life.attrs[k] = 1; });
  for(var k in ids.attr){
    var key = lifeAttrKey(k) || k;
    life.attrs[key] = (life.attrs[key] || 0) + ids.attr[k];
  }
  /* 随机小幅波动 */
  LIFE_ATTR_ORDER.forEach(function(a){ life.attrs[a] += rnd(3); });
  /* 抽取事件队列（不重复；follow 后续事件不进初始池） */
  var pool = LIFE_EVENTS.filter(function(e){ return !e.follow; });
  life.queue = [];
  /* 身份专属事件优先塞进前段 */
  var ex = (LIFE_IDENTITY_EVENTS[ids.id] || []).slice();
  if(ex.length){
    var at = 1 + rnd(3);
    life.queue.push(ex.splice(rnd(ex.length), 1)[0]);
  }
  while(life.queue.length < LIFE_TOTAL_EVENTS && (pool.length || ex.length)){
    var src = (ex.length && Math.random() < 0.45) ? ex : pool;
    if(!src.length) src = pool;
    if(!src.length) break;
    var ev = src.splice(rnd(src.length), 1)[0];
    life.queue.push(ev);
    /* 中段插入流星命运事件 */
    if((life.queue.length === 4 || life.queue.length === 9) && !life.meteorUsed && Math.random() < 0.6){
      life.queue.push(pick(LIFE_METEORS));
      life.meteorUsed = true;
    }
  }
  life.phase = "event";
  life.idx = 0;
  SFX.play("page");
  renderLife();
}
function lifeCurrentEvent(){
  return life ? life.queue[life.idx] : null;
}
function lifeIsMeteor(ev){
  return LIFE_METEORS.indexOf(ev) >= 0;
}
function lifeChoose(ci){
  if(!life || life.phase !== "event") return;
  var ev = lifeCurrentEvent();
  if(!ev) return;
  var ch = ev.choices[ci];
  if(!ch) return;
  /* 属性结算（兼容旧事件的 stamina / charm / mcd 键） */
  for(var k in ch.gain){
    var key = lifeAttrKey(k);
    if(!key) continue;
    life.attrs[key] = Math.max(0, Math.min(20, (life.attrs[key] || 0) + ch.gain[k]));
  }
  /* 分支：该选项牵引出专属后续事件（不是换文案，而是真的改变后续剧情） */
  if(ch.nextId && life.idx + 1 <= life.queue.length){
    var nx = lifeEvById(ch.nextId);
    if(nx) life.queue.splice(life.idx + 1, 0, nx);
  }
  life.log.push({ t:ev.text, c:ch.t, r:ch.r });
  if(lifeIsMeteor(ev)){
    checkUnlocks({ type:"meteor" });
    SFX.play("star");
  }else{
    SFX.play("click");
  }
  life.phase = "result";
  life.lastResult = ch;
  renderLife();
}
function lifeNext(){
  if(!life) return;
  if(life.phase === "result"){
    life.idx++;
    if(life.idx >= life.queue.length){ lifeFinish(); return; }
    life.phase = "event";
    SFX.play("hover");
    renderLife();
  }
}
function lifeFinish(){
  var end = null;
  for(var i = 0; i < LIFE_ENDINGS.length; i++){
    if(LIFE_ENDINGS[i].cond(life.attrs)){ end = LIFE_ENDINGS[i]; break; }
  }
  if(!end) end = LIFE_ENDINGS[LIFE_ENDINGS.length - 1];
  life.phase = "ending";
  life.ending = end;
  state.endings[end.id] = (state.endings[end.id] || 0) + 1;
  save();
  checkUnlocks({ type:"endings" });
  /* 传奇结局 → 天选薯条徽章 + 金币奖励 */
  var reward = end.cat === "legend" ? 120 : end.cat === "rare" ? 60 : 25;
  life.coins = reward;
  addCoins(reward);
  if(end.cat === "legend"){
    if(unlockBadge("chosen_fries", true)){ toast("解锁徽章：天选薯条", "★"); }
  }
  SFX.play(end.cat === "legend" ? "achievement" : end.cat === "absurd" ? "fail" : "gameover");
  renderLife();
  renderLifeCollection();
}
/* 属性行：统一显示新的五维属性 */
function lifeAttrLine(){
  var parts = [];
  LIFE_ATTR_ORDER.forEach(function(k){
    parts.push(LIFE_ATTRS[k] + " <b>" + ((life && life.attrs[k]) || 0) + "</b>");
  });
  return parts.join(" · ");
}
function renderLife(){
  var host = $("#arcadeLife");
  if(!host) return;
  var inner = host.querySelector(".crt-inner") || host;
  if(!life){
    inner.innerHTML =
      '<div class="life-start">' +
        '<div style="display:flex;justify-content:center;margin-bottom:10px">' + mascotHTML("wave", 92) + "</div>" +
        "<h3>麦门人生模拟器</h3>" +
        "<p>你出生在麦当劳宇宙。M兔子会陪你走完这一生：抽身份、抽属性、经历荒诞事件、迎接命运结局。<br>每局约 1 分钟，结局会被收进收藏馆图鉴。</p>" +
        '<button class="btn btn-lg" id="lifeBegin">开始出生 ▶</button>' +
        '<div class="life-collection" id="lifeCollection"></div>' +
      "</div>";
    var b = $("#lifeBegin");
    if(b) b.addEventListener("click", lifeStart);
    renderLifeCollection();
    return;
  }
  if(life.phase === "identity"){
    inner.innerHTML =
      '<div class="life-head"><h3>请选择你的初始身份</h3><span class="life-step">STEP 1 / 出生</span></div>' +
      '<div class="life-idcard">' + mascotHTML("idle", 64) +
        "<div><b>M兔子接引员</b><small>「在麦门宇宙，每一份餐都有前世今生。<br>选个出身吧，属性只是锦上添花，荒诞才是主菜。」</small></div></div>" +
      '<div class="life-identity">' +
        LIFE_IDENTITIES.map(function(x){
          return '<button class="life-id-opt" data-lifeid="' + x.id + '">' + artSVG(x.art, { size:52 }) + esc(x.name) + "<small>" + esc(x.desc) + "</small></button>";
        }).join("") +
      "</div>";
    inner.querySelectorAll("[data-lifeid]").forEach(function(b){
      b.addEventListener("click", function(){ lifePickIdentity(b.getAttribute("data-lifeid")); });
    });
    return;
  }
  if(life.phase === "event"){
    var ev = lifeCurrentEvent();
    var isM = lifeIsMeteor(ev);
    inner.innerHTML =
      '<div class="life-head"><h3>' + (isM ? "☄ 流星命运事件" : "麦门编年史") + '</h3><span class="life-step">STEP ' + (life.idx + 1) + " / " + life.queue.length + " · " + esc(life.identity.name) + "</span></div>" +
      '<div class="life-idcard">' + mascotHTML(isM ? "surprise" : "idle", 56) +
        "<div><b>M兔子</b><small>" + (isM ? "「流星！快许愿——这次事件会改写命运。」" : pick(["「接着往下看。」","「别慌，我也没见过这场面。」","「选哪个都不亏，反正都是编的。」","「我在记笔记，这段不错。」"])) + "</small></div></div>" +
      '<div class="life-text' + (isM ? " hl" : "") + '">' + esc(ev.text) + "</div>" +
      '<div class="life-choices">' +
        ev.choices.map(function(c, i){
          return '<button class="life-choice" data-lifechoice="' + i + '"><span class="tag">' + (i + 1) + "</span>" + esc(c.t) + "</button>";
        }).join("") +
      "</div>" +
      '<div class="life-attr">' + lifeAttrLine() + "</div>";
    inner.querySelectorAll("[data-lifechoice]").forEach(function(b){
      b.addEventListener("click", function(){ lifeChoose(+b.getAttribute("data-lifechoice")); });
    });
    if(isM) meteorAt(host, 5);
    return;
  }
  if(life.phase === "result"){
    var ch = life.lastResult;
    var diff = [];
    for(var k in ch.gain){
      var v = ch.gain[k];
      var key = lifeAttrKey(k);
      if(!key) continue;
      diff.push(LIFE_ATTRS[key] + " " + (v > 0 ? "+" : "") + v);
    }
    inner.innerHTML =
      '<div class="life-head"><h3>事件结果</h3><span class="life-step">STEP ' + (life.idx + 1) + " / " + life.queue.length + "</span></div>" +
      '<div class="life-text">' + esc(ch.r) + "</div>" +
      (diff.length ? '<div class="life-attr">属性变动：' + diff.map(function(d){ return "<b>" + esc(d) + "</b>"; }).join(" · ") + "</div>" : "") +
      '<div class="life-choices"><button class="life-choice" data-lifenext="1">继续人生 ▶</button></div>' +
      '<div class="life-attr">' + lifeAttrLine() + "</div>";
    var nb = inner.querySelector("[data-lifenext]");
    if(nb) nb.addEventListener("click", lifeNext);
    return;
  }
  if(life.phase === "ending"){
    var e = life.ending;
    var gotCount = Object.keys(state.endings).length;
    inner.innerHTML =
      '<div class="life-head"><h3>此生结局</h3><span class="life-step">' + esc(life.identity.name) + " · 一生走完</span></div>" +
      '<div class="life-ending">' +
        '<div style="display:flex;justify-content:center">' + mascotHTML(e.id === "escape" || e.id === "forgotten" ? "sad" : "jump", 88) + "</div>" +
        '<div class="ending-title">' + esc(e.title) + "</div>" +
        '<div class="ending-card">' + artSVG(e.icon, { size:40 }) + " 结局卡片 · " + esc(e.desc) + "</div>" +
        '<p style="font-size:13px;color:#C9B89A;margin-top:10px">' + esc(e.flavor) + "</p>" +
        /* ---- 专属像素人生档案卡 ---- */
        '<div class="life-archive" id="lifeArchive">' +
          '<div class="la-head"><b>像素人生档案卡</b><span>' + todayMMDD() + "</span></div>" +
          '<div class="la-row">' + artSVG(life.identity.art, { size:40 }) +
            "<div class='la-mid'><b>" + esc(life.identity.name) + "</b><small>" +
            esc(LIFE_ENDING_CATS[life.ending.cat] || "普通") + "结局 · " + esc(life.ending.title) + "</small></div>" +
            artSVG(life.ending.icon, { size:40 }) + "</div>" +
          '<div class="la-attrs">' + LIFE_ATTR_ORDER.map(function(k){
            return "<span>" + LIFE_ATTRS[k] + " <b>" + (life.attrs[k] || 0) + "</b></span>";
          }).join("") + "</div>" +
          '<div class="la-log">走过 <b>' + life.log.length + "</b> 个事件 · 获得模拟金币 <b>" + (life.coins || 0) + "</b></div>" +
        "</div>" +
        '<div class="life-attr">' + lifeAttrLine() + "</div>" +
      "</div>" +
      '<div class="life-collection">已收集 ' + gotCount + " / " + LIFE_ENDINGS.length + " 种结局</div>" +
      '<div class="life-choices" style="margin-top:12px">' +
        '<button class="life-choice" data-liferestart="1">重新出生 ↻</button>' +
        '<button class="life-choice" id="lifeCardSave" style="border-color:#8A6B45">保存档案卡 ⬇</button>' +
      "</div>";
    var rb = inner.querySelector("[data-liferestart]");
    if(rb) rb.addEventListener("click", function(){ SFX.play("page"); lifeStart(); });
    var sb = inner.querySelector("#lifeCardSave");
    if(sb) sb.addEventListener("click", function(){
      SFX.play("cart");
      downloadCard("lifeArchive", "McPixel-人生档案卡-" + (life.ending ? life.ending.title : ""));
    });
    meteorAt(host, 4);
    return;
  }
}
function renderLifeCollection(){
  var host = $("#lifeCollection");
  if(!host) return;
  var groups = {}, order = ["legend","rare","absurd","normal"];
  LIFE_ENDINGS.forEach(function(e){
    var c = e.cat || "normal";
    (groups[c] = groups[c] || []).push(e);
  });
  var html = '<div class="lc-count">已收集 <b>' + Object.keys(state.endings).length + "</b> / " + LIFE_ENDINGS.length + " 种结局</div>";
  order.forEach(function(c){
    var list = groups[c];
    if(!list || !list.length) return;
    var got = list.filter(function(e){ return state.endings[e.id]; }).length;
    html += '<div class="lc-group"><span class="lc-cat ' + c + '">' + (LIFE_ENDING_CATS[c] || "普通") +
      "</span><small>" + got + "/" + list.length + "</small></div>" +
      '<div class="lc-items">' + list.map(function(e){
        var has = state.endings[e.id];
        return '<span class="lc-item' + (has ? " got " + (e.cat || "normal") : "") + '" title="' + esc(has ? e.title : "未解锁") + '">' +
          (has ? esc(e.title) : "？？？") + (has && state.endings[e.id] > 1 ? " ×" + state.endings[e.id] : "") + "</span>";
      }).join("") + "</div>";
  });
  host.innerHTML = html;
}

/* =========================================================
 * 二、像素麦麦贪吃蛇
 * ========================================================= */
/* 状态机：idle（未开始） → ready（等待玩家方向输入） → moving（执行一次移动）
 *           → ready … → paused（暂停） → gameOver
 * 关键：不存在任何「自动前进」计时器，只有收到有效方向指令才更新位置 */
var snake = {
  canvas:null, ctx:null, grid:20, cell:20,
  body:[], dir:{x:1,y:0}, nextDir:{x:0,y:0}, phase:"idle",
  food:null, meteorFood:null, score:0, best:state.snakeBest,
  speed:150, acc:0, last:0, running:false, over:false, paused:false,
  particles:[], popups:[], theme:"restaurant", wiggle:0, muted:store("mcpixel_snakemute_v2") || false
};
var SNAKE_FOODS = [
  { id:"burger", art:"burger", score:10, cal:null },
  { id:"fries",  art:"fries",  score:15 },
  { id:"nuggets",art:"nuggets",score:8 },
  { id:"swirl",  art:"swirl",  score:12 },
  { id:"pie",    art:"pie",    score:20 }
];

function snakeTheme(){ return THEME_BY_ID[snake.theme] || SNAKE_THEMES[0]; }
function snakeEquippedSkin(){ return SKIN_BY_ID[state.equippedSkin] || SNAKE_SKINS[0]; }

function snakeInit(){
  var cv = $("#snakeCanvas");
  if(!cv) return;
  snake.canvas = cv;
  snake.ctx = cv.getContext("2d");
  snake.ctx.imageSmoothingEnabled = false;
  cv.width = snake.grid * snake.cell;
  cv.height = snake.grid * snake.cell;
  snakeReset();
  bindSnakeEvents();
  renderSkinPicker();
  renderThemeRow();
  renderSnakeHud();
  requestAnimationFrame(snakeLoop);
}
function snakeReset(){
  /* 初始状态合法：坐标在棋盘内、节点互不重叠、不会触发自撞 */
  snake.body = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  snake.dir = {x:1,y:0};
  snake.nextDir = {x:0,y:0};          /* 尚未移动过 → 首次输入任意方向都生效 */
  snake.score = 0; snake.speed = 150; snake.acc = 0;
  snake.over = false; snake.paused = false; snake.running = true;
  snake.phase = "ready";              /* 已开始，静止等待第一次输入 */
  snake.particles = []; snake.popups = [];
  snake.meteorFood = null;
  snakeSpawnFood();
  renderSnakeHud();
}
function snakeSpawnFood(){
  var t = Math.floor(Math.random() * SNAKE_FOODS.length);
  var f = SNAKE_FOODS[t];
  var x, y, tries = 0;
  /* 避免生成在蛇身上（任何一节都不行，否则会出现「食物刚刷新就撞死」） */
  do {
    x = rnd(snake.grid); y = rnd(snake.grid);
    tries++;
  } while(tries < 200 && snake.body.some(function(s){ return s.x === x && s.y === y; }));
  snake.food = { x:x, y:y, type:f.id, art:f.art, score:f.score, born:Date.now() };
}
function snakeSpawnMeteorFood(){
  var f = SNAKE_FOODS[rnd(SNAKE_FOODS.length)];
  var x, y, tries = 0;
  do {
    x = rnd(snake.grid); y = rnd(snake.grid);
    tries++;
  } while(tries < 200 && snake.body.some(function(s){ return s.x === x && s.y === y; }));
  snake.meteorFood = { x:x, y:y, art:f.art, score:f.score * 2, born:Date.now(), life:6000 };
}
/* 是否允许转向：以上一次「实际移动方向」判定 180° 掉头；未移动过则任意方向可转 */
function snakeCanTurn(dx, dy){
  var d = snake.nextDir;
  if(!d || (!d.x && !d.y)) return true;
  return !(d.x === -dx && d.y === -dy);
}
/* 一次输入 = 移动一格。没有输入时蛇保持静止。 */
function snakeTurn(dx, dy){
  if(!snake) return;
  if(snake.over || snake.phase === "gameOver" || snake.phase === "paused") return;
  if(snake.phase === "idle") snake.phase = "ready";
  if(!snakeCanTurn(dx, dy)){
    toast("不能掉头哦", "↩");
    SFX.play("fail");
    return;
  }
  snake.dir = { x:dx, y:dy };
  snake.nextDir = { x:dx, y:dy };
  snake.phase = "moving";
  snakeStep();
  /* 移动结束后回到静止待命，绝不自动继续前进 */
  if(snake.phase === "moving") snake.phase = "ready";
}
function snakeStep(){
  if(!snake || snake.phase === "gameOver") return;
  var head = { x:snake.body[0].x + snake.dir.x, y:snake.body[0].y + snake.dir.y };
  /* 撞墙 */
  if(head.x < 0 || head.y < 0 || head.x >= snake.grid || head.y >= snake.grid){
    snakeGameOver();
    return;
  }
  /* 撞自己：允许移动到「本次移动后尾部会腾出」的格子 */
  var willEat = !!(snake.food && head.x === snake.food.x && head.y === snake.food.y) ||
                !!(snake.meteorFood && head.x === snake.meteorFood.x && head.y === snake.meteorFood.y);
  var limit = willEat ? snake.body.length : snake.body.length - 1;
  for(var i = 0; i < limit; i++){
    if(snake.body[i].x === head.x && snake.body[i].y === head.y){
      snakeGameOver();
      return;
    }
  }
  snake.body.unshift(head);
  var ate = false;
  if(snake.food && head.x === snake.food.x && head.y === snake.food.y){
    snakeScore(snake.food.score, head);
    snakeSpawnFood();
    ate = true;
    /* 流星主题：概率刷流星食物 */
    if(snakeTheme().meteor && Math.random() < 0.35 && !snake.meteorFood) snakeSpawnMeteorFood();
  }
  if(snake.meteorFood && head.x === snake.meteorFood.x && head.y === snake.meteorFood.y){
    snakeScore(snake.meteorFood.score, head);
    snake.meteorFood = null;
    ate = true;
  }
  if(!ate) snake.body.pop();
  if(!snake.muted) SFX.play("hover");
  renderSnakeHud();
}
function snakeScore(n, at){
  snake.score += n;
  snake.popups.push({ x:at.x, y:at.y, text:"+" + n, life:700, born:Date.now() });
  for(var i = 0; i < 8; i++){
    snake.particles.push({
      x:(at.x + 0.5) * snake.cell, y:(at.y + 0.5) * snake.cell,
      vx:(Math.random() - 0.5) * 3, vy:(Math.random() - 0.5) * 3 - 1,
      life:500, born:Date.now(), color:i % 2 ? "#FFC72C" : "#F4A340"
    });
  }
  snakeBeep(n >= 20 ? 880 : 520, 0.06);
  renderSnakeHud();
}
function snakeGameOver(){
  snake.over = true; snake.running = false; snake.phase = "gameOver";
  if(snake.score > snake.best){
    snake.best = snake.score;
    state.snakeBest = snake.best;
    save();
  }
  state.snakeScores.unshift({ score:snake.score, date:todayMMDD() });
  state.snakeScores = state.snakeScores.slice(0, 5);
  save();
  checkUnlocks({ type:"game", score:snake.score });
  renderSnakeHud();
  renderSnakeBoard();
  snakeBeep(180, 0.18);
  showModal(
    '<div style="display:flex;justify-content:center">' + mascotHTML("sad", 76) + "</div>" +
    "<h3>游戏结束</h3><p>这条蛇撞上了" + (Math.random() < 0.5 ? "墙壁，也撞上了生活。" : "自己的身体，典型的贪心。") + "</p>" +
    '<div class="modal-lines"><div><span>本局得分</span><b>' + snake.score + "</b></div>" +
    "<div><span>最高分</span><b>" + snake.best + "</b></div></div>" +
    '<button class="btn btn-lg btn-block" id="snakeAgain">再来一局 ↻</button>' +
    '<button class="btn btn-text" data-close="1" style="margin-top:6px">返回游戏厅</button>'
  );
  var again = $("#snakeAgain");
  if(again) again.addEventListener("click", function(){ hideModal(); snakeReset(); });
}
function snakeTogglePause(){
  if(snake.over || snake.phase === "gameOver") return;
  if(snake.paused){
    snake.paused = false;
    snake.phase = snake._resumePhase || "ready";
  }else{
    snake._resumePhase = snake.phase === "moving" ? "ready" : snake.phase;
    snake.paused = true;
    snake.phase = "paused";
  }
  toast(snake.paused ? "已暂停" : "继续！", snake.paused ? "⏸" : "▶");
  renderSnakeHud();
}
/* ---------- 绘制 ---------- */
function drawRowsOn(ctx, rows, pal, px, py, cell){
  for(var r = 0; r < rows.length; r++){
    for(var c = 0; c < rows[r].length; c++){
      var ch = rows[r][c];
      if(ch === "." || ch === " ") continue;
      ctx.fillStyle = pal[ch] || "#000";
      ctx.fillRect(px + c * cell, py + r * cell, cell, cell);
    }
  }
}
/* 把一幅像素画缩放进 cell 大小的格子里 */
function artCellSize(art, cell){
  var w = 0, i;
  for(i = 0; i < art.rows.length; i++) if(art.rows[i].length > w) w = art.rows[i].length;
  return (cell - 4) / Math.max(8, w);
}
function drawArtInCell(ctx, art, gx, gy, cell){
  drawRowsOn(ctx, art.rows, art.p, gx * cell + 2, gy * cell + 2, artCellSize(art, cell));
}
function snakeDraw(t){
  var ctx = snake.ctx, theme = snakeTheme(), skin = snakeEquippedSkin();
  var W = snake.canvas.width, H = snake.canvas.height, cell = snake.cell;
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);
  /* 网格 */
  ctx.fillStyle = theme.grid;
  for(var i = 0; i <= snake.grid; i++){
    ctx.fillRect(i * cell, 0, 1, H);
    ctx.fillRect(0, i * cell, W, 1);
  }
  /* 流星主题：背景星点 */
  if(theme.meteor){
    ctx.fillStyle = "rgba(255,199,44,.5)";
    for(var s = 0; s < 14; s++){
      var sx = (s * 97 + 31) % (snake.grid * cell), sy = (s * 53 + 17) % (snake.grid * cell);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
  /* 待输入提示：明确告诉玩家「由你控制，蛇不会自己动」 */
  if(snake.phase === "ready" || snake.phase === "idle"){
    ctx.fillStyle = "rgba(40,43,70,.62)";
    ctx.fillRect(0, H/2 - 30, W, 60);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFE9B0";
    ctx.font = "800 13px monospace";
    ctx.fillText("按方向键 / 滑动屏幕 → 移动一步", W/2, H/2 - 6);
    ctx.fillStyle = "#FFC72C";
    ctx.font = "600 11px monospace";
    ctx.fillText("蛇不会自己动，等你下令", W/2, H/2 + 16);
    ctx.textAlign = "left";
  }
  /* 食物 */
  if(snake.food){
    drawArtInCell(ctx, ART[snake.food.art], snake.food.x, snake.food.y, cell);
  }
  /* 流星奖励食物（带拖尾） */
  if(snake.meteorFood){
    var age = Date.now() - snake.meteorFood.born;
    if(age > snake.meteorFood.life){ snake.meteorFood = null; }
    else{
      var flick = Math.sin(Date.now() / 90) > 0;
      if(flick){
        drawArtInCell(ctx, ART[snake.meteorFood.art], snake.meteorFood.x, snake.meteorFood.y, cell);
        ctx.fillStyle = "rgba(255,199,44,.35)";
        ctx.fillRect(snake.meteorFood.x * cell - 8, snake.meteorFood.y * cell + cell/2 - 1, cell + 16, 2);
      }
    }
  }
  /* 蛇身（带摆动） */
  snake.wiggle = t / 130;
  for(var i = snake.body.length - 1; i >= 0; i--){
    var seg = snake.body[i];
    var bob = Math.round(Math.sin(snake.wiggle + i * 0.55) * cell * 0.14);
    var rows = i === 0 ? skin.head : skin.body;
    var px = seg.x * cell, py = seg.y * cell + bob;
    if(i === 0){
      /* 头部眼睛（按方向） */
      drawRowsOn(ctx, rows, skin.pal, px, py, cell / 10);
      ctx.fillStyle = "#5F4531";
      if(snake.dir.x === 1){ ctx.fillRect(px + cell * 0.62, py + cell * 0.28, cell * 0.16, cell * 0.16); ctx.fillRect(px + cell * 0.62, py + cell * 0.58, cell * 0.16, cell * 0.16); }
      else if(snake.dir.x === -1){ ctx.fillRect(px + cell * 0.22, py + cell * 0.28, cell * 0.16, cell * 0.16); ctx.fillRect(px + cell * 0.22, py + cell * 0.58, cell * 0.16, cell * 0.16); }
      else if(snake.dir.y === -1){ ctx.fillRect(px + cell * 0.28, py + cell * 0.22, cell * 0.16, cell * 0.16); ctx.fillRect(px + cell * 0.58, py + cell * 0.22, cell * 0.16, cell * 0.16); }
      else { ctx.fillRect(px + cell * 0.28, py + cell * 0.62, cell * 0.16, cell * 0.16); ctx.fillRect(px + cell * 0.58, py + cell * 0.62, cell * 0.16, cell * 0.16); }
    }else{
      drawRowsOn(ctx, rows, skin.pal, px, py, cell / 10);
    }
  }
  /* 粒子 */
  snake.particles = snake.particles.filter(function(p){ return Date.now() - p.born < p.life; });
  snake.particles.forEach(function(p){
    var k = 1 - (Date.now() - p.born) / p.life;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x + p.vx * (1 - k) * 30, p.y + p.vy * (1 - k) * 30, 3, 3);
  });
  ctx.globalAlpha = 1;
  /* 得分飘字 */
  snake.popups = snake.popups.filter(function(p){ return Date.now() - p.born < p.life; });
  snake.popups.forEach(function(p){
    var k = 1 - (Date.now() - p.born) / p.life;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = "#D8262C";
    ctx.font = "800 12px monospace";
    ctx.fillText(p.text, p.x * cell, p.y * cell - (1 - k) * 18);
  });
  ctx.globalAlpha = 1;
  /* 暂停 / 结束遮罩 */
  if(snake.paused && !snake.over){
    ctx.fillStyle = "rgba(40,43,70,.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#FFC72C";
    ctx.font = "800 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", W/2, H/2);
    ctx.textAlign = "left";
  }
}
function snakeLoop(t){
  if(!snake.last) snake.last = t;
  snake.last = t;
  /* 无自动移动：位置只在 snakeTurn() 收到有效方向指令时更新 */
  if(snake.canvas) snakeDraw(t);
  requestAnimationFrame(snakeLoop);
}
/* ---------- 音效（8-bit 蜂鸣） ---------- */
function snakeBeep(freq, dur){
  if(snake.muted) return;
  try{
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    if(!snake._ac) snake._ac = new AC();
    var o = snake._ac.createOscillator(), g = snake._ac.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g); g.connect(snake._ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, snake._ac.currentTime + dur);
    o.stop(snake._ac.currentTime + dur);
  }catch(e){}
}
/* ---------- HUD / 皮肤 / 主题 / 排行榜 ---------- */
function renderSnakeHud(){
  if($("#snakeScore")) $("#snakeScore").textContent = snake.score;
  if($("#snakeBest")) $("#snakeBest").textContent = snake.best;
  if($("#snakeLen")) $("#snakeLen").textContent = snake.body.length;
  if($("#snakeState")) $("#snakeState").textContent = snake.over ? "已结束" : snake.paused ? "暂停中" : "进行中";
}
function renderSkinPicker(){
  var host = $("#skinPicker");
  if(!host) return;
  host.innerHTML = SNAKE_SKINS.map(function(s){
    var has = state.skins[s.id] || s.id === "classic";
    var eq = state.equippedSkin === s.id;
    return '<button class="skin-item' + (has ? "" : " locked") + (eq ? " equipped" : "") + '" data-skin="' + s.id + '" title="' + esc(s.cond) + '">' +
      artSVGRows(s.head, s.pal, 34) + esc(s.name) + "<small>" + (has ? (eq ? "使用中" : "点击装备") : "未解锁") + "</small></button>";
  }).join("");
  host.querySelectorAll("[data-skin]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-skin");
      if(!state.skins[id] && id !== "classic"){
        toast("未解锁：" + SKIN_BY_ID[id].cond, "🔒");
        return;
      }
      state.equippedSkin = id;
      save();
      renderSkinPicker();
      if(typeof renderSkinGallery === "function") renderSkinGallery();
      toast("已装备：" + SKIN_BY_ID[id].name, "🐍");
    });
  });
}
function renderThemeRow(){
  var host = $("#themeRow");
  if(!host) return;
  host.innerHTML = SNAKE_THEMES.map(function(t){
    var live = !t.window || inWindow(t.window);
    var titleAttr = live ? "" : ' title="节日限定 · ' + t.window[0] + " ~ " + t.window[1] + '"';
    return '<button class="theme-chip' + (snake.theme === t.id ? " active" : "") + (live ? " live" : "") + '" data-theme="' + t.id + '"' + titleAttr + ">" + esc(t.name) + "</button>";
  }).join("");
  host.querySelectorAll("[data-theme]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-theme");
      var t = THEME_BY_ID[id];
      if(t.window && !inWindow(t.window)){ toast("节日限定地图，仅活动期间开放", "🔒"); return; }
      snake.theme = id;
      renderThemeRow();
      toast("地图切换：" + t.name, "🗺");
    });
  });
}
function renderSnakeBoard(){
  var host = $("#snakeBoard");
  if(!host) return;
  if(!state.snakeScores.length){ host.innerHTML = "<h4>本地排行榜</h4><p style='font-size:12px;color:#C9B89A'>还没有记录，去跑一局！</p>"; return; }
  host.innerHTML = "<h4>本地排行榜</h4><ol>" + state.snakeScores.map(function(s, i){
    return '<li class="' + (i === 0 && s.score === snake.score ? "me" : "") + '">' + s.score + " 分 <span style='color:#8A6B45'>· " + esc(s.date) + "</span></li>";
  }).join("") + "</ol>";
}
function bindSnakeEvents(){
  document.addEventListener("keydown", function(e){
    if(!isArcadeOpen()) return;
    var k = e.key;
    if(k === "ArrowUp" || k === "w" || k === "W"){ snakeTurn(0,-1); e.preventDefault(); }
    else if(k === "ArrowDown" || k === "s" || k === "S"){ snakeTurn(0,1); e.preventDefault(); }
    else if(k === "ArrowLeft" || k === "a" || k === "A"){ snakeTurn(-1,0); e.preventDefault(); }
    else if(k === "ArrowRight" || k === "d" || k === "D"){ snakeTurn(1,0); e.preventDefault(); }
    else if(k === " "){ snakeTogglePause(); e.preventDefault(); }
  });
  var cv = $("#snakeCanvas");
  if(cv){
    var ts = null;
    cv.addEventListener("touchstart", function(e){
      if(e.cancelable) e.preventDefault();
      ts = e.touches[0];
    }, { passive:false });
    cv.addEventListener("touchend", function(e){
      if(e.cancelable) e.preventDefault();
      if(!ts) return;
      var te = e.changedTouches[0];
      var dx = te.clientX - ts.clientX, dy = te.clientY - ts.clientY;
      /* 点击（非滑动）= 暂停/继续；滑动 = 移动一格 */
      if(Math.abs(dx) < 24 && Math.abs(dy) < 24){ snakeTogglePause(); ts = null; return; }
      if(Math.abs(dx) > Math.abs(dy)) snakeTurn(dx > 0 ? 1 : -1, 0);
      else snakeTurn(0, dy > 0 ? 1 : -1);
      ts = null;
    }, { passive:false });
  }
  ["up","down","left","right"].forEach(function(d){
    var b = $("#pad" + d.charAt(0).toUpperCase() + d.slice(1));
    if(b) b.addEventListener("click", function(){
      if(d === "up") snakeTurn(0,-1);
      if(d === "down") snakeTurn(0,1);
      if(d === "left") snakeTurn(-1,0);
      if(d === "right") snakeTurn(1,0);
    });
  });
  var pb = $("#snakePauseBtn"); if(pb) pb.addEventListener("click", snakeTogglePause);
  var rb = $("#snakeRestartBtn"); if(rb) rb.addEventListener("click", snakeReset);
  var mb = $("#snakeMuteBtn"); if(mb) mb.addEventListener("click", function(){
    snake.muted = !snake.muted;
    store("mcpixel_snakemute_v2", snake.muted);
    mb.textContent = snake.muted ? "音效：关" : "音效：开";
  });
  if($("#snakeMuteBtn")) $("#snakeMuteBtn").textContent = snake.muted ? "音效：关" : "音效：开";
}
function isArcadeOpen(){
  var sec = $("#arcade");
  if(!sec) return false;
  if($("#modalMask") && !$("#modalMask").hidden) return false;
  var r = sec.getBoundingClientRect();
  return r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.15;
}
