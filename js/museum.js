/* =========================================================
 * McPixel · 麦麦星际收藏馆
 * 徽章图鉴（分类 / 状态 / 详情）/ 蛇皮肤 / 结局图鉴 / 个人纪念卡
 * ========================================================= */
var museumTab = "badges";
var badgeFilter = "all";

/* 徽章视觉状态：unlocked | open | limited | gone | hidden */
function badgeVisualStatus(b){
  if(state.badges[b.id]) return "unlocked";
  if(b.hidden) return "hidden";
  if(b.window) return inWindow(b.window) ? "limited" : "gone";
  return "open";
}
function daysLeftInWindow(w){
  var t = todayMMDD();
  if(!w || t > w[1]) return 0;
  /* 粗略按同年计算剩余天数 */
  var y = new Date().getFullYear();
  var end = new Date(y + "-" + w[1] + "T23:59:59");
  var now = new Date();
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

function renderMuseumProgress(){
  var host = $("#museumProgress");
  if(!host) return;
  var got = badgeCount(), total = BADGES.length;
  var pct = Math.round(got / total * 100);
  host.innerHTML =
    "<span>本季已收集 " + got + " / " + total + " 枚</span>" +
    '<div class="p-bar"><div class="p-fill" style="width:' + pct + '%"></div></div>' +
    "<span>" + pct + "%</span>";
}

/* ---------- 徽章墙 ---------- */
function renderBadges(){
  var host = $("#badgeGrid");
  if(!host) return;
  var html = "";
  BADGE_CATS.forEach(function(cat){
    var list = BADGES.filter(function(b){ return b.cat === cat.id; });
    if(!list.length) return;
    var shown = list.filter(function(b){
      var st = badgeVisualStatus(b);
      if(badgeFilter === "all") return true;
      if(badgeFilter === "unlocked") return st === "unlocked";
      if(badgeFilter === "locked") return st !== "unlocked";
      if(badgeFilter === "limited") return b.window && !state.badges[b.id];
      if(badgeFilter === "hidden") return b.hidden;
      return true;
    });
    if(!shown.length) return;
    var catGot = list.filter(function(b){ return state.badges[b.id]; }).length;
    html += '<div class="museum-cat" style="grid-column:1/-1">' +
      '<div class="museum-cat-head"><span class="cat-ico">' + artSVG(cat.icon, { size:22 }) + "</span>" +
      "<h3>" + esc(cat.name) + '</h3><span class="cat-line"></span><span class="cat-count">' + catGot + " / " + list.length + "</span></div></div>";
    html += shown.map(function(b){ return badgeCardHTML(b); }).join("");
  });
  host.innerHTML = html || '<div class="poster" style="padding:20px;grid-column:1/-1">该筛选下暂时没有徽章。</div>';
  host.querySelectorAll("[data-badge]").forEach(function(el){
    el.addEventListener("click", function(){ showBadgeDetail(el.getAttribute("data-badge")); });
  });
}
function badgeCardHTML(b){
  var st = badgeVisualStatus(b);
  var locked = st !== "unlocked";
  var isHidden = st === "hidden";
  var name = isHidden ? "？？？" : esc(b.name);
  var stateChip = "";
  if(st === "limited") stateChip = '<span class="b-state limited">限定中 · 剩 ' + daysLeftInWindow(b.window) + "天</span>";
  if(st === "gone") stateChip = '<span class="b-state gone">已绝版</span>';
  if(isHidden) stateChip = '<span class="b-state hidden-s">隐藏</span>';
  var cls = "badge" + (locked ? " locked" : "") + (b.king ? " king" : "") + (st === "limited" ? " window-open" : "");
  return '<div class="' + cls + '" data-badge="' + b.id + '">' +
    (b.king ? '<span class="king-crown">' + artSVG("kingCrown", { size:34 }) + "</span>" : "") +
    (b.king && !locked ? '<span class="king-shine"></span>' : "") +
    '<div class="badge-coin">' + artSVG(b.icon, { size: b.king ? 64 : 46 }) + "</div>" +
    "<b>" + name + "</b>" +
    '<div class="badge-desc">' + esc(isHidden ? "尚未发现的秘密成就" : b.desc) + "</div>" +
    '<div class="badge-rarity">' + b.rarity + "</div>" +
    (state.badges[b.id] ? '<div class="badge-date">' + esc(state.badges[b.id].date) + " 解锁</div>" : "") +
    (st === "gone" ? '<div class="b-countdown">' + esc(b.window[0] + " ~ " + b.window[1]) + "</div>" : "") +
    stateChip + "</div>";
}
function showBadgeDetail(id){
  var b = BADGE_BY_ID[id];
  if(!b) return;
  var st = badgeVisualStatus(b);
  var isHidden = st === "hidden";
  var u = state.badges[id];
  showModal(
    '<div class="badge-detail">' +
      '<div class="bd-coin">' + artSVG(b.icon, { size:78 }) + "</div>" +
      '<div class="bd-info">' +
        "<h3>" + (isHidden ? "？？？" : esc(b.name)) + "</h3>" +
        '<div class="bd-rarity">稀有度 ' + b.rarity + (b.window ? " · 节日限定" : "") + "</div>" +
        '<div class="bd-cond">' + (isHidden ? "获取条件：???（解锁后揭示）" : "获取条件：" + esc(b.cond)) + "</div>" +
        (u ? '<div class="bd-date">' + esc(u.date) + " 解锁</div>" :
            (st === "gone" ? '<div class="bd-date" style="color:var(--caramel)">本期活动已结束（' + esc(b.window[0] + " ~ " + b.window[1]) + "）</div>" :
             st === "limited" ? '<div class="bd-date" style="color:var(--honey)">活动进行中 · 剩 ' + daysLeftInWindow(b.window) + " 天</div>" :
             '<div class="bd-date" style="color:var(--caramel)">未解锁</div>')) +
        '<p class="bd-flavor">' + esc(isHidden ? "传说它在某个不经意的瞬间会自己出现……" : b.flavor) + "</p>" +
      "</div></div>" +
    '<button class="btn btn-block" data-close="1" style="margin-top:16px">知道了</button>'
  );
  if(u && u.fresh){ delete u.fresh; save(); }
}

/* ---------- 蛇皮肤画廊 ---------- */
function renderSkinGallery(){
  var host = $("#skinGallery");
  if(!host) return;
  host.innerHTML = SNAKE_SKINS.map(function(s){
    var has = state.skins[s.id] || s.id === "classic";
    var eq = state.equippedSkin === s.id;
    return '<div class="skin-card' + (has ? "" : " locked") + '">' +
      (eq ? '<span class="sc-equipped">使用中</span>' : "") +
      '<div class="sc-preview">' + artSVGRows(s.head, s.pal, 44) + "</div>" +
      "<b>" + esc(s.name) + "</b><small>" + esc(has ? s.desc : "解锁条件：" + s.cond) + "</small>" +
      (has
        ? '<button class="btn ' + (eq ? "btn-ghost" : "") + ' btn-sm" data-equip="' + s.id + '"' + (eq ? " disabled" : "") + ">" + (eq ? "已装备" : "装备") + "</button>"
        : '<button class="btn btn-ghost btn-sm" data-equip="' + s.id + '">未解锁</button>') +
    "</div>";
  }).join("");
  host.querySelectorAll("[data-equip]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = b.getAttribute("data-equip");
      if(!state.skins[id] && id !== "classic"){
        toast("未解锁：" + SKIN_BY_ID[id].cond, "🔒");
        return;
      }
      state.equippedSkin = id;
      save();
      renderSkinGallery();
      renderSkinPicker();
      toast("已装备：" + SKIN_BY_ID[id].name, "🐍");
    });
  });
}

/* ---------- 结局图鉴 ---------- */
function renderEndingGallery(){
  var host = $("#endingGallery");
  if(!host) return;
  var got = Object.keys(state.endings).length;
  host.innerHTML =
    '<div class="museum-progress" style="margin-bottom:14px"><span>结局收集 ' + got + " / " + LIFE_ENDINGS.length + '</span><div class="p-bar"><div class="p-fill" style="width:' + Math.round(got / LIFE_ENDINGS.length * 100) + '%"></div></div><span>' + Math.round(got / LIFE_ENDINGS.length * 100) + "%</span></div>" +
    '<div class="ending-grid">' +
    LIFE_ENDINGS.map(function(e){
      var n = state.endings[e.id];
      return '<div class="ending-card' + (n ? "" : " locked") + '">' +
        '<div class="e-icon">' + artSVG(e.icon, { size:38 }) + "</div>" +
        "<b>" + esc(n ? e.title : "？？？") + "</b>" +
        "<small>" + esc(n ? e.desc : "尚未达成的命运结局，去麦门人生模拟器多活几次。") + "</small>" +
        (n ? '<span class="e-count">×' + n + "</span>" : "") +
      "</div>";
    }).join("") + "</div>";
}

/* ---------- 个人纪念卡 ---------- */
function renderMemorial(){
  var host = $("#memorialPreview");
  if(!host) return;
  var got = badgeCount();
  var topBadges = BADGES.filter(function(b){ return state.badges[b.id]; }).slice(0, 8);
  var diySaved = (store("mcpixel_diysaved_v2") || []).length;
  host.innerHTML =
    '<div class="mp-head"><b>麦麦收藏纪念卡</b><span>' + todayMMDD() + "</span></div>" +
    '<div class="mp-body">' +
      '<div style="display:flex;justify-content:center;align-items:flex-end;gap:4px;margin-bottom:12px">' +
        bunBunnyHTML(got >= 10 ? "happy" : "idle", 78) + mascotHTML(got >= 10 ? "wave" : "idle", 64) + "</div>" +
      '<div class="mp-stats">' +
        '<div class="mp-stat"><b>' + got + "/" + BADGES.length + "</b><span>徽章</span></div>" +
        '<div class="mp-stat"><b>' + Object.keys(state.endings).length + "/" + LIFE_ENDINGS.length + "</b><span>人生结局</span></div>" +
        '<div class="mp-stat"><b>' + state.snakeBest + "</b><span>贪吃蛇最高分</span></div>" +
      "</div>" +
      '<div class="mp-stats" style="grid-template-columns:repeat(3,1fr)">' +
        '<div class="mp-stat"><b>' + Object.keys(state.skins).length + "</b><span>蛇皮肤</span></div>" +
        '<div class="mp-stat"><b>' + diySaved + "</b><span>汉堡收藏</span></div>" +
        '<div class="mp-stat"><b>' + state.bunnyClicks + "</b><span>兔子互动</span></div>" +
      "</div>" +
      '<div class="mp-badges">' +
        (topBadges.length
          ? topBadges.map(function(b){ return artSVG(b.icon, { size:34 }); }).join("")
          : '<span style="font-size:12px;color:var(--caramel)">还没有徽章，去点餐和玩游戏收集吧</span>') +
      "</div>" +
    "</div>" +
    '<div class="mp-foot"><span>McPixel · 麦麦流星兔子乐园</span><span>概念演示存档</span></div>';
}
function memorialSave(){
  downloadCard("memorialPreview", "McPixel-收藏纪念卡");
}

/* ---------- 收藏馆主渲染 ---------- */
function renderMuseum(){
  renderMuseumProgress();
  var tabs = document.querySelectorAll("[data-museum]");
  tabs.forEach(function(t){
    t.classList.toggle("active", t.getAttribute("data-museum") === museumTab);
  });
  $("#museumBadges").hidden = museumTab !== "badges";
  $("#museumSkins").hidden = museumTab !== "skins";
  $("#museumEndings").hidden = museumTab !== "endings";
  $("#museumMemorial").hidden = museumTab !== "memorial";
  if($("#museumMbti")) $("#museumMbti").hidden = museumTab !== "mbti";
  if(museumTab === "badges"){
    var chips = $("#badgeFilters");
    if(chips){
      chips.querySelectorAll("[data-bfilter]").forEach(function(c){
        c.classList.toggle("active", c.getAttribute("data-bfilter") === badgeFilter);
      });
    }
    renderBadges();
  }
  if(museumTab === "skins") renderSkinGallery();
  if(museumTab === "endings") renderEndingGallery();
  if(museumTab === "memorial") renderMemorial();
  if(museumTab === "mbti" && typeof renderMbtiGallery === "function") renderMbtiGallery();
}
/* 16 型麦门人格收藏图鉴（4×4） */
function renderMbtiGallery(){
  var host = $("#mbtiGallery");
  if(!host || typeof MBTI_TYPES === "undefined") return;
  var got = 0;
  host.innerHTML = MBTI_TYPES.map(function(t){
    var has = !!(state.mbtiHistory && state.mbtiHistory[t.id]);
    if(has) got++;
    return '<div class="mb-gcell' + (has ? " got" : "") + '">' +
      (has ? mbtiBunnySVG(t.id, 56, "idle") : '<span class="mb-glock">' + t.id + "</span>") +
      "<b>" + (has ? esc(t.name) : "？？？") + "</b>" +
      "<small>" + (has ? esc(t.food) : "未获得") + "</small></div>";
  }).join("") +
  '<p class="mb-gnote">已收集 <b>' + got + "</b>/16 · 重新测试或通过游戏挑战可获得不同人格卡（本内容为娱乐设定）</p>";
}
