/* =========================================================
 * McPixel · 启动与事件绑定
 * ========================================================= */
function renderAll(){
  renderChrome(); renderCampaigns(); renderDaily(); renderDeals(); renderTabs(); renderMenu();
  renderWorkshop(); renderCart(); renderBadges(); renderMuseumProgress();
  renderDIY(); renderBucket(); renderBunnyBoxes(); renderSauceLab();
  renderLife(); renderSnakeBoard();
  /* V2 新增 */
  if(typeof renderSoundPanel === "function") renderSoundPanel();
  if(typeof renderArcadeProfile === "function") renderArcadeProfile();
  if(typeof renderWorkProfile === "function") renderWorkProfile();
  if(typeof sliceRender === "function") sliceRender();
  if(typeof matchRender === "function") matchRender();
  if(typeof mbtiRender === "function") mbtiRender();
  if(typeof renderLuckChip === "function") renderLuckChip();
  var db = $("#diyBunny");
  if(db) db.innerHTML = mascotHTML("idle", 88);
}

/* =========================================================
 * 游戏厅：tab 切换 + 生命周期 + BGM 管理（同一时刻只有一首音乐）
 * ========================================================= */
var ARCADE_IDS = ["life", "snake", "work", "slice", "match", "mbti"];
function arcadeSwitch(which){
  document.querySelectorAll("[data-arcade]").forEach(function(x){ x.classList.toggle("active", x.getAttribute("data-arcade") === which); });
  ARCADE_IDS.forEach(function(id){
    var el = $("#arcade" + id.charAt(0).toUpperCase() + id.slice(1));
    if(el) el.hidden = (id !== which);
  });
  /* 离开某个游戏时，停掉它的计时器与其背景音乐（防止隐藏计时器 / 多 BGM 同播） */
  if(which !== "slice" && typeof sliceStop === "function") sliceStop();
  if(which !== "match" && typeof matchStop === "function") matchStop();
  if(which !== "work"  && typeof workStop  === "function") workStop();
  if(which !== "mbti"  && typeof mbtiStop  === "function") mbtiStop();
  SFX.stopBgm();
  SFX.play("page");
  if(which === "life"){ SFX.playBgm("life"); if(typeof renderLife === "function") renderLife(); }
  else if(which === "work"){ SFX.playBgm("restaurant"); if(typeof workRender === "function") workRender(); if(typeof renderWorkProfile === "function") renderWorkProfile(); }
  else if(which === "slice"){ if(typeof sliceRender === "function") sliceRender(); }
  else if(which === "match"){ if(typeof matchRender === "function") matchRender(); }
  else if(which === "mbti"){ SFX.playBgm("life"); if(typeof mbtiRender === "function") mbtiRender(); }
  else if(which === "snake"){ SFX.playBgm("arcade"); }
}
/* 重新恢复当前tab对应的 BGM（用于取消静音后） */
function arcadeBgm(){
  var active = document.querySelector("[data-arcade].active");
  var which = active ? active.getAttribute("data-arcade") : "life";
  if(which === "life") SFX.playBgm("life");
  else if(which === "work") SFX.playBgm("restaurant");
  else if(which === "snake") SFX.playBgm("arcade");
  else SFX.stopBgm();
}
/* 模拟金币显示（core.js 的 addCoins / spendCoins 会回调） */
function renderArcadeProfile(){
  var el = $("#coinChip");
  if(el) el.textContent = "🪙 " + state.coins;
}

function bindEvents(){
  document.addEventListener("click", function(e){
    var t = e.target;
    function closest(attr){ return t.closest("[" + attr + "]"); }

    var bunny = t.closest("[data-floatbunny]");
    if(bunny){ bunnyInteract(bunny.parentElement); return; }
    var bunny2 = t.closest("[data-bunny]");
    if(bunny2){ bunnyInteract(bunny2); return; }

    var go = closest("data-go");
    if(go){ var el = $(go.getAttribute("data-go")); if(el) el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" }); return; }

    var close = closest("data-close");
    if(close){ hideModal(); return; }

    var cat = closest("data-cat");
    if(cat){ state.filter = cat.getAttribute("data-cat"); renderTabs(); renderMenu(); return; }

    var add = closest("data-add");
    if(add){ addToBasket(add.getAttribute("data-add"), add.closest(".food-card")); return; }

    var daily = closest("data-daily");
    if(daily){ daily.getAttribute("data-daily").split(",").forEach(function(id){ addToBasket(id, null, true); }); toast("推荐组合已加入餐盘", "★"); return; }

    var mode = closest("data-mode");
    if(mode){
      state.mode = mode.getAttribute("data-mode");
      state.slots = MODES[state.mode].slots.map(function(){ return null; });
      renderWorkshop(); return;
    }
    var fill = closest("data-fill");
    if(fill){ fillSlot(fill.getAttribute("data-fill")); return; }
    var clear = closest("data-clearslot");
    if(clear){ state.slots[+clear.getAttribute("data-clearslot")] = null; renderWorkshop(); return; }
    var slot = closest("data-slot");
    if(slot && !slot.classList.contains("locked")){
      var i = +slot.getAttribute("data-slot");
      if(state.slots[i]){ state.slots[i] = null; renderWorkshop(); }
      return;
    }

    /* DIY 汉堡工坊 */
    var ears = closest("data-bunnyears");
    if(ears){ pokeBunnyEars(ears); return; }
    var bunexpr = closest("data-bunexpr");
    if(bunexpr){ setBunnyExpr(bunexpr.getAttribute("data-bunexpr"), 0); toast("兔兔汉堡：" + (BUNNY_EXPR_LABELS[bunexpr.getAttribute("data-bunexpr")] || "平静"), "🍔"); return; }
    var inginc = closest("data-inginc"); if(inginc){ diyAdjust(inginc.getAttribute("data-inginc"), 1); return; }
    var ingdec = closest("data-ingdec"); if(ingdec){ diyAdjust(ingdec.getAttribute("data-ingdec"), -1); return; }
    var diyload = closest("data-diyload"); if(diyload){ diyLoad(+diyload.getAttribute("data-diyload")); return; }

    /* 脆汁鸡桶 */
    var bsize = closest("data-bsize"); if(bsize){ setBucketSize(bsize.getAttribute("data-bsize")); return; }
    var bpiece = closest("data-bpiece"); if(bpiece){ bucketCyclePart(+bpiece.getAttribute("data-bpiece")); return; }
    var baddon = closest("data-baddon"); if(baddon){ bucketAdjustAddon(baddon.getAttribute("data-baddon"), +baddon.getAttribute("data-d")); return; }
    var bsauce = closest("data-bsauce"); if(bsauce){ bucketToggleSauce(bsauce.getAttribute("data-bsauce")); return; }

    /* 酱料实验室 */
    var fsauce = closest("data-fsauce"); if(fsauce){ friesToggleSauce(fsauce.getAttribute("data-fsauce")); return; }

    /* 收藏馆 */
    var mtab = closest("data-museum");
    if(mtab){ museumTab = mtab.getAttribute("data-museum"); renderMuseum(); return; }
    var bfilter = closest("data-bfilter");
    if(bfilter){ badgeFilter = bfilter.getAttribute("data-bfilter"); renderMuseum(); return; }
    var equip = closest("data-equip");
    if(equip){
      var sid = equip.getAttribute("data-equip");
      if(!state.skins[sid] && sid !== "classic"){ toast("未解锁：" + SKIN_BY_ID[sid].cond, "🔒"); return; }
      state.equippedSkin = sid; save(); renderSkinGallery(); renderSkinPicker();
      toast("已装备：" + SKIN_BY_ID[sid].name, "🐍"); return;
    }

    /* 游戏厅 tab */
    var arcade = closest("data-arcade");
    if(arcade){ arcadeSwitch(arcade.getAttribute("data-arcade")); return; }

    /* 购物车 */
    var inc = closest("data-inc"); if(inc){ changeQty(inc.getAttribute("data-inc"), 1); return; }
    var dec = closest("data-dec"); if(dec){ changeQty(dec.getAttribute("data-dec"), -1); return; }
    var del = closest("data-del"); if(del){ changeQty(del.getAttribute("data-del"), -99); toast("已移除", "－"); return; }
    var note = closest("data-note");
    if(note){
      var inp = $("#noteInput");
      inp.value = inp.value ? inp.value.replace(new RegExp("(^|、|，|,)\\s*" + note.textContent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*(?=、|，|,|$)"), "") + (inp.value ? "、" : "") + note.textContent : note.textContent;
      inp.focus(); return;
    }
    var repeat = closest("data-repeat");
    if(repeat){
      var h = state.history[0]; if(!h) return;
      state.basket = [];
      h.items.forEach(function(it){
        var x = MENU.items.filter(function(m){ return m.name === it.name; })[0];
        if(!x){ for(var cid in state.custom){ if(state.custom[cid].name === it.name){ x = state.custom[cid]; break; } } }
        if(x) state.basket.push({ id:x.id, qty:it.qty });
      });
      save();
      renderCart(); renderMenu();
      toast("已按历史套餐重新装盘", "↻"); return;
    }
    if(t === $("#modalMask")) hideModal();
  });

  $("#searchInput").addEventListener("input", function(){ state.q = this.value.trim(); renderMenu(); });
  $("#sortSel").addEventListener("change", function(){ state.sort = this.value; renderMenu(); });
  $("#wsAdd").addEventListener("click", addCombo);
  $("#checkoutBtn").addEventListener("click", checkout);
  $("#diyAddBtn").addEventListener("click", diyAddToCart);
  $("#diyCardBtn").addEventListener("click", diySaveCard);
  $("#memorialSaveBtn").addEventListener("click", memorialSave);
  $("#clearBtn").addEventListener("click", function(){
    if(!state.basket.length) return;
    state.basket = []; save();
    renderCart(); renderMenu(); toast("餐盘已清空", "－");
  });
  $("#saveNoteBtn").addEventListener("click", function(){
    var v = $("#noteInput").value.trim();
    if(!v){ toast("先写点什么再收藏", "！"); return; }
    if(state.notes.indexOf(v) < 0){ state.notes.unshift(v); state.notes = state.notes.slice(0, 8); save(); }
    renderNoteChips(); toast("备注已收藏", "★");
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") hideModal(); });
}

/* =========================================================
 * 启动
 * ========================================================= */
(function boot(){
  bindEvents();
  /* 隐藏成就：午夜食客 */
  var hr = new Date().getHours();
  if(hr >= 0 && hr < 6) unlockBadge("hidden_midnight", true);
  loadMenu().then(function(){
    state.slots = MODES[state.mode].slots.map(function(){ return null; });
    renderAll();
    snakeInit();
    /* 今日幸运物：每日首进触发（非强制全屏遮挡，可用交互后再展开） */
    if(typeof luckBoot === "function"){ try{ luckBoot(); }catch(e){} }
    /* 欢迎：M兔子打招呼 */
    setTimeout(function(){
      var fm = $("#floatMascot");
      if(fm && !store("mcpixel_greeted_v2")){
        var m = fm.querySelector(".mascot");
        if(m){ bunnySay(m, "欢迎光临麦麦流星兔子乐园！点我开始互动 →"); meteorAt(fm, 3); }
        store("mcpixel_greeted_v2", true);
      }
    }, 1200);
  });
})();
