/* =========================================================
 * McPixel · 像素美术库（原创 SVG 像素画）
 * 新增：汉堡分层食材 / 脆汁鸡桶 / 酱料杯 / 宝箱金币 / 节日徽章 / 游戏图标
 * ========================================================= */
var ART = {
  /* ---------- 基础（v2） ---------- */
  logo:   { p:{r:"#D8262C",b:"#E8A85C",l:"#8BC34A",c:"#FFC72C",p:"#8B5A2B",t:"#E8A85C"}, rows:[
    "..rrrrrrrrrr..",".rrrrrrrrrrrr.","rrrrrrrrrrrrrr","rrr..bbbb..rrr","rrr.bbbbbb.rrr",
    "rrrbbbbbbbbbrr","rrrllllllllrrr","rrrccccccccrrr","rrrpppppppprrr","rrrttttttttrrr",
    "rrrrrrrrrrrrrr",".rrrrrrrrrrrr.","..rrrrrrrrrr.."] },
  /* 兔兔汉堡商品版：面包顶长出两只小兔耳（无脸、无 Logo，可爱感来自造型） */
  burger: { p:{b:"#E8A85C",s:"#FFF3D0",l:"#8BC34A",c:"#FFC72C",p:"#8B5A2B",t:"#E8A85C",e:"#FBD9B4"}, rows:[
    "...bb....bb.....","..beeb..beeb....","..bbbbbbbbbbbb..",".bbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbb",
    ".bbsbbbbbbbsbbb.","..llllllllllll..",".llllllllllllll.","cccccccccccccccc","ccccc.ccccc.cccc",
    "..pppppppppppp..",".pppppppppppppp.","pppppppppppppppp","..tttttttttttt..","...tttttttttt..."] },
  burger2:{ p:{b:"#E8A85C",s:"#FFF3D0",l:"#8BC34A",c:"#FFC72C",p:"#8B5A2B",t:"#E8A85C",e:"#FBD9B4"}, rows:[
    "...bb....bb.....","..beeb..beeb....","..bbbbbbbbbbbb..",".bbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbb",
    ".bbsbbbbbbbsbbb.","..llllllllllll..",".llllllllllllll.","cccccccccccccccc","ccccc.ccccc.cccc",
    "..pppppppppppp..",".pppppppppppppp.","pppppppppppppppp","cccccccccccccccc","ccccc.ccccc.cccc",
    "..pppppppppppp..",".pppppppppppppp.","..tttttttttttt..","...tttttttttt..."] },
  fries:  { p:{y:"#FFD54F",Y:"#F0B429",r:"#D8262C",R:"#A4121F",w:"#FFF6E0"}, rows:[
    "....y..y..y.....","...yy..yy..yy...","..yYy..yYy..yY..","..yYyy.yYyy.Yy..",".yYyyyyYyyyYyy..",
    ".rrrryyyyyyrrr..",".rrrryyyyyyrrr..",".rrrryyyyyyrrr..",".rrrrryyyrrrrr..",".rrrrwwwwrrrr...",
    ".rrrrwyywrrrr...",".rrrrwyywrrrr...",".rrrrwwwwrrrr...",".rrrrrrrrrrrr...","..rrrrrrrrrrr...",
    "...RRRRRRRRR...."] },
  drumstick:{ p:{g:"#E8A85C",G:"#C77F1F",b:"#F5DCC0",w:"#FFF6E0"}, rows:[
    "................",".....gggg.......","...gggggggg.....","..gggggggggg....","..ggwgggggggg...",
    ".ggggggggggg....",".gggggggggggG...",".ggggggggggg....","..ggggggggg.....","...gggggggg.....",
    "....gggggg......",".....gggg.......","......bbb.......",".....bb.bb......","....bb...bb.....",
    "...bb.....bb...."] },
  nuggets:{ p:{g:"#E8A85C",G:"#C77F1F",r:"#D8262C",R:"#A4121F",w:"#FFF6E0",y:"#FFC72C"}, rows:[
    "...g..g..g......","..ggg.ggg.gg....","..gGgggGgggGg...","..gggggggggg....",".rrrrrrrrrrrr...",
    ".rrrrrrrrrrrr...",".rrwwwwwwwwrr...",".rrwyyyyyywrr...",".rrwwwwwwwwrr...",".rrrrrrrrrrrr...",
    ".rrrrrrrrrrrr...",".rrrrrrrrrrrr...","..rrrrrrrrrr....","...RRRRRRRR....."] },
  cup:    { p:{r:"#D8262C",R:"#A4121F",w:"#FFF6E0",y:"#FFC72C",s:"#FFC72C"}, rows:[
    "..........s.....",".........s......","........s.......",".....ssss.......","...rrrrrrrr.....",
    "..rrrrrrrrrr....","..rrrrrrrrrr....","..rrwwwwwwrr....","..rrwyyyywrr....","..rrwyyyywrr....",
    "..rrwwwwwwrr....","..rrrrrrrrrr....","..rrrrrrrrrr....","..rrrrrrrrrr....","...rrrrrrrr.....",
    "....RRRRRR......"] },
  swirl:  { p:{w:"#FFF6E0",c:"#F5DCC0",r:"#D8262C",R:"#A4121F"}, rows:[
    "......ww........",".....wccw.......","....wccccw......","....wccccw......","...wccccccw.....",
    "...wccccccw.....","..wwwwwwwwww....","..rrrrrrrrrr....","..rrwwwwwwrr....","..rrwrrrrwrr....",
    "..rrwrrrrwrr....","..rrwwwwwwrr....","..rrrrrrrrrr....","..rrrrrrrrrr....","...rrrrrrrr.....",
    "....RRRRRR......"] },
  pie:    { p:{y:"#F5C663",d:"#B57A28",w:"#FFF8E8"}, rows:[
    ".....dddd.......","....dyyyyd......","...dyyyyyyd.....","..dyyywyyyyd....","..dyyywyyyyd....",
    "..dyyyyyyyyd....","...dyyyyyyd.....","....dyyyyd......",".....dddd......."] },
  rings:  { p:{g:"#E8A85C"}, rows:[
    ".....ggg.....","....gg.gg....","...g.....g...","..g..ggg..g..","..g.ggggg.g..",".g.ggggggg.g.",
    ".g.ggggggg.g.",".g.ggggggg.g.","..g.ggggg.g..","..g..ggg..g..","...g.....g...","....gg.gg....",".....ggg....."] },
  chicken:{ p:{r:"#D8262C",w:"#FFFFFF",W:"#EBDCC3",k:"#2A1B14",y:"#FFC72C"}, rows:[
    "................","...rr....rr.....","..rrrr..rrrr....","..rrrr..rrrr....",".wwwwwwwwwwww...",
    ".wwwwwwwwwwwww..","wwwwwwwwwwwwwww.","wwwwkwwwwwkwwww.","wwwwkwwwwwkwwww.","wwwwwwyyywwwwww.",
    "wwwwwwyyywwwwwww","wwwwwwwwwwwwwwww","wWwwwwwwwwwwwWw.","wWWwwwwwwwwwWWw.",".wWwwwwwwwwwWw..",
    "..yy....yy......"] },
  star:   { p:{y:"#FFC72C"}, rows:[
    ".......yy.......",".......yy.......","......yyyy......","..yyyyyyyyyyyy..","...yyyyyyyyyy...",
    "....yyyyyyyy....",".....yyyyyy.....","....yyyyyyyy....","....yyyy..yy....","...yyy....yyy...",
    "..yyy......yyy..",".yy..........yy."] },
  medal:  { p:{r:"#D8262C",y:"#FFC72C",w:"#FFF6E0"}, rows:[
    "..rr......rr....",".rrrr....rrrr...",".rrrr....rrrr...","..rr......rr....","...yyyyyyyy.....",
    "..yyyyyyyyyy....",".yyywwyywwyyy...",".yywwyyyywwyy...",".yywwyyyywwyy...",".yyywwyywwyyy...",
    "..yyyyyyyyyy....","...yyyyyyyy....."] },
  trophy: { p:{y:"#FFC72C",w:"#FFF6E0"}, rows:[
    ".yyyyyyyyyyyyyy.",".yyyyyyyyyyyyyy.",".yywwwwwwwwwwyy.",".yywwwwwwwwwwyy.",".yyyyyyyyyyyyyy.",
    "..yyyyyyyyyyyy..","...yyyyyyyyyy...","....yyyyyyyy....",".....yyyyyy.....","......yyyy......",
    "......yyyy......","....yyyyyyyy....","....yyyyyyyy...."] },
  ghost:  { p:{w:"#FFFFFF",k:"#2A1B14"}, rows:[
    "................",".....wwwww......","....wwwwwww.....","...wwwwwwwww....","...wwkwwwkwww...",
    "...wwwwwwwww....","...wwwwwwwww....","...wwwwwwwww....","...wwwwwwwww....","...wwwwwwwww....",
    "...wwwwwwwww....","...w.wwwww.w....","..w...www...w..."] },
  lantern:{ p:{r:"#D8262C",y:"#FFC72C"}, rows:[
    ".....yyyy.......","....yyyyyy......","...rrrrrrrr.....","..rrrrrrrrrr....","..rrryyyyrrr....",
    "..rrryyyyrrr....","..rrrrrrrrrr....","..rrryyyyrrr....","..rrrrrrrrrr....","...rrrrrrrr.....",
    "....yyyyyy......",".....yyyy......."] },
  flame:  { p:{r:"#D8262C",y:"#FFC72C"}, rows:[
    "......rr........",".....rrr........","....rrryy.......","....rryyy.......","...rryyyyy......",
    "...rryyyyy......","..rrryyyyy......","..rrrryyyy......","..rrryyyyy......","..rrryyyyy......",
    "...rrryyy.......","...rrrryy.......","....rrr........."] },
  heart:  { p:{r:"#D8262C"}, rows:[
    "................","..rr....rr......",".rrrr..rrrr.....","rrrrrrrrrrrr....","rrrrrrrrrrrr....",
    "rrrrrrrrrrrr....",".rrrrrrrrrr.....","..rrrrrrrr......","...rrrrrr.......","....rrrr........",
    ".....rr........."] },
  leaf:   { p:{g:"#7CB342"}, rows:[
    ".........gg.....",".......gggg.....",".....gggggg.....","...gggggggg.....","..gggggggggg....",
    ".gggggggggg.....","ggggggggg.......","gggggg..........",".gggg...........","..gg............"] },

  /* ---------- 汉堡分层食材（DIY 工坊） ---------- */
  bunTop:  { p:{b:"#E8A85C",w:"#FFF3D0"}, rows:[
    "....bbbbbb....","...bbbbbbbb...","..bbwwbbwwbb..",".bbbbbbbbbbbb.","bbbbbbbbbbbbbb",".bbbbbbbbbbbb."] },
  bunBottom:{ p:{b:"#E8A85C"}, rows:[
    "bbbbbbbbbbbbbb",".bbbbbbbbbbbb.","..bbbbbbbbbb..","...bbbbbbbb...","....bbbbbb...."] },
  patty:   { p:{p:"#8B5A2B",P:"#6B4423"}, rows:[
    "pppppppppppppp","pPpPppPppPpppp","pppppppppppppp","pPppppPpppPppp","pppppppppppppp"] },
  pattyChicken:{ p:{g:"#E8A85C",G:"#C77F1F"}, rows:[
    "gggggggggggggg","gGgGggGggGgggg","gggggggggggggg","gGgggGgggGgggg","gggggggggggggg"] },
  cheese:  { p:{c:"#FFC72C"}, rows:[
    "cccccccccccccc","cccccccccccccc",".cccccccccc...","..cccccccc....","...cccccc.....","....cccc......"] },
  lettuce: { p:{l:"#8BC34A",L:"#7CB342"}, rows:[
    "..l....l...l..",".lll..lll.lll.","llllllllllllll","lLLlLLlLLlLLlL"] },
  pickle:  { p:{p:"#7CB342",w:"#C5E1A5"}, rows:[
    "................",".....pppppp.....","...pppppppppp...","..pppwwppwwppp..","..pppwwppwwppp..",
    "...pppppppppp...",".....pppppp....."] },
  onion:   { p:{o:"#B39DDB",w:"#EDE7F6"}, rows:[
    "................",".....oooooo.....","...oooooooooo...","..ooowwwwwwooo..","..ooowwwwwwooo..",
    "...oooooooooo...",".....oooooo....."] },
  bacon:   { p:{m:"#D95B5B",w:"#FFE0C2"}, rows:[
    "mmmmmmmmmmmmmmm","mwwmmmwwmmmwwww","mmwwmmmwwmmmwww","wwmmmwwmmmwwmmm","mmmwwmmmwwmmmww"] },
  sauceDrip:{ p:{s:"#D8262C"}, rows:[
    "sssssssssssssss","s.ssssssss.sss.","..ssssssss.ss..","...ssssssss....",".....ssss......"] },
  tomato:  { p:{t:"#E05A4A",T:"#C4433A",s:"#F5A79B"}, rows:[
    "................","..tttttttttttt..",".ttssttttttsstt.","..tttttttttttt..","...TTTTTTTTTT..."] },
  egg:     { p:{w:"#FFFDF4",y:"#FFC72C",W:"#F3E4C8"}, rows:[
    "................","...wwwwwwwwww...",".wwwwyyyywwwwww.","..wwwwwwwwwwww..","....WWWWWWWW...."] },
  /* 兔兔汉堡方形图标（徽章 / 图鉴 / 收藏用，无 Logo） */
  bunBurgerIcon:{ p:{b:"#F0B95B",e:"#FBD9B4",s:"#FFF3D0",k:"#5F4531",p:"#F6CED8",n:"#B5762F",
                     c:"#FFC72C",l:"#8BC34A",P:"#8B5A2B",t:"#E05A4A"}, rows:[
    "..bb........bb..","..beeb....beeb..","..bbbbbbbbbbbb..",".bbbbbbbbbbbbbb.",
    "bbbbbbbbbbbbbbbb",".bbbsbbbbbbsbbb.","bbkkbbbbbbbbkkbb","bbkkbbbbbbbbkkbb",
    "bbppbbbbbbbbppbb","bbbbbbbnnbbbbbbb","bbbbbbbbbbbbbbbb","..cccccccccccc..",
    "llllllllllllllll","PPPPPPPPPPPPPPPP","..tttttttttttt..","..bbbbbbbbbbbb.."] },

  /* ---------- 脆汁鸡桶 ---------- */
  bucket:  { p:{R:"#D8262C",w:"#FFF6E0",g:"#8a6f5c"}, rows:[
    "......gg........",".....g..g.......","....g....g......","...RRRRRRRRRR...","..RwRRRRRRRRwR..",
    "..RwRRRRRRRRwR..","..RwRRRRRRRRwR..","..RwRRRRRRRRwR..","..RwRRRRRRRRwR..","..RwRRRRRRRRwR..",
    "...RRRRRRRRRR...","....RRRRRRRR...."] },
  leg:     { p:{g:"#E8A85C",G:"#C77F1F",w:"#FFF6E0",b:"#F5DCC0"}, rows:[
    "....gggg....","..gggggggg..",".gggwgggggg.",".gggggggggg.","ggggggggggg.",".gggggggggG.",
    "..ggggggg...","...ggggg....","....ggg.....",".....b......","....b.b.....","...b...b...."] },
  wing:     { p:{g:"#E8A85C",G:"#C77F1F",w:"#FFF6E0"}, rows:[
    "............","...gggggg...","..gggggggg..",".ggwggggggg.",".gggggggggg.","gggggggggggg",
    "gggggggggggg",".gggggggggg.","..gggggggg..","...gggggg...","....gggg....",".....gg....."] },
  breast:   { p:{g:"#E8A85C",G:"#C77F1F",w:"#FFF6E0"}, rows:[
    "............","...gggggg...","..gggggggg..",".gggwgggggg.","gggggggggggg","ggwggggggwgg",
    "gggggggggggg",".gggggggggg.",".gGgggggggg.","..gggggggg..","...gggggg...","....gggg...."] },
  sauceCup: { p:{r:"#D8262C",R:"#A4121F",w:"#FFF6E0",s:"#D8262C"}, rows:[
    "............","....ssss....","...srrrr s..","...rrrrrrr..","..rrrrrrrr..","..rrwwwwwr..",
    "..rrwssswr..","..rrwwwwwr..","..rrrrrrrr..","..rrrrrrrr..","...rrrrrrr..","....RRRRR..."] },

  /* ---------- 宝箱 / 金币 / 卡背（扭蛋奖励） ---------- */
  chest:    { p:{y:"#B5762F",w:"#8B5A2B",k:"#2A1B14"}, rows:[
    "................","..yyyyyyyyyyyy..",".yyyyyyyyyyyyyy.",".ywwwwwwwwwwwwy.",
    "yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyykwwwwwwwwkyyy","yyyyyyyyyyyyyyyy",
    "yyyyyyyyyyyyyyyy",".yyyyyyyyyyyyyy.","..yyyyyyyyyyyy.."] },
  chestOpen:{ p:{y:"#B5762F",w:"#8B5A2B",k:"#2A1B14",g:"#FFC72C"}, rows:[
    "................","..yyyyyyyyyyyy..",".yyyyyyyyyyyyyy.",".yyyyyyyyyyyyyy.",
    "................","..gggggggggggg..","..ywwwwwwwwwwy..","..ywwwwwwwwwwy..",
    "yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy","yyyyyyyyyyyyyyyy",".yyyyyyyyyyyyyy.",
    "..yyyyyyyyyyyy.."] },
  coin:     { p:{y:"#F0B429",w:"#FFD54F",C:"#B57A28"}, rows:[
    "....yyyy....","..yywwwwyy..",".ywwyyyywwy.","ywwyyCCyywwy","ywyCCyyCCywy",
    "ywyCCyyCCywy","ywwyyCCyywwy",".ywwyyyywwy.","..yywwwwyy..","....yyyy...."] },
  cardBack: { p:{p:"#7B5EA7",w:"#9B7FC0",y:"#FFC72C",r:"#D8262C"}, rows:[
    "pppppppppppppp","pwwwwwwwwwwwwp","pwyywwwwwwyywp","pwyyrwwwwrrywp","pwwwwrwwrwwwwp",
    "pwwwwrwwrwwwwp","pwyyrwwwwrrywp","pwyywwwwwwyywp","pwwwwwwwwwwwwp","pppppppppppppp"] },

  /* ---------- 人生模拟器身份 ---------- */
  crown:    { p:{y:"#FFC72C",r:"#D8262C"}, rows:[
    "y...y....y...y","yy..yy..yy..yy","yyyyyyyyyyyyyy","yyryyyyyyyyryy",
    "yyyyyyyyyyyyyy",".yyyyyyyyyyyy.","..yyyyyyyyyy..","...yyyyyyyy..."] },
  cap:      { p:{b:"#3E7CB1",y:"#FFC72C"}, rows:[
    "............","...bbbbbb...","..bbbbbbbb..",".bbbbbbbbbb.","bbbbbbbbbbbb",".yyyyyyyyyy.","............"] },
  dream:    { p:{w:"#FFF6E0",c:"#F5DCC0",r:"#D8262C",R:"#A4121F"}, rows:[
    "......ww........",".....wccw.......","....wccccw......","....wccccw......","...wccccccw.....",
    "...wccccccw.....","..wwwwwwwwww....","..rrrrrrrrrr....","..rrwwwwwwrr....","..rrwrrrrwrr....",
    "..rrwrrrrwrr....","..rrwwwwwwrr....","..rrrrrrrrrr....","...rrrrrrrr.....","....RRRRRR......"] },
  lastNugget:{ p:{g:"#E8A85C",G:"#C77F1F",r:"#D8262C",R:"#A4121F",w:"#FFF6E0",y:"#FFC72C"}, rows:[
    "...g..g..g......","..ggg.ggg.gg....","..gGgggGgggGg...","..gggggggggg....",".rrrrrrrrrrrr...",
    ".rrrrrrrrrrrr...",".rrwwwwwwwwrr...",".rrwyyyyyywrr...",".rrwwwwwwwwrr...",".rrrrrrrrrrrr...",
    ".rrrrrrrrrrrr...",".rrrrrrrrrrrr...","..rrrrrrrrrr....","...RRRRRRRR....."] },

  /* ---------- 节日徽章 ---------- */
  redPack:  { p:{r:"#D8262C",y:"#FFC72C",k:"#A4121F"}, rows:[
    "............",".rrrrrrrrrr.","rrrrrrrrrrrr","rryyyyyyyyrr","rryyk..kyyrr",
    "rryyyyyyyyrr","rrrrrrrrrrrr","rrrrrrrrrrrr",".rrrrrrrrrr."] },
  lion:     { p:{y:"#FFC72C",k:"#2A1B14",w:"#FFF6E0",p:"#D8262C"}, rows:[
    "...yy....yy...","..yyyy..yyyy..",".yyyyyyyyyyyy.","yykkyyyyyykkyy","yykkyyyyyykkyy",
    "yywyyyyyyyywyy",".yyyyyppyyyyy.","..yyyyppyyyy..","...yyyyyyyy...","....y.ww.y...."] },
  ingot:    { p:{y:"#F0B429",k:"#B57A28"}, rows:[
    "............","....yyyy....","...yyyyyy...","..yyykkyyy..",".yyyyykkyyy.",
    ".yyyyyyyyyy.","..yyyyyyyy..","...yyyyyy...","....yyyy...."] },
  heartFries:{ p:{h:"#D8262C",y:"#FFD54F"}, rows:[
    "............","..hh....hh..",".hhhh..hhhh.","hhhhhhhhhhhh","hhhyyyyyyhhh",
    "hhhyyyyyyhhh",".hhhyyyyhhh.","..hhhyyhhh..","...hhhhhh...","....hhhh....",".....hh....."] },
  berry:    { p:{r:"#E75480",w:"#FFF6E0",g:"#7CB342"}, rows:[
    ".....gg.....","...gggggg...","..rrrrrrrr..",".rrwrrrrwrr.",".rrrrrrrrrr.",
    "rrrrrrrrrrrr",".rrrrrrrrrr.","..rrrrrrrr..","...rrrrrr..."] },
  toy:      { p:{r:"#D8262C",b:"#3E7CB1",y:"#FFC72C",g:"#8BC34A",p:"#F27BA7",o:"#F08A24"}, rows:[
    "............",".rr..bb..yy.",".rr..bb..yy.",".rr..bb..yy.",".rr..bb..yy.",
    "............",".gg..pp..oo.",".gg..pp..oo.",".gg..pp..oo.",".gg..pp..oo."] },
  rainbow:  { p:{r:"#D8262C",o:"#F08A24",y:"#FFC72C",g:"#8BC34A",b:"#3E7CB1",p:"#7B5EA7"}, rows:[
    ".....rrrr.....","...rrrrrrrr...","..oooooooooo..",".yyyyyyyyyyyy.",".gggggggggggg.",
    ".bbbbbbbbbbbb.",".pppppppppppp."] },
  xmasTree: { p:{g:"#388E3C",w:"#FFC72C",y:"#FFC72C",b:"#8B5A2B"}, rows:[
    "......yy........",".....yyyy.......","....gggggg......","...gggwgggg.....","..gggggggggg....",
    ".gggwgggwgggg...",".gggggggggggg...","gggwgggwgggwgggg","gggggggggggggggg","...bbbbbbbb.....",
    "...bbbbbbbb....."] },
  deer:     { p:{d:"#A0662C",k:"#2A1B14",r:"#D8262C"}, rows:[
    "..d......d..","..dd....dd..","..ddd..ddd..","...dddddd...","..dddddddd..",
    ".dddddddddd.",".ddkddddkdd.",".ddrrrrrrdd.","..dddddddd..","...dddddd...","....d..d...."] },
  ginger:   { p:{b:"#B5762F",k:"#2A1B14",w:"#FFF6E0"}, rows:[
    "...bbbbbb...","..bbbbbbbb..","..bkbbbbkb..","..bbbbbbbb..","...bbbbbb...",
    "..bbbbbbbb..",".bbbbbbbbbb.","..bbbbbbbb..","...bbbbbb...","..bb....bb..","..bb....bb.."] },
  jukebox:  { p:{d:"#7B5EA7",w:"#FFF6E0",r:"#D8262C"}, rows:[
    "....dddd....","...dddddd...","..dddddddd..","..dwrrrrwd..","..dwrrrrwd..",
    "..dwrrrrwd..","..dwrrrrwd..","..dwwwwwwd..","..dddddddd..","...d....d..."] },
  mystery:  { p:{w:"#FFF6E0"}, rows:[
    "............","....wwww....","...wwwwww...","..ww....ww..",".......ww...",
    "......ww....","......ww....","............","......ww....","............"] },
  architect:{ p:{y:"#FFC72C",b:"#E8A85C",p:"#8B5A2B",c:"#FFC72C"}, rows:[
    "...yyyyyy...","..yyyyyyyy..",".yyyyyyyyyy.","..bbbbbbbb..",".pppppppppp.",
    "cccccccccccc",".pppppppppp.","cccccccccccc",".pppppppppp.","..bbbbbbbb..","...bbbbbb..."] },
  flask:    { p:{w:"#B7D9F0",s:"#8BC34A"}, rows:[
    "............","....wwww....","....wwww....","...wwwwww...","...wwwwww...",
    "..wwwwwwww..",".wwwwwwwwww.",".wwssssswww.",".wwssssswww.","..wwwwwwww..","...wwwwww..."] },
  snakeIcon:{ p:{y:"#FFC72C",k:"#2A1B14"}, rows:[
    "..yyyy......",".yy..yy.....","yy....yy....","......yy....","......yyyy..",
    ".......yyyy.","..yy....yy..","...yyyyyy..."] },
  godIcon:  { p:{y:"#FFC72C",r:"#D8262C",w:"#FFF6E0"}, rows:[
    ".....yy.....","...yyyyyy...","..yyyyyyyy..","....rrrr....","...rrrrrr...",
    "..rrrrrrrr..",".rrrrrrrrrr.","rrrrwwwwrrrr","rrrrwwwwrrrr",".rrrrrrrrrr.",
    "..rrrrrrrr..","...rrrrrr..."] },
  recycle:  { p:{y:"#FFC72C"}, rows:[
    "..yyy.......",".yy.........","..yyyyyyy...","........yy..","........yy..",
    "...yy...yy..","....yyyyy...","...yy.......","..yyy......."] },
  ghostFries:{ p:{w:"#FFFFFF",k:"#2A1B14",y:"#FFD54F"}, rows:[
    "...y..y..y...","...y..y..y...","..yy..yy..y..","...wwwwww....","..wwwwwwww...",
    "..wkwwwwkw...","..wwwwwwww...","..wwwwwwww...","..wwwwwwww...","..wwwwwwww...",
    ".ww.wwww.ww..","w..w....w..w."] },
  pumpkin:  { p:{g:"#7CB342",o:"#F08A24",w:"#FFE49B",k:"#8B5A2B"}, rows:[
    ".....gg.....","...oooooo...","..oooooooo..",".oowoooowoo.",".oooooooooo.",
    "oooookkooooo",".oooooooooo.","..oooooooo..","...oooooo...","....oooo...."] },
  ticket:   { p:{r:"#D8262C",y:"#FFC72C"}, rows:[
    "............",".rrrrrrrrrr.",".ryyyyyyyyr.",".ryyyyyyyyr.",".rrrrrrrrrr.",
    "..rr....rr..","..rr....rr..",".rrrrrrrrrr."] },
  tower:    { p:{b:"#E8A85C",p:"#8B5A2B",c:"#FFC72C"}, rows:[
    "....bbbb....","..bbbbbbbb..","..cccccccc..","..pppppppp..","..cccccccc..",
    "..pppppppp..","..cccccccc..","..pppppppp..","..bbbbbbbb..","....bbbb...."] },

  /* ---------- M兔子（M Bunny）家族 ---------- */
  bunny:    { p:{g:"#FFC72C",G:"#F4A340",w:"#FFF7E8",k:"#5F4531",p:"#F6CED8",n:"#B5762F"}, rows:[
    "................",
    "..gp......pg....","..gp......pg....","..gpp....ppg....","..gpp....ppg....",
    "..gppp..pppg....","..gppp..pppg....","...ggg..ggg.....",
    "..gggggggggggg..",".gggggggggggggg.",".ggkggggggggkgg.",".gggkggggggkggg.",
    ".ggggggnngggggg.",".ggpggggggggpgg.",".ggggggwwgggggg.",
    "..gggggggggggg..","..gggggggggggg..",".gggGGggggGGggg.",".gggGGggggGGggg.",
    "..gggggggggggg.."] },
  bunnyWave:{ p:{g:"#FFC72C",G:"#F4A340",w:"#FFF7E8",k:"#5F4531",p:"#F6CED8",n:"#B5762F"}, rows:[
    "................",
    "..gp......pg....","..gp......pg....","..gpp....ppg....","..gpp....ppg....",
    "..gppp..pppg....","..gppp..pppg....","...ggg..ggg.....",
    "..gggggggggggggg",".gggggggggggggg.",".ggkggggggggkgg.",".gggkggggggkggg.",
    ".ggggggnngggggg.",".ggpggggggggpgg.",".ggggggwwgggggg.",
    "..gggggggggggg..","..gggggggggggg..",".gggGGggggGGggg.",".gggGGggggGGggg.",
    "..gggggggggggg.."] },
  bunnyJump:{ p:{g:"#FFC72C",G:"#F4A340",w:"#FFF7E8",k:"#5F4531",p:"#F6CED8",n:"#B5762F"}, rows:[
    "................",
    "..g........g....","..gg......gg....","..ggg....ggg....","...ggg..ggg.....",
    "....ggggggg.....",".....ggggg......",
    "..gggggggggggg..",".gggggggggggggg.",".ggkggggggggkgg.",".gggkggggggkggg.",
    ".ggggggnngggggg.",".ggpggggggggpgg.",".ggggggwwgggggg.",
    "..gggggggggggg..","..gggggggggggg..",".gggGGggggGGggg.",".gggGGggggGGggg.",
    "..gggggggggggg.."] },
  bunnySurprise:{ p:{g:"#FFC72C",G:"#F4A340",w:"#FFF7E8",k:"#5F4531",p:"#F6CED8",n:"#B5762F"}, rows:[
    "................",
    "..gp......pg....","..gp......pg....","..gpp....ppg....","..gpp....ppg....",
    "..gppp..pppg....","..gppp..pppg....","...ggg..ggg.....",
    "..gggggggggggg..",".gggggggggggggg.",".ggkkggggggkkgg.",".ggkkggggggkkgg.",
    ".ggggggnngggggg.",".ggpggggggggpgg.",".ggggggkwwkgggg.",
    "..gggggggggggg..","..gggggggggggg..",".gggGGggggGGggg.",".gggGGggggGGggg.",
    "..gggggggggggg.."] },
  bunnySad: { p:{g:"#FFC72C",G:"#F4A340",w:"#FFF7E8",k:"#5F4531",p:"#F6CED8",n:"#B5762F"}, rows:[
    "................",
    ".gg........gg...",".gg........gg...",".ggg......ggg...","..ggg....ggg....",
    "...ggg..ggg.....","....gggggg......",
    "..gggggggggggg..",".gggggggggggggg.",".ggGGGGGGGGGGgg.",".gggkggggggkggg.",
    ".ggggggnngggggg.",".ggpggggggggpgg.",".ggggggwwgggggg.",
    "..gggggggggggg..","..gggggggggggg..",".gggGGggggGGggg.",".gggGGggggGGggg.",
    "..gggggggggggg.."] },

  /* ---------- M兔子盒 ---------- */
  boxFace:  { p:{k:"#5F4531",n:"#B5762F",p:"#F6CED8"}, rows:[
    "................","..k..........k..","..kk........kk..","................",
    ".......nn.......","..p..........p..","................"] },
  comet:    { p:{w:"#FFF7E8",y:"#FFC72C",Y:"#F4A340"}, rows:[
    ".....ww.....","....ww......","...ww.......","..yyy.......",".yYYYy......",
    "..yyy.......","............"] },

  /* ---------- 薯条大王 ---------- */
  friesKing:{ p:{y:"#FFD54F",Y:"#F0B429",s:"#FFF7E8",k:"#5F4531",R:"#D8262C",r:"#A4121F"}, rows:[
    ".......s........","......yyy.......",".....yyyyy......","....yy...yy.....",
    "..y..yyyyy..y...","..yy.yyyyy.yy...","..yyy.yyy.yyy...","..yyyyyyyyyy....",
    "..ykkyyyykky....","..yyyyyyyyyy....","..yyy.kkk.yyy...","..yyyyyyyyyy....",
    "..yRRRRRRRRy....","..yRRRRRRRRy....","..yrrrrrrrry....","...rrrrrrrr....."] },
  kingCrown:{ p:{y:"#FFC72C",r:"#D8262C"}, rows:[
    "y..y....y..y...","yy.yy..yy.yy...","yyyyyyyyyyyyyyy",".yyryyyyyyryy..","..yyyyyyyyyy..."] },

  /* ---------- 人生模拟器新身份 ---------- */
  friesCrown:{ p:{y:"#FFD54F",Y:"#F0B429",r:"#D8262C",R:"#A4121F",w:"#FFF6E0"}, rows:[
    "..y..y..y..y...","..yyyyyyyyyy...","...y..y..y.....","...yy.yy.yy....","..yYy.yYy.yY...",
    "..yYyy.yYyy.Yy.",".yYyyyyYyyyYyy.",".rrrryyyyyyrrr.",".rrrryyyyyyrrr.",".rrrryyyyyyrrr.",
    ".rrrrryyyrrrrr.",".rrrrwwwwrrrr..",".rrrrwyywrrrr..",".rrrrwyywrrrr..",".rrrrwwwwrrrr..",
    ".rrrrrrrrrrrr..","..rrrrrrrrrrr..","...RRRRRRRRR..."] },
  milkshakeMage:{ p:{n:"#282B46",w:"#FFF6E0",c:"#F5DCC0",r:"#D8262C",R:"#A4121F",y:"#FFC72C"}, rows:[
    "....nnnnnn....","...nnnnnnnn...","..nnnnnnnnnn..","..nynynynyn...",".....wwww.....",
    "....wccccw....","....wccccw....","...wccccccw...","...wccccccw...","..wwwwwwwwww..",
    "..rrrrrrrrrr..","..rrwwwwwwrr..","..rrwrrrrwrr..","..rrwrrrrwrr..","..rrwwwwwwrr..",
    "..rrrrrrrrrr..","...rrrrrrrr...","....RRRRRR...."] },
  nuggetHat:{ p:{g:"#E8A85C",G:"#C77F1F",h:"#8B5A2B",H:"#6B4423",w:"#FFF6E0"}, rows:[
    ".....hhhh......","....hhhhhh.....","...hhhhhhhh....","..HHHHHHHHHH...","...g..g..g.....",
    "..ggg.ggg.gg...","..gGgggGgggGg..","..gggggggggg...",".gggggggggggg..",".gGgggggggggg..",
    ".ggwggggggwgg..",".gggggggggggg..","..gggggggggg...","...gggggggg....","....gggggg....."] }
};

/* =========================================================
 * 兔兔汉堡角色（Bun Bunny）
 * 原创食品 IP：芝麻面包脸 + 长兔耳 + 奶油杏内耳 + 豆豆眼 +
 * 小棕鼻 + 粉腮红 + 五角星发饰。
 * 严禁在额头 / 脸部 / 耳朵 / 头顶 / 面包表面出现 M 字母、
 * 金拱门、文字或任何品牌 Logo——可爱感全部来自造型本身。
 * ========================================================= */
var BUNNY_BURGER_PAL = {
  b:"#F0B95B",  /* 面包主色（金黄） */
  B:"#D89A3C",  /* 面包暗部（焦糖） */
  h:"#FFE0A0",  /* 面包高光 */
  s:"#FFF3D0",  /* 芝麻 */
  e:"#FBD9B4",  /* 内耳奶油杏 */
  k:"#5F4531",  /* 豆豆眼（深棕） */
  p:"#F6CED8",  /* 腮红（浅粉） */
  n:"#B5762F",  /* 鼻 / 嘴（暖棕） */
  y:"#FFC72C",  /* 星星发饰（蜂蜜金） */
  c:"#FFC72C",  /* 芝士 */
  l:"#8BC34A",  /* 生菜 */
  L:"#7CB342",  /* 生菜暗部 */
  P:"#8B5A2B",  /* 肉饼 */
  d:"#6B4423",  /* 肉饼纹理 */
  t:"#E05A4A",  /* 番茄 */
  a:"#F0A03C"   /* 酱料 */
};

/* 6 种表情（20×16，面包顶切面朝下，可直接叠在食材层上方） */
var BUNNY_FACE_ROWS = {
  /* 默认：两颗豆豆眼，平静呆萌 */
  idle:[
    ".....bb......bb..y..","....beeb....beebyyy.","....beeb....beeb.y..","....beeb....beeb....",
    "....beeb....beeb....","...bbeebb..bbeebb...","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    ".bbkkbbbbbbbbbbkkbb.",".bbkkbbbbbbbbbbkkbb.",".bbbbbbbbbbbbbbbbbb.",".bppbbbbbbbbbbbbppb.",
    ".bbbbbbbbnnbbbbbbbb.",".bbbbbbbbnnbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbbbbbb"],
  /* 开心：眼睛弯成笑弧，嘴张开 */
  happy:[
    ".....bb......bb..y..","....beeb....beebyyy.","....beeb....beeb.y..","....beeb....beeb....",
    "....beeb....beeb....","...bbeebb..bbeebb...","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    ".bbbbbbbbbbbbbbbbbb.",".bbkkkbbbbbbbbkkkbb.",".bk.kbbbbbbbbbbk.kb.",".bppbbbbbbbbbbbbppb.",
    ".bbbbbbbbbbbbbbbbbb.",".bbbbbbbnnnnbbbbbbb.",".bbbbbbbbnnbbbbbbbb.","bbbbbbbbbbbbbbbbbbbb"],
  /* 惊讶：豆豆眼放大，嘴变小圆点 */
  surprise:[
    ".....bb......bb..y..","....beeb....beebyyy.","....beeb....beeb.y..","....beeb....beeb....",
    "....beeb....beeb....","...bbeebb..bbeebb...","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    ".bbkkkbbbbbbbbkkkbb.",".bbkkkbbbbbbbbkkkbb.",".bbkkkbbbbbbbbkkkbb.",".bppbbbbbbbbbbbbppb.",
    ".bbbbbbbbbbbbbbbbbb.",".bbbbbbbbkkbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbbbbbb"],
  /* 困倦：半闭眼，兔耳自然下垂 */
  sleepy:[
    "....................","...bb..........bb...","..beeb........beeb..","..beeb........beeb..",
    ".bbeebb......bbeebb.",".bbbbbbbbbbbbbbbbbb.","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    ".bbbbbbbbbbbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.",".bkkkkbbbbbbbbkkkkb.",".bppbbbbbbbbbbbbppb.",
    ".bbbbbbbbnnbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbbbbbb"],
  /* 害羞：眯眼低头，腮红扩大泛红 */
  shy:[
    ".....bb......bb..y..","....beeb....beebyyy.","....beeb....beeb.y..","....beeb....beeb....",
    "....beeb....beeb....","...bbeebb..bbeebb...","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    ".bbbbbbbbbbbbbbbbbb.",".bk..kbbbbbbbbk..kb.",".bbkkbbbbbbbbbbkkbb.",".bpppbbbbbbbbbbpppb.",
    ".bppbbbbbbbbbbbbppb.",".bbbbbbbbnnbbbbbbbb.",".bbbbbbbbbbbbbbbbbb.","bbbbbbbbbbbbbbbbbbbb"],
  /* 吃一口：脸颊鼓起，嘴张开咀嚼 */
  bite:[
    ".....bb......bb..y..","....beeb....beebyyy.","....beeb....beeb.y..","....beeb....beeb....",
    "....beeb....beeb....","...bbeebb..bbeebb...","..bbbbbbbbbbbbbbbb..",".bhhbbsbbbbbbsbbbbb.",
    "bbbbbbbbbbbbbbbbbbbb","bbbkkbbbbbbbbbbkkbbb","bbbkkbbbbbbbbbbkkbbb","bppbbbbbbbbbbbbbbppb",
    "bppbbbbbbbbbbbbbbppb","bbbbbbbbnnnnbbbbbbbb","bbbbbbbbnnnnbbbbbbbb","bbbbbbbbbbbbbbbbbbbb"]
};

/* 汉堡内部食材层（芝士融化 → 生菜 → 肉饼 → 番茄 → 酱料 → 面包底） */
var BUNNY_BODY_ROWS = [
  "..cccccccccccccccc..","cc.ccc..cccc..ccc.cc","llllllllllllllllllll","lLlllLllllllllLlllLl",
  "PPPPPPPPPPPPPPPPPPPP","PPdPPPPPPdPPPPPPdPPP","tttttttttttttttttttt","tttttttttttttttttttt",
  ".aaaaaaaaaaaaaaaaaa.","..bbbbbbbbbbbbbbbb..",".bbbbbbbbbbbbbbbbbb.","..bbbBBBBBBBBBBbbb.."
];

/* 组合出 12 个素材：bunTopFace<表情>（DIY 顶层）+ bunBunny<表情>（完整角色） */
Object.keys(BUNNY_FACE_ROWS).forEach(function(k){
  var cap = k.charAt(0).toUpperCase() + k.slice(1);
  ART["bunTopFace" + cap] = { p:BUNNY_BURGER_PAL, rows:BUNNY_FACE_ROWS[k] };
  ART["bunBunny" + cap]   = { p:BUNNY_BURGER_PAL, rows:BUNNY_FACE_ROWS[k].concat(BUNNY_BODY_ROWS) };
});
ART.bunBunny   = ART.bunBunnyIdle;
ART.bunTopFace = ART.bunTopFaceIdle;
/* 表情 → 腮红加深（开心 / 害羞） */
var BUNNY_EXPR_PAL = {
  happy:   { p:"#F4A0B8" },
  shy:     { p:"#F49BB4" },
  surprise:{ p:"#F6CED8" }
};
var BUNNY_EXPRS = ["idle","happy","surprise","sleepy","shy","bite"];

/* 像素画渲染：同行连续同色合并为一个 rect，减少 DOM 数量 */
function artSVG(name, opts){
  opts = opts || {};
  var a = ART[name];
  if(!a) return "";
  var pal = {};
  for(var k in a.p) pal[k] = a.p[k];
  if(opts.palette) for(var j in opts.palette) pal[j] = opts.palette[j];
  var rects = "", w = 0, y, x, ch, n;
  for(y = 0; y < a.rows.length; y++){
    var row = a.rows[y];
    if(row.length > w) w = row.length;
    x = 0;
    while(x < row.length){
      ch = row[x];
      if(ch === "." || ch === " "){ x++; continue; }
      n = 1;
      while(x + n < row.length && row[x + n] === ch) n++;
      rects += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + (pal[ch] || "#000") + '"/>';
      x += n;
    }
  }
  var size = opts.size || 56;
  return '<svg class="art ' + (opts.cls || "") + '" viewBox="0 0 ' + w + " " + a.rows.length +
    '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" aria-hidden="true">' + rects + "</svg>";
}

/* 用原始 rows + palette 直接渲染（皮肤预览等动态素材用） */
function artSVGRows(rows, pal, size, cls){
  var rects = "", w = 0, y, x, ch, n;
  for(y = 0; y < rows.length; y++){
    var row = rows[y];
    if(row.length > w) w = row.length;
    x = 0;
    while(x < row.length){
      ch = row[x];
      if(ch === "." || ch === " "){ x++; continue; }
      n = 1;
      while(x + n < row.length && row[x + n] === ch) n++;
      rects += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + (pal[ch] || "#000") + '"/>';
      x += n;
    }
  }
  return '<svg class="art ' + (cls || "") + '" viewBox="0 0 ' + w + " " + rows.length +
    '" width="' + (size || 56) + '" height="' + (size || 56) + '" shape-rendering="crispEdges" aria-hidden="true">' + rects + "</svg>";
}

/* 把像素画绘制到 canvas（收藏卡 / 纪念卡导出用） */
function drawArtOn(ctx, name, x, y, cell, palette){
  var a = ART[name];
  if(!a) return 0;
  var pal = {};
  for(var k in a.p) pal[k] = a.p[k];
  if(palette) for(var j in palette) pal[j] = palette[j];
  var w = 0, r, c;
  for(r = 0; r < a.rows.length; r++) if(a.rows[r].length > w) w = a.rows[r].length;
  for(r = 0; r < a.rows.length; r++){
    for(c = 0; c < a.rows[r].length; c++){
      var ch = a.rows[r][c];
      if(ch === "." || ch === " ") continue;
      ctx.fillStyle = pal[ch] || "#000";
      ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
    }
  }
  return w;
}
