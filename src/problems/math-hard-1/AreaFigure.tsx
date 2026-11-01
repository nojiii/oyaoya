import styles from './math-hard-1.module.css'

type Point = readonly [number, number]
type MarkShape = 'circle' | 'triangle' | 'square' | 'cross'

// 長さはすべて cm で持ち、描くときに SCALE 倍する
const SCALE = 30
// 外の長方形の横と縦。全体が 白72㎠＋ピンク64㎠＝136㎠ になるように縦を決める
const WIDTH = 12
const HEIGHT = 136 / WIDTH
// 白い四角形の頂点。問題の 8cm・5cm・4cm・7cm から決まる
const TOP: Point = [WIDTH - 8, 0]
const RIGHT: Point = [WIDTH, 5]
const BOTTOM: Point = [WIDTH - 4, HEIGHT]
const LEFT: Point = [0, 7]
// 補助線を引くと真ん中に残る長方形（横4cm・縦2cm）
const CENTER = {
  left: TOP[0],
  right: BOTTOM[0],
  top: RIGHT[1],
  bottom: LEFT[1],
}

// 外の長さを書くための余白（px）
const MARGIN_X = 90
const MARGIN_Y = 56
const VIEW_WIDTH = WIDTH * SCALE + MARGIN_X * 2
const VIEW_HEIGHT = HEIGHT * SCALE + MARGIN_Y * 2

// 四角形の辺ごとの、外のピンクの三角形と、補助線でできる内側の白い三角形。同じ印で同じ面積を示す
const PAIRS: { mark: MarkShape; pink: Point[]; white: Point[] }[] = [
  {
    mark: 'circle',
    pink: [[0, 0], TOP, LEFT],
    white: [[TOP[0], LEFT[1]], TOP, LEFT],
  },
  {
    mark: 'triangle',
    pink: [[WIDTH, 0], TOP, RIGHT],
    white: [[TOP[0], RIGHT[1]], TOP, RIGHT],
  },
  {
    mark: 'cross',
    pink: [[WIDTH, HEIGHT], RIGHT, BOTTOM],
    white: [[BOTTOM[0], RIGHT[1]], RIGHT, BOTTOM],
  },
  {
    mark: 'square',
    pink: [[0, HEIGHT], BOTTOM, LEFT],
    white: [[BOTTOM[0], LEFT[1]], BOTTOM, LEFT],
  },
]

// cm の座標を、図の px に直す
const px = (cm: number) => cm * SCALE
const xy = ([x, y]: Point) => `${px(x)},${px(y)}`
const centroid = (points: Point[]): Point => [
  points.reduce((sum, [x]) => sum + x, 0) / points.length,
  points.reduce((sum, [, y]) => sum + y, 0) / points.length,
]

// 補助線。左上の1つだけ（corner）か、4つとも（all）。点がずれないよう、重なる線は1本にまとめて引く
const GUIDES = {
  corner: [`M${xy(TOP)} V${px(LEFT[1])} H0`],
  all: [
    `M${xy(TOP)} V${px(LEFT[1])}`,
    `M${xy(LEFT)} H${px(BOTTOM[0])}`,
    `M${xy(BOTTOM)} V${px(RIGHT[1])}`,
    `M${xy(RIGHT)} H${px(TOP[0])}`,
  ],
}

// 辺の長さを示すかっこ。from から to までの辺に、side の側から添える（座標は cm）
function Bracket({
  from,
  to,
  side,
  label,
  className,
  textClassName,
}: {
  from: Point
  to: Point
  side: 'top' | 'bottom' | 'left' | 'right'
  label: string
  className: string
  textClassName: string
}) {
  const gap = 8
  const depth = 8
  const sign = side === 'top' || side === 'left' ? -1 : 1
  if (side === 'top' || side === 'bottom') {
    const y = px(from[1])
    const near = y + sign * gap
    const far = y + sign * (gap + depth)
    return (
      <>
        <path
          className={className}
          d={`M${px(from[0])},${near} V${far} H${px(to[0])} V${near}`}
        />
        <text
          className={textClassName}
          x={(px(from[0]) + px(to[0])) / 2}
          y={far + sign * 6}
          dominantBaseline={side === 'top' ? 'text-after-edge' : 'hanging'}
          textAnchor="middle"
        >
          {label}
        </text>
      </>
    )
  }
  const x = px(from[0])
  const near = x + sign * gap
  const far = x + sign * (gap + depth)
  return (
    <>
      <path
        className={className}
        d={`M${near},${px(from[1])} H${far} V${px(to[1])} H${near}`}
      />
      <text
        className={textClassName}
        x={far + sign * 6}
        y={(px(from[1]) + px(to[1])) / 2}
        dominantBaseline="central"
        textAnchor={side === 'left' ? 'end' : 'start'}
      >
        {label}
      </text>
    </>
  )
}

// 同じ面積の三角形に付ける印（○△□×）
function Mark({ shape, at }: { shape: MarkShape; at: Point }) {
  const [x, y] = [px(at[0]), px(at[1])]
  const r = 11
  switch (shape) {
    case 'circle':
      return <circle className={styles.mark} cx={x} cy={y} r={r} />
    case 'triangle':
      return (
        <path
          className={styles.mark}
          d={`M${x},${y - r} L${x + r * 1.1},${y + r * 0.8} H${x - r * 1.1} Z`}
        />
      )
    case 'square':
      return (
        <rect
          className={styles.mark}
          x={x - r * 0.9}
          y={y - r * 0.9}
          width={r * 1.8}
          height={r * 1.8}
        />
      )
    case 'cross':
      return (
        <path
          className={styles.mark}
          d={`M${x - r},${y - r} L${x + r},${y + r} M${x + r},${y - r} L${x - r},${y + r}`}
        />
      )
  }
}

// 外の長方形の4つの角に付ける直角の印
function RightAngles() {
  const s = 14
  const [w, h] = [px(WIDTH), px(HEIGHT)]
  return (
    <path
      className={styles.rightAngle}
      d={[
        `M${s},0 V${s} H0`,
        `M${w - s},0 V${s} H${w}`,
        `M${w - s},${h} V${h - s} H${w}`,
        `M${s},${h} V${h - s} H0`,
      ].join(' ')}
    />
  )
}

// 算数（難しい）第1問の図。台本のページごとに、補助線・印・長さを足していく
export function AreaFigure({
  label,
  guides,
  marks,
  area,
  sides = false,
  highlight = false,
}: {
  // 読み上げ用の図の説明
  label: string
  guides?: keyof typeof GUIDES
  // 同じ面積の三角形の印。左上の1組だけ（corner）か、4組とも（all）
  marks?: 'corner' | 'all'
  // 真ん中に書く面積（㎠）。㎠ の字は Noto Sans JP だとつぶれるので、cm と小さな 2 で書く
  area?: number
  // 真ん中の長方形の横と縦の長さを書く
  sides?: boolean
  // 真ん中の長方形を除いた、白い三角形4つをぬる
  highlight?: boolean
}) {
  const quad = [TOP, RIGHT, BOTTOM, LEFT].map(xy).join(' ')
  const centerRect = {
    x: px(CENTER.left),
    y: px(CENTER.top),
    width: px(CENTER.right - CENTER.left),
    height: px(CENTER.bottom - CENTER.top),
  }
  const shownPairs = marks === 'corner' ? PAIRS.slice(0, 1) : marks ? PAIRS : []

  return (
    <svg
      className={styles.figure}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
    >
      <g transform={`translate(${MARGIN_X} ${MARGIN_Y})`}>
        <rect className={styles.pink} width={px(WIDTH)} height={px(HEIGHT)} />
        <polygon
          className={highlight ? styles.highlight : styles.white}
          points={quad}
        />
        {highlight && <rect className={styles.white} {...centerRect} />}

        {guides &&
          GUIDES[guides].map((d) => (
            <path key={d} className={styles.guide} d={d} />
          ))}

        <rect className={styles.edge} width={px(WIDTH)} height={px(HEIGHT)} />
        <polygon className={styles.edge} points={quad} />
        <RightAngles />

        {shownPairs.map(({ mark, pink, white }) => (
          <g key={mark}>
            <Mark shape={mark} at={centroid(pink)} />
            <Mark shape={mark} at={centroid(white)} />
          </g>
        ))}

        <Bracket
          from={TOP}
          to={[WIDTH, 0]}
          side="top"
          label="8cm"
          className={styles.bracket}
          textClassName={styles.length}
        />
        <Bracket
          from={[WIDTH, 0]}
          to={RIGHT}
          side="right"
          label="5cm"
          className={styles.bracket}
          textClassName={styles.length}
        />
        <Bracket
          from={BOTTOM}
          to={[WIDTH, HEIGHT]}
          side="bottom"
          label="4cm"
          className={styles.bracket}
          textClassName={styles.length}
        />
        <Bracket
          from={[0, 0]}
          to={LEFT}
          side="left"
          label="7cm"
          className={styles.bracket}
          textClassName={styles.length}
        />

        {sides && (
          <>
            <Bracket
              from={[CENTER.left, CENTER.top]}
              to={[CENTER.right, CENTER.top]}
              side="top"
              label="4cm"
              className={styles.sideBracket}
              textClassName={styles.side}
            />
            <Bracket
              from={[CENTER.right, CENTER.top]}
              to={[CENTER.right, CENTER.bottom]}
              side="right"
              label="2cm"
              className={styles.sideBracket}
              textClassName={styles.side}
            />
          </>
        )}

        {area && (
          <text
            className={styles.area}
            data-small={sides || undefined}
            x={centerRect.x + centerRect.width / 2}
            y={centerRect.y + centerRect.height / 2}
            dominantBaseline="central"
            textAnchor="middle"
          >
            {area}cm
            <tspan className={styles.squared} dy="-0.6em">
              2
            </tspan>
          </text>
        )}
      </g>
    </svg>
  )
}
