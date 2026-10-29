// 札の絵。内側 14x22 を1文字1ドットで描く。Wikimedia Commons の伝統配色の花札を見ながら、
// 小さくても月と札の種類が分かる形と色に絞った
import type { Color } from './palette'
import type { Pixmap } from './pixmap'

export const ART_W = 14
export const ART_H = 22

export const KEY: Record<string, Color> = {
  k: 'sumi', h: 'hai', x: 'ink', r: 'shu', R: 'beni', p: 'fuji', v: 'kon', y: 'kiiro', o: 'daidai',
  g: 'moegi', w: 'shiro', W: 'washi', b: 'mizu', n: 'sakura', c: 'cha',
}

type Grid = string[]

interface Ribbon {
  color: 'r' | 'v'
  text?: boolean
  x: number
  y: number
  len: number
  // 1行下がるごとに右へずれる量
  slant: number
}

export interface Art {
  grid: Grid
  dots?: boolean
  ribbon?: Ribbon
  cloud?: 'left' | 'right'
}

const mirror = (g: Grid): Grid => g.map(r => [...r].reverse().join(''))

// ---- 1月 松: 黒い松に黄色い芽 ----
const PINE: Grid = [
  '..............',
  '..............',
  '..........y...',
  '..........k...',
  '.........kkk..',
  '.........kkk..',
  '...y....kkkkk.',
  '...k....kkkkk.',
  '..kkk..kkkkkkk',
  '..kkk..kkkkkkk',
  '.kkkkk.kkkkkkk',
  '.kkkkk.kkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
]

const PINE_CRANE: Grid = [
  '..xRxh.rrrrrrr',
  '..xwwx..rrrrrr',
  '...xwx...rrrrr',
  '...xwx....rrrr',
  '...xwx......rr',
  '...xwx........',
  '..xwwwx.......',
  '.xwwwwwx......',
  'xwwwwwwxx..y..',
  'xwwwwxxxx.kkk.',
  '.xwwxxxx.kkkkk',
  '..xxxxx..kkkkk',
  '...x.x..kkkkkk',
  'y..x.x..kkkkkk',
  'k..x.x.kkkkkkk',
  'kk.x.xkkkkkkkk',
  'kkkx.xkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
]

// ---- 2月 梅: 黒い枝に黄色い芯の赤い花 ----
const PLUM: Grid = [
  '...k......k...',
  '..rk.....rk...',
  '...k.r...k....',
  '...k.....k.r..',
  '..rkk...kk....',
  '...kk..rk.....',
  '.r.kk...k..r..',
  '..rrr..kk.....',
  '..ryr..kk.rrr.',
  '..rrr.kk..ryr.',
  '......kk..rrr.',
  '...kkkk.......',
  '..rrrkk...k...',
  '..ryrk...kk.r.',
  '..rrrk.kkk....',
  '....kkkkk.rrr.',
  '....kk.kk.ryr.',
  '...kkk..kkrrr.',
  '..kkk....kkkk.',
  '.kkkk.....kkkk',
  'kkkk.......kkk',
  'kkk.........kk',
]

const PLUM_BIRD: Grid = [
  '..............',
  '..............',
  '..............',
  '..............',
  '.........k.r..',
  '......rrrk....',
  '..gg..ryrk..r.',
  '.gxgg.rrrk.rrr',
  '.gggggg.kk.ryr',
  '..yyyggg.k.rrr',
  '..yyyyggkk....',
  '...yyyggkg....',
  '....yykkggg...',
  '...kkk...gg...',
  '..kkk......rrr',
  '.kkk..rrr..ryr',
  'kkk...ryr.kkrr',
  'kkk...rrrkk...',
  'kkkk..kkkk....',
  'kkkkkkkk..rrr.',
  'rrrkkkk...ryr.',
  'ryrkk.....rrr.',
]

// ---- 3月 桜: 桃色と赤の花、光札は紫と赤の幕 ----
const CHERRY: Grid = [
  '....nnn.rrr...',
  '...nnwnnryrr..',
  '....nnn.rrr...',
  '.rrr..k...k...',
  '.ryr.nnnkkk...',
  '.rrrnnwnnk....',
  '.....nnnkk....',
  '....kk..kk....',
  '...kk....kk...',
  '..kk.nnn..kk..',
  '.kk.nnwnn.kk..',
  '.k...nnn.kkk..',
  '..rrr...kkk...',
  '..ryr..kkk.nnn',
  '..rrr.kkk.nnwn',
  '.....kkkk..nnn',
  '....kkkk......',
  '...kkkkk......',
  '...kkkkk......',
  '..kkkkkk......',
  '..kkkkkkk.....',
  '.kkkkkkkk.....',
]

const CHERRY_CURTAIN: Grid = [
  'nnn.rrr.nnn.rr',
  'nwnrryrrnwnrry',
  'nnnrrrr.nnnrrr',
  '.rrr.nnn.rrr..',
  'rryrnnwnrryrnn',
  'rrrr.nnnrrrrnw',
  '.nnn.rrr..nnnn',
  'nnwnrryr.rrr..',
  'kkkkkkkkkkkkkk',
  'vyvvvvvyvvvvyv',
  'vyvvvvvyvvvvyv',
  'vvvvvvvvvvvvvv',
  'vvvvvvvvvvvvvv',
  'rrrrrrrrrrrrrr',
  'rrrrrrrrrrrrrr',
  'rrrrrrrrrrrrrr',
  'RRRRRRRRRRRRRR',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
]

// ---- 4月 藤: 上から垂れる紫の房と黒い葉 ----
const WISTERIA: Grid = [
  'k.k.kk.k.k.k.k',
  '.kkk..kkk..kk.',
  'k.k.kk.k.kk.k.',
  '..k....k...k..',
  '.pkp..pkp..k..',
  '..p....p..pkp.',
  '.pkp..pkp..p..',
  '..p....p..pkp.',
  '.pkp..pkp..p..',
  '..p....p..pkp.',
  '.p.p...p...p..',
  '..p...p.p.p.p.',
  '..........p...',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
]

const WISTERIA_CUCKOO: Grid = [
  'k.k.....k.k.k.',
  '.kk......kkk..',
  '...........k..',
  '....oo....pkp.',
  '...ooooo...p..',
  '..ooxooooopkp.',
  '.Roooooooo.p..',
  'RR.ooooo.oop..',
  'RR...ooo..pkp.',
  'RR........p...',
  'RR.......pkp..',
  '.RR.......p...',
  '..RRR....p.p..',
  '....RR.....k..',
  '..........k...',
  '..k......k....',
  '.kpk....k.....',
  '..p....k......',
  '.pkp..kk......',
  '..p..k.k......',
  '.p.p.k........',
  '.....k........',
]

// ---- 5月 菖蒲: 紫の花と黒い葉、タネは黄色い八橋と水 ----
const IRIS: Grid = [
  '..............',
  '..............',
  '....k.....k...',
  '...k.....k....',
  '...k.p.p.k....',
  '..kkpppppk....',
  '..k.ppypk.....',
  '..k..pp.k...k.',
  '..k..kk..k.k..',
  '.kk..k...k.k..',
  '.k.k.k..kk.k..',
  '.k.k.k..k.kk..',
  'k..kkk.kk.k...',
  'k..k.kkk..k.k.',
  'k.kk.kk..kk.k.',
  'k.k..kk.kk..k.',
  'kkk..kk.k..kk.',
  'kk..kkkkk.kk..',
  'kk.kkkkkkkk...',
  'kkkkkkkkkkk...',
  'kkkkkkkkkkkk..',
  'kkkkkkkkkkkkk.',
]

const IRIS_BRIDGE: Grid = [
  '..............',
  '..............',
  '....p.p.......',
  '...pppppk.....',
  '...ppypk......',
  '..k.pp.k.p.p..',
  '..k.kk.k.ppppp',
  '.kk.k..k.ppyp.',
  '.k..k.kk..pp..',
  'kk.kk.k...k...',
  'k..k.kk..kk...',
  'k.kk.k..kk....',
  'kkk..kkkk.....',
  'yyyyyy.o.....o',
  'yyyyyyyyyyy..o',
  'oyyyyyyyyyyyyy',
  'o.....yyyyyyyy',
  'bbbbbbbbbbyyyy',
  'bwwbbbbwwbbbbb',
  'bbbbbwwbbbbwwb',
  'bwwbbbbbbwwbbb',
  'bbbbbbbbbbbbbb',
]

// ---- 6月 牡丹: 大きな赤い花と黒い葉 ----
const PEONY: Grid = [
  '..............',
  '......rr......',
  '.....rrrr.....',
  '....kkrrkk....',
  '...kkk..kkk...',
  '..kk..kk..kk..',
  '......kk......',
  '......kk......',
  '....rrrrrr....',
  '...rrRrrRrr...',
  '..rrRrrrrRrr..',
  '..rrrRRRRrrr..',
  '..rRrrrrrrRr..',
  '...rrRRRRrr...',
  'k...rrrrrr...k',
  'kk...kkkk...kk',
  'kkk.kkkkkk.kkk',
  'kkkkk.kk.kkkkk',
  '.kkk..kk..kkk.',
  '..k...kk...k..',
  '......kk......',
  '......kk......',
]

const PEONY_BUTTERFLY: Grid = [
  '..............',
  '..............',
  '..............',
  '.....xyy......',
  '..yyyxyry.....',
  '.yryxxyyy.....',
  '..yyyx.....yy.',
  '.........yyry.',
  '........yxxyy.',
  '.........xyyy.',
  '..............',
  '....rrrrrr....',
  '...rrRrrRrr...',
  '..rrRrrrrRrr..',
  '..rrrRRRRrrr..',
  '..rRrrrrrrRr..',
  'k..rrRRRRrr..k',
  'kk..rrrrrr..kk',
  'kkk.kkkkkk.kkk',
  'kkkkk.kk.kkkkk',
  '.kkk..kk..kkk.',
  '..k...kk...k..',
]

// ---- 7月 萩: 細い枝に赤と黒の小さな葉 ----
const CLOVER: Grid = [
  '..r.r....r.r..',
  '.r.k.r..r.k.r.',
  '..rkr....rkr..',
  '.r.k.r..k.k.k.',
  '..kkk....kkk..',
  '.k.k.k..r.k.r.',
  '..kkk....rkr..',
  '....k...r.k.r.',
  '...rkr...kk...',
  '..r.k.r..k....',
  '...rkr..kk....',
  '..k.k.k.k.....',
  '...kkk.k......',
  '....kkk..r.r..',
  '.....k..r.k.r.',
  '....kk...rkr..',
  '...k.k..k.k.k.',
  '..k..k...kkk..',
  '.k...k..k.k...',
  'k....k.k......',
  '.....kk.......',
  '.....k........',
]

const CLOVER_BOAR: Grid = [
  '..........r.r.',
  '.........r.k.r',
  '..........rkr.',
  '.........k.k.k',
  '..........kkk.',
  '.........r.k.r',
  '..........rkr.',
  '.....ooo...k..',
  '...ooooooo.k..',
  '..okokokooo...',
  '.oooooooooooo.',
  'xoookokokooooo',
  '.ooooooooooooo',
  '..ooookokooo..',
  '..oo.oo..oo...',
  '..o..o...o.o..',
  '.....o........',
  '..r.r....r.r..',
  '.r.k.r..r.k.r.',
  '..rkr....rkr..',
  '.k.k.k..k.k.k.',
  'k..k..kk..k..k',
]

// ---- 8月 芒: 黒い丘。光札は赤い空に白い月 ----
const HILL_ROWS: Grid = [
  '....kkkkkk....',
  '..kkkkkkkkkk..',
  '.kkkkkkkkkkkk.',
  'kkkhhkkkkkkkkk',
  'kkkkkhkkkkhhkk',
  'khhkkkkkkkkkhk',
  'kkkhkkkhhkkkkk',
  'kkkkkkkkkhkkkk',
  'khhkkkkkkkkhhk',
  'kkkhkkhhkkkkkh',
]
const blank = (n: number): Grid => Array(n).fill('.'.repeat(ART_W))

const HILL = [...blank(12), ...HILL_ROWS]
const HILL_HIGH = [...blank(10), '......kkkkkkk.', '...kkkkkkkkkkk', ...HILL_ROWS.slice(1), 'kkhkkkkkhkkkhk']

const MOON: Grid = [
  'rrrrrrrrrrrrrr',
  'rrrrrwwwwrrrrr',
  'rrrwwwwwwwwrrr',
  'rrwwwwwwwwwwrr',
  'rwwwwwwwwwwwwr',
  'rwwwwwwwwwwwwr',
  'rwwwwwwwwwwwwr',
  'rrwwwwwwwwwwrr',
  'rrrwwwwwwwwrrr',
  'rrrrrwwwwrrrrr',
  'rrrrrrrrrrrrrr',
  'rrrrrrrrrrrrrr',
  ...HILL_ROWS,
]

const GEESE: Grid = [
  '..............',
  '.oo...........',
  '..ooyox.......',
  '...oo.....oo..',
  '...........ooy',
  '..........ooo.',
  '..oo..........',
  '...ooyox......',
  '....oo........',
  '..............',
  '..............',
  '..............',
  ...HILL_ROWS,
]

// ---- 9月 菊: 黄と赤の菊、タネは赤い盃 ----
const CHRYSANTHEMUM: Grid = [
  '....ryryr.....',
  '...yryyyry....',
  '....ryryr.....',
  '......k.......',
  '...kk.k.kk....',
  '..kkkkkkkkk...',
  '...kk.k.kk....',
  '......k.......',
  '...yryryry....',
  '..yrryyyrry...',
  '.yryyrrryyry..',
  '..yrryyyrry...',
  '...yryryry....',
  '..kk..k..kk...',
  '.kkkk.k.kkkk..',
  'kkkkk.k.kkkkk.',
  '.kkk..k..kkk..',
  '......k.......',
  '.....kk.......',
  '....k.k.......',
  '......k.......',
  '......k.......',
]

const CHRYSANTHEMUM_CUP: Grid = [
  '..............',
  '..............',
  '..............',
  '....ryryr.....',
  '...yryyyry....',
  '....ryryr.....',
  '..kk..k..kk...',
  '.kkkk.k.kkkk..',
  '..yryryry.....',
  '.yrryyyrrrrrr.',
  'yryyrrrrrrrrrr',
  '.yrrrrxxxxrrrr',
  '..rrrrrxxrrrr.',
  '.kkkrrxxxrrr..',
  'kkkkkrrrrrr...',
  '.kkk..k.......',
  '......k.......',
  'kkkk..k..kkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
  'kkkkkkkkkkkkkk',
]

// ---- 10月 紅葉: 赤・黒・黄の星形の葉 ----
const MAPLE: Grid = [
  'r.r.r.....k.k.',
  '.rrr.....kkk..',
  'rrrrr...kkkkk.',
  '.rrr.....kkk..',
  '..r.......k...',
  '.....y.y.y....',
  '......yyy.....',
  '.....yyyyy....',
  'k.k.k.yyy.....',
  '.kkk...y...r.r',
  'kkkkk.......rr',
  '.kkk.......rrr',
  '..k.........rr',
  '.......r.r.r..',
  '........rrr...',
  '.y.y.y.rrrrr..',
  '..yyy...rrr...',
  '.yyyyy...r....',
  '..yyy....k.k.k',
  '...y......kkk.',
  '.........kkkkk',
  '..........kkk.',
]

const MAPLE_DEER: Grid = [
  'k.k.k...r.r.r.',
  '.kkk.....rrr..',
  'kkkkk...rrrrr.',
  '.kkk.c.c.rrr..',
  '..k...c...r...',
  '.....cc.......',
  '....ooo.......',
  '...xooo.......',
  '.....oo.......',
  '.....oo.......',
  '.....ooooooo..',
  '.....oooooooo.',
  '.....oowowooo.',
  '......oooooo..',
  '......o.o.o.o.',
  '......o.o.o.o.',
  '......o.o.o.o.',
  '.y.y.y........',
  '..yyy.....r.r.',
  '.yyyyy.....rr.',
  '..yyy.....rrr.',
  'kkkkkkkkkkkkkk',
]

// ---- 11月 柳: 垂れる黒い柳。カスは赤と黒の雷 ----
const WILLOW: Grid = [
  'kkk.......kkkk',
  'kkkk......kkk.',
  '.kkk.....kkkk.',
  '.kkkk....kkk..',
  '..kkk...kkkk..',
  '..kkkk..kkk...',
  '...kkk..kkk...',
  '...kkk.kkkk...',
  '...kkkk.kkk...',
  '....kkk.kk....',
  '....kkk.kk....',
  '....kkk.kk....',
  '.....kk.kk....',
  '.....kk..k....',
  '.....kk..k....',
  '......k..k....',
  '......k.......',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
]

const WILLOW_MAN: Grid = [
  'kkkk.....kkkkk',
  '.kkk......kkkk',
  '.kkkk.....kkk.',
  '..kkk......kkk',
  '..kkk..yyy..kk',
  '...k..yyyyy..k',
  '.....yyyyyyy..',
  '........x.....',
  '.......xhx....',
  '.......rrr....',
  'bb....rrrrr...',
  '.bbb..rrrrrr..',
  '...bbbrrrrr...',
  '.....bbrrrr...',
  '......bvvv....',
  '......v.v.bb..',
  '..............',
  '.oo.......oo..',
  'ooxo......oo..',
  'oooo.....oo...',
  '.o.o..kkkkkkkk',
  'kkkkkkkkkkkkkk',
]

const WILLOW_SWALLOW: Grid = [
  'kkk.....kkkkkk',
  'kkkk.....kkkk.',
  '.kkk......kkk.',
  '.kkkk.....kkk.',
  '..kkk.....kkk.',
  '..kkk..rx.kkk.',
  '...kk.rry.kk..',
  '...kyyyyyykk..',
  '...yyyyyy.kk..',
  '..yy.yyyy.kk..',
  '.......Rr.kk..',
  '.......R.r.k..',
  '......R...rk..',
  '......R....k..',
  '.....R.....k..',
  '...........k..',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
]

const LIGHTNING: Grid = [
  'rrrrrrrrrrrrrr',
  'rkrrkrrrrkrrrr',
  'rrkrrkrrrrkrrr',
  'kkkkkkkkkkkrrr',
  'kkkkkkkkkkkkrr',
  'kkkkkkkkrrkkkr',
  'kkkkkkkrrrrkkk',
  'kkkkkkrrkkrrkk',
  'kkkkkrrkkkkrrk',
  'kkkkrrkkkkkkrr',
  'kkkrrkkkkkkkkr',
  'kkrrkkkkkkkkkk',
  'kkkkkkhhhhkkkk',
  'kkkkkhkkkkhkkk',
  'kkkkhkkhhkkhkk',
  'kkkkhkhkkhkhkk',
  'kkkkhkkhhkkhkk',
  'kkkkkhkkkkhkkk',
  'rrrrrrhhhhrrrr',
  'rkrrkrrrrkrrkr',
  'rrrrrrrrrrrrrr',
  'rkrrrkrrkrrrkr',
]

// ---- 12月 桐: 紫の花の穂と大きな黒い葉 ----
const PAULOWNIA: Grid = [
  '..............',
  '..............',
  '..............',
  '.....p...p....',
  '....p.p.p.p...',
  '.....pkpkp....',
  '....p.kpk.p...',
  '......pkp.....',
  '..p...kkk..p..',
  '.ppp...k..ppp.',
  '..p....k...p..',
  '...k...k..k...',
  '....kk.k.kk...',
  '..kkkkkkkkkkk.',
  '.kkkkhkkkhkkkk',
  'kkkkkhkkkhkkkk',
  'kkkhhhkkhhhkkk',
  'kkkkkhkkkhkkkk',
  '.kkkkhkkkhkkk.',
  '..kkkkk.kkkkk.',
  '...kkk...kkk..',
  '..............',
]

const PAULOWNIA_YELLOW = PAULOWNIA.map((row, y) => (y >= 17 ? row.replaceAll('.', 'y') : row))

const PHOENIX: Grid = [
  'yy.y.vvvvvvvvv',
  'y.rrrrvvvvvvvv',
  '.rrxrrr.vvvv.v',
  'rrrrrrrr..vvvv',
  'rRrrrrrr...vvv',
  '.rRrrRr.....vv',
  '..RR..rr.....v',
  '.......rr.....',
  '..r.....r.....',
  '.r..p...p.....',
  '....p.p.p.p...',
  '.....pkpkp....',
  '......pkp.....',
  '..p...kkk..p..',
  '.ppp...k..ppp.',
  '..p....k...p..',
  '.kkkkkkkkkkkk.',
  'kkkkhkkkkhkkkk',
  'kkkhhhkkhhhkkk',
  'kkkkhkkkkhkkkk',
  'yyyyyyyyyyyyyy',
  'yyyyyyyyyyyyyy',
]

const red = (x: number, y: number, len = 13, slant = 0.3): Ribbon => ({ color: 'r', text: true, x, y, len, slant })
const plain = (x: number, y: number, len = 13, slant = 0.3): Ribbon => ({ color: 'r', x, y, len, slant })
const blue = (x: number, y: number, len = 13, slant = 0.3): Ribbon => ({ color: 'v', x, y, len, slant })

// CARDS の並び (月ごとに 光/タネ, 短冊, カス, カス) に合わせる
export const ART: Art[] = [
  { grid: PINE_CRANE },
  { grid: PINE, dots: true, ribbon: red(3, 1) },
  { grid: PINE },
  { grid: mirror(PINE) },

  { grid: PLUM_BIRD, cloud: 'left' },
  { grid: PLUM, dots: true, ribbon: red(4, 1) },
  { grid: PLUM },
  { grid: mirror(PLUM) },

  { grid: CHERRY_CURTAIN },
  { grid: CHERRY, dots: true, ribbon: red(6, 2, 14, 0.15) },
  { grid: CHERRY },
  { grid: mirror(CHERRY) },

  { grid: WISTERIA_CUCKOO },
  { grid: WISTERIA, dots: true, ribbon: plain(4, 4, 12, 0.35) },
  { grid: WISTERIA },
  { grid: mirror(WISTERIA) },

  { grid: IRIS_BRIDGE, cloud: 'right' },
  { grid: IRIS, dots: true, ribbon: plain(2, 2, 12, 0.35) },
  { grid: IRIS },
  { grid: mirror(IRIS) },

  { grid: PEONY_BUTTERFLY, cloud: 'left' },
  { grid: PEONY, dots: true, ribbon: blue(7, 1, 14, -0.3) },
  { grid: PEONY },
  { grid: mirror(PEONY) },

  { grid: CLOVER_BOAR, cloud: 'left' },
  { grid: CLOVER, dots: true, ribbon: plain(6, 2, 12, -0.25) },
  { grid: CLOVER },
  { grid: mirror(CLOVER) },

  { grid: MOON },
  { grid: GEESE },
  { grid: HILL },
  { grid: HILL_HIGH },

  { grid: CHRYSANTHEMUM_CUP, cloud: 'left' },
  { grid: CHRYSANTHEMUM, dots: true, ribbon: blue(7, 2, 14, -0.3) },
  { grid: CHRYSANTHEMUM },
  { grid: mirror(CHRYSANTHEMUM) },

  { grid: MAPLE_DEER },
  { grid: MAPLE, dots: true, ribbon: blue(4, 3, 14, 0.25) },
  { grid: MAPLE },
  { grid: mirror(MAPLE) },

  { grid: WILLOW_MAN },
  { grid: WILLOW_SWALLOW },
  { grid: mirror(WILLOW), ribbon: plain(5, 3, 13, 0.2) },
  { grid: LIGHTNING },

  { grid: PHOENIX },
  { grid: PAULOWNIA },
  { grid: PAULOWNIA_YELLOW },
  { grid: mirror(PAULOWNIA) },
]

const CLOUD: Grid = ['rrrrr.rr', 'rRrrrrrr', '.rrr.rRr', '..r...r.']

// (ox, oy) を内側の左上として描く
export function paint(p: Pixmap, art: Art, ox: number, oy: number) {
  p.stamp(art.grid, ox, oy, KEY)
  if (art.cloud) {
    const cloud = art.cloud === 'left' ? CLOUD : mirror(CLOUD)
    p.stamp(cloud, art.cloud === 'left' ? ox : ox + ART_W - 8, oy, KEY)
  }
  // 短冊札の背景の細かい点
  if (art.dots)
    for (let y = 0; y < ART_H; y++)
      for (let x = 0; x < ART_W; x++)
        if (art.grid[y][x] === '.' && (x * 7 + y * 5) % 9 === 0) p.px(ox + x, oy + y, 'sumi')
  if (art.ribbon) {
    const r = art.ribbon
    const [main, shade]: Color[] = r.color === 'v' ? ['kon', 'night'] : ['shu', 'beni']
    for (let i = 0; i < r.len; i++) {
      const x = ox + r.x + Math.round(i * r.slant)
      const y = oy + r.y + i
      p.px(x - 1, y, 'ink')
      p.rect(x, y, 3, 1, main)
      p.px(x + 3, y, 'ink')
      p.px(x + 2, y, shade)
      if (r.text && i > 1 && i < r.len - 2 && i % 2 === 0) p.px(x + 1, y, 'ink')
    }
  }
}

// 取り札のアイコンに切り出す 6x10 の左上。札ごとにいちばん見分けやすい所を選ぶ
// 取り札は重ねて並べるので、左の3列だけでも月が分かる位置にしてある
export const ICON_W = 6
export const ICON_H = 10
export const ICON_CROP: [number, number][] = [
  [2, 0], [2, 1], [6, 2], [2, 2],
  [0, 5], [3, 2], [1, 7], [7, 7],
  [0, 5], [4, 2], [3, 0], [5, 0],
  [0, 3], [3, 3], [0, 2], [8, 2],
  [0, 11], [1, 2], [2, 2], [6, 2],
  [1, 3], [4, 1], [4, 7], [4, 7],
  [0, 7], [3, 2], [0, 0], [8, 0],
  [1, 2], [0, 0], [0, 10], [0, 8],
  [5, 8], [3, 2], [2, 8], [6, 8],
  [3, 3], [3, 3], [0, 0], [8, 0],
  [5, 4], [3, 5], [3, 2], [0, 0],
  [0, 0], [3, 3], [3, 12], [5, 3],
]
