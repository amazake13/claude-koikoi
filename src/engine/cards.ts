export type Kind = 'light' | 'seed' | 'ribbon' | 'chaff'
export type RibbonColor = 'red' | 'blue' | 'plain'

export interface Card {
  id: number
  month: number
  kind: Kind
  name: string
  ribbon?: RibbonColor
}

export const MONTH_NAMES = ['松', '梅', '桜', '藤', '菖蒲', '牡丹', '萩', '芒', '菊', '紅葉', '柳', '桐']

type Spec = [Kind, string, RibbonColor?]

const SPECS: Spec[][] = [
  [['light', '松に鶴'], ['ribbon', '松に赤短', 'red'], ['chaff', '松のカス'], ['chaff', '松のカス']],
  [['seed', '梅に鶯'], ['ribbon', '梅に赤短', 'red'], ['chaff', '梅のカス'], ['chaff', '梅のカス']],
  [['light', '桜に幕'], ['ribbon', '桜に赤短', 'red'], ['chaff', '桜のカス'], ['chaff', '桜のカス']],
  [['seed', '藤に不如帰'], ['ribbon', '藤の短冊', 'plain'], ['chaff', '藤のカス'], ['chaff', '藤のカス']],
  [['seed', '菖蒲に八橋'], ['ribbon', '菖蒲の短冊', 'plain'], ['chaff', '菖蒲のカス'], ['chaff', '菖蒲のカス']],
  [['seed', '牡丹に蝶'], ['ribbon', '牡丹に青短', 'blue'], ['chaff', '牡丹のカス'], ['chaff', '牡丹のカス']],
  [['seed', '萩に猪'], ['ribbon', '萩の短冊', 'plain'], ['chaff', '萩のカス'], ['chaff', '萩のカス']],
  [['light', '芒に月'], ['seed', '芒に雁'], ['chaff', '芒のカス'], ['chaff', '芒のカス']],
  [['seed', '菊に盃'], ['ribbon', '菊に青短', 'blue'], ['chaff', '菊のカス'], ['chaff', '菊のカス']],
  [['seed', '紅葉に鹿'], ['ribbon', '紅葉に青短', 'blue'], ['chaff', '紅葉のカス'], ['chaff', '紅葉のカス']],
  [['light', '柳に小野道風'], ['seed', '柳に燕'], ['ribbon', '柳の短冊', 'plain'], ['chaff', '柳のカス']],
  [['light', '桐に鳳凰'], ['chaff', '桐のカス'], ['chaff', '桐のカス'], ['chaff', '桐のカス']],
]

// id は月ごとに4枚ずつ並ぶので、月は id / 4 で引ける
export const CARDS: readonly Card[] = SPECS.flatMap((specs, m) =>
  specs.map(([kind, name, ribbon], i) => ({ id: m * 4 + i, month: m + 1, kind, name, ribbon })),
)

export const card = (id: number): Card => CARDS[id]
export const monthOf = (id: number) => Math.floor(id / 4) + 1

export const RAIN_MAN = 40 // 柳に小野道風
export const SAKE_CUP = 32 // 菊に盃
export const CURTAIN = 8 // 桜に幕
export const MOON = 28 // 芒に月
export const BOAR = 24
export const DEER = 36
export const BUTTERFLY = 20
