/* =========================================================
 * McPixel · 8-bit 像素音效系统（SFX）
 * 纯 Web Audio 合成，零外部音频文件 → 保持 file:// 可用
 * - 交互音效 / 场景背景音乐分离音量
 * - 设置持久化到 localStorage
 * - 遵守浏览器自动播放限制：首次用户交互后才 unlock 音频
 * - 同一时刻只允许一首 BGM 播放（切换场景自动淡出旧的）
 * ========================================================= */
var SFX = (function(){
  var ctx = null, master = null, sfxBus = null, bgmBus = null;
  var unlocked = false;

  /* ---------- 设置持久化 ---------- */
  var cfg = {
    muted:   store("mcpixel_sfx_muted") === true,
    sfxVol:  store("mcpixel_sfx_vol"),
    bgmVol:  store("mcpixel_bgm_vol")
  };
  if(typeof cfg.sfxVol !== "number") cfg.sfxVol = 0.7;
  if(typeof cfg.bgmVol !== "number") cfg.bgmVol = 0.45;
  cfg.sfxVol = Math.max(0, Math.min(1, cfg.sfxVol));
  cfg.bgmVol = Math.max(0, Math.min(1, cfg.bgmVol));

  function persist(){
    store("mcpixel_sfx_muted", cfg.muted);
    store("mcpixel_sfx_vol", cfg.sfxVol);
    store("mcpixel_bgm_vol", cfg.bgmVol);
  }

  /* ---------- 音频上下文（懒加载 + 自动播放解锁） ---------- */
  function midi2f(m){ return 440 * Math.pow(2, (m - 69) / 12); }

  function ensure(){
    if(ctx) return ctx;
    try{
      var AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      /* 简易限幅，避免多音叠加爆音 */
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.2;
      sfxBus = ctx.createGain(); sfxBus.gain.value = cfg.sfxVol;
      bgmBus = ctx.createGain(); bgmBus.gain.value = cfg.bgmVol;
      sfxBus.connect(comp); bgmBus.connect(comp);
      comp.connect(master); master.connect(ctx.destination);
    }catch(e){ ctx = null; }
    return ctx;
  }
  /* 必须在用户手势回调里调用一次 */
  function unlock(){
    if(unlocked) return;
    var c = ensure();
    if(!c) return;
    if(c.state === "suspended" && c.resume) c.resume();
    unlocked = true;
  }
  function ok(){
    if(cfg.muted) return false;
    ensure();
    if(!ctx) return false;
    if(ctx.state === "suspended" && unlocked === false) return false; /* 未经用户交互不发声 */
    return true;
  }

  /* ---------- 基础发声原语 ---------- */
  function tone(opt){
    if(!ok()) return;
    try{
      var t0 = ctx.currentTime + (opt.delay || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = opt.type || "square";
      o.frequency.setValueAtTime(opt.f0, t0);
      if(opt.f1 && opt.f1 !== opt.f0){
        if(opt.slide === "exp") o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f1), t0 + opt.dur);
        else o.frequency.linearRampToValueAtTime(opt.f1, t0 + opt.dur);
      }
      var v = (opt.vol === undefined ? 0.22 : opt.vol);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + opt.dur);
      o.connect(g); g.connect(opt.bus || sfxBus);
      o.start(t0); o.stop(t0 + opt.dur + 0.02);
    }catch(e){}
  }
  /* 噪声：纸盒摩擦 / 切割 / 碎屑 */
  function noise(opt){
    if(!ok()) return;
    try{
      var dur = opt.dur || 0.18;
      var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = buf.getChannelData(0);
      for(var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var flt = ctx.createBiquadFilter();
      flt.type = opt.filter || "highpass";
      flt.frequency.value = opt.freq || 1200;
      if(opt.q) flt.Q.value = opt.q;
      var g = ctx.createGain();
      var v = (opt.vol === undefined ? 0.16 : opt.vol);
      g.gain.setValueAtTime(v, ctx.currentTime + (opt.delay || 0));
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (opt.delay || 0) + dur);
      src.connect(flt); flt.connect(g); g.connect(opt.bus || sfxBus);
      src.start(ctx.currentTime + (opt.delay || 0));
    }catch(e){}
  }
  function arp(midis, step, dur, type, vol){
    for(var i = 0; i < midis.length; i++){
      tone({ type:type || "square", f0:midi2f(midis[i]), dur:dur || 0.12, vol:vol || 0.18, delay:i * (step || 0.07) });
    }
  }
  function chord(midis, dur, type, vol){
    for(var i = 0; i < midis.length; i++){
      tone({ type:type || "triangle", f0:midi2f(midis[i]), dur:dur || 0.5, vol:(vol || 0.13), delay:i * 0.02 });
    }
  }

  /* =========================================================
   * 命名音效库
   * ========================================================= */
  var SFX_LIB = {
    /* 鼠标悬停：轻微像素提示音 */
    hover:      function(){ tone({ type:"square", f0:midi2f(88), dur:0.045, vol:0.055 }); },
    /* 点击按钮：清脆 8-bit 按键音 */
    click:      function(){ tone({ type:"square", f0:midi2f(84), f1:midi2f(79), dur:0.085, vol:0.16 }); },
    /* 切换页面 / 场景 */
    page:       function(){ arp([76, 81, 88], 0.05, 0.09, "square", 0.12); },
    /* 添加肉饼：Q 弹堆叠 */
    stack:      function(){
                  tone({ type:"triangle", f0:midi2f(52), f1:midi2f(64), dur:0.14, vol:0.2, slide:"exp" });
                  noise({ dur:0.07, freq:800, vol:0.07 });
                },
    /* 加入购物车：金币掉落 / 拾取 */
    cart:       function(){
                  tone({ type:"square", f0:midi2f(88), dur:0.07, vol:0.16 });
                  tone({ type:"square", f0:midi2f(93), dur:0.11, vol:0.14, delay:0.06 });
                },
    /* 金币入袋 */
    coin:       function(){
                  tone({ type:"square", f0:midi2f(93), dur:0.06, vol:0.14 });
                  tone({ type:"square", f0:midi2f(97), dur:0.16, vol:0.12, delay:0.05 });
                },
    /* 解锁皮肤：像素升级 */
    upgrade:    function(){ arp([69, 73, 76, 81, 85], 0.075, 0.14, "square", 0.16); },
    /* 获得徽章：仪式感成就音 */
    achievement:function(){
                  chord([64, 68, 71], 0.5, "triangle", 0.11);
                  arp([76, 80, 83, 88], 0.1, 0.22, "square", 0.15);
                },
    /* 兔子盒开盖：纸盒展开 + 流星 */
    boxOpen:    function(){
                  noise({ dur:0.26, freq:900, filter:"bandpass", q:1.2, vol:0.16 });
                  tone({ type:"triangle", f0:midi2f(60), f1:midi2f(72), dur:0.3, vol:0.15, slide:"exp", delay:0.05 });
                },
    /* 切割：短促刀光 */
    slice:      function(){
                  noise({ dur:0.1, freq:2600, vol:0.15 });
                  tone({ type:"sawtooth", f0:midi2f(92), f1:midi2f(72), dur:0.1, vol:0.1, slide:"exp" });
                },
    /* 连击：音高随 combo 递增 */
    combo:      function(n){
                  var step = Math.min(12, n || 1);
                  tone({ type:"square", f0:midi2f(76 + step), dur:0.1, vol:0.15 });
                  tone({ type:"square", f0:midi2f(83 + step), dur:0.12, vol:0.1, delay:0.05 });
                },
    /* 星星 / 流星奖励 */
    star:       function(){ arp([84, 88, 91, 96], 0.06, 0.14, "triangle", 0.13); },
    /* 顾客点单铃 */
    bell:       function(){
                  tone({ type:"sine", f0:midi2f(96), dur:0.35, vol:0.14 });
                  tone({ type:"sine", f0:midi2f(91), dur:0.4, vol:0.1, delay:0.04 });
                },
    /* 进度条完成（煎肉饼 / 炸薯条） */
    ready:      function(){ arp([72, 76, 79], 0.06, 0.1, "square", 0.13); },
    /* 顾客不耐烦 */
    impatient:  function(){ tone({ type:"square", f0:midi2f(62), f1:midi2f(57), dur:0.22, vol:0.12 }); },
    /* 交付成功 */
    deliver:    function(){ arp([72, 76, 79, 84], 0.07, 0.13, "square", 0.15); },
    /* 失败 / 扣分 */
    fail:       function(){
                  tone({ type:"sawtooth", f0:midi2f(60), f1:midi2f(48), dur:0.3, vol:0.14, slide:"exp" });
                },
    /* 游戏开始 */
    start:      function(){ arp([67, 72, 76, 79, 84], 0.07, 0.13, "square", 0.15); },
    /* 游戏结束 */
    gameover:   function(){
                  chord([60, 63, 67], 0.7, "triangle", 0.1);
                  arp([67, 63, 60, 55], 0.13, 0.22, "square", 0.13);
                },
    /* 贪吃蛇吃到食物 */
    eat:        function(){ tone({ type:"square", f0:midi2f(81), dur:0.07, vol:0.15 }); },
    /* 扭蛋 / 抽奖 */
    gacha:      function(){
                  noise({ dur:0.2, freq:1500, vol:0.1 });
                  arp([72, 79, 84, 91], 0.09, 0.16, "square", 0.15);
                }
  };

  /* =========================================================
   * 背景音乐（程序化 chiptune，按场景切换）
   * ========================================================= */
  var BGM_LIB = {
    /* 餐厅经营：轻快复古街机 */
    restaurant:{ bpm:132, wave:"square",   gate:0.55, vol:0.16, bass:true,
      notes:[72,76,79,76, 74,77,81,77, 72,76,79,83, 81,79,76,74] },
    /* 人生模拟：柔和电子 */
    life:      { bpm:92,  wave:"triangle", gate:0.9,  vol:0.18, bass:true,
      notes:[67,71,74,71, 69,72,76,72, 65,69,72,76, 74,71,67,64] },
    /* 切切乐：节奏强烈 8-bit */
    slice:     { bpm:152, wave:"square",   gate:0.45, vol:0.15, bass:true,
      notes:[76,76,79,76, 81,81,79,76, 74,74,77,74, 81,79,76,72] },
    /* 游戏厅默认 */
    arcade:    { bpm:120, wave:"square",   gate:0.6,  vol:0.15, bass:true,
      notes:[60,67,72,67, 62,69,74,69, 64,71,76,71, 67,74,79,74] }
  };

  var bgm = { id:null, timer:0, nextTime:0, step:0, pat:null };

  function bgmNote(f, dur, wave, vol, when, bus){
    if(!ctx) return;
    try{
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave; o.frequency.setValueAtTime(f, when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(bus || bgmBus);
      o.start(when); o.stop(when + dur + 0.02);
    }catch(e){}
  }
  function bgmSchedule(){
    if(!ctx || !bgm.pat) return;
    var p = bgm.pat;
    var beat = 60 / p.bpm;
    var guard = 0;
    while(bgm.nextTime < ctx.currentTime + 0.25 && guard++ < 64){
      var i = bgm.step % p.notes.length;
      var m = p.notes[i];
      if(m) bgmNote(midi2f(m), beat * p.gate, p.wave, p.vol, bgm.nextTime);
      /* 低音：每 4 拍一次根音 */
      if(p.bass && i % 4 === 0) bgmNote(midi2f(m ? m - 24 : 48), beat * 1.6, "triangle", p.vol * 0.75, bgm.nextTime);
      bgm.nextTime += beat;
      bgm.step++;
    }
  }
  function playBgm(id){
    stopBgm();
    if(!BGM_LIB[id]) return;
    ensure();
    if(!ctx) return;
    bgm.id = id; bgm.pat = BGM_LIB[id]; bgm.step = 0;
    bgm.nextTime = ctx.currentTime + 0.06;
    bgmSchedule();
    bgm.timer = setInterval(bgmSchedule, 90);
  }
  function stopBgm(){
    if(bgm.timer){ clearInterval(bgm.timer); bgm.timer = 0; }
    bgm.id = null; bgm.pat = null; bgm.step = 0;
  }

  /* ---------- 对外 API ---------- */
  function play(name, arg){
    if(cfg.muted) return;
    var fn = SFX_LIB[name];
    if(!fn) return;
    /* 未经用户交互则静默丢弃，不产生 AudioContext */
    if(!unlocked) return;
    fn(arg);
  }
  function setSfxVol(v){
    cfg.sfxVol = Math.max(0, Math.min(1, v));
    if(sfxBus) sfxBus.gain.value = cfg.sfxVol;
    persist();
  }
  function setBgmVol(v){
    cfg.bgmVol = Math.max(0, Math.min(1, v));
    if(bgmBus) bgmBus.gain.value = cfg.bgmVol;
    persist();
  }
  function setMuted(m){
    cfg.muted = !!m;
    persist();
    if(cfg.muted) stopBgm();
    if(master && ctx){
      try{
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(cfg.muted ? 0.0001 : 0.9, ctx.currentTime + 0.08);
      }catch(e){}
    }
  }
  function toggleMuted(){ setMuted(!cfg.muted); return cfg.muted; }

  return {
    unlock:unlock, play:play, playBgm:playBgm, stopBgm:stopBgm,
    setSfxVol:setSfxVol, setBgmVol:setBgmVol, setMuted:setMuted, toggleMuted:toggleMuted,
    get muted(){ return cfg.muted; },
    get sfxVol(){ return cfg.sfxVol; },
    get bgmVol(){ return cfg.bgmVol; },
    get bgmId(){ return bgm.id; },
    get unlocked(){ return unlocked; }
  };
})();

/* ---------- 全局：首次用户交互解锁音频 ---------- */
(function(){
  var done = false;
  function once(){
    if(done) return;
    done = true;
    SFX.unlock();
    window.removeEventListener("pointerdown", once);
    window.removeEventListener("keydown", once);
    window.removeEventListener("touchstart", once);
  }
  window.addEventListener("pointerdown", once);
  window.addEventListener("keydown", once);
  window.addEventListener("touchstart", once);
})();

/* =========================================================
 * 音效 UI：全局声音开关 + 独立音量（渲染到导航栏声控区）
 * ========================================================= */
function renderSoundPanel(){
  var host = $("#soundPanel");
  if(!host) return;
  host.innerHTML =
    '<button class="snd-toggle' + (SFX.muted ? " off" : "") + '" id="sndToggle" title="声音总开关">' +
      (SFX.muted ? "🔇" : "🔊") + '<span>' + (SFX.muted ? "静音" : "有声") + "</span></button>" +
    '<div class="snd-sliders">' +
      '<label><span>音效</span><input type="range" id="sndSfx" min="0" max="100" value="' + Math.round(SFX.sfxVol * 100) + '"></label>' +
      '<label><span>音乐</span><input type="range" id="sndBgm" min="0" max="100" value="' + Math.round(SFX.bgmVol * 100) + '"></label>' +
    "</div>";
  var tg = $("#sndToggle");
  if(tg) tg.addEventListener("click", function(){
    SFX.unlock();
    SFX.toggleMuted();
    if(!SFX.muted && typeof arcadeBgm == "function") arcadeBgm();
    renderSoundPanel();
  });
  var s = $("#sndSfx");
  if(s) s.addEventListener("input", function(){ SFX.unlock(); SFX.setSfxVol(s.value / 100); });
  var b = $("#sndBgm");
  if(b) b.addEventListener("input", function(){ SFX.unlock(); SFX.setBgmVol(b.value / 100); });
}

/* 所有 .btn / button 的统一 hover / click 音效委派
 * 约定：按钮带 data-nosfx 时不播放通用按键音（由它的专属动作音负责，避免叠加双响） */
(function(){
  var lastHover = 0;
  function isBtn(el){
    if(!el || !el.tagName) return false;
    if(el.tagName === "BUTTON" || el.tagName === "A") return true;
    if(el.classList && (el.classList.contains("btn") || el.classList.contains("ing-btn"))) return true;
    return false;
  }
  function noSfx(el){
    return !!(el && el.hasAttribute && el.hasAttribute("data-nosfx"));
  }
  document.addEventListener("mouseover", function(e){
    if(!isBtn(e.target)) return;
    var t = Date.now();
    if(t - lastHover < 90) return;   /* 节流，避免快速划过连发 */
    lastHover = t;
    SFX.play("hover");
  });
  document.addEventListener("click", function(e){
    if(!isBtn(e.target) || noSfx(e.target)) return;
    SFX.play("click");
  }, true);
})();
