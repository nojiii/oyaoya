import { useId } from 'react'
import styles from './puzzle-hard-1.module.css'

// 図に出す4人。壁の左にAさん・Bさん・Cさんが壁から遠い順に並び、壁の右にDさんが立つ
const people = ['A', 'B', 'C', 'D'] as const
type Person = (typeof people)[number]
// unknown は、その人にはまだわからない色（「？」の帽子）
type Hat = 'black' | 'white' | 'unknown'
export type Hats = Record<Person, Hat>

const hatNames: Record<Hat, string> = {
  black: '黒',
  white: '白',
  unknown: 'わからない色',
}

// 4人の立つ位置（x は人の中心、y は足もと）。壁の左は、うしろの人ほど高い段に立ち、前の人の帽子を見下ろす
const positions: Record<Person, { x: number; y: number }> = {
  A: { x: 48, y: 128 },
  B: { x: 120, y: 150 },
  C: { x: 192, y: 172 },
  D: { x: 304, y: 172 },
}

// 1人分の絵。足もとを (0, 0) にして描く。枠線は使わず、色の面だけで描く
function Prisoner({ hat, facing }: { hat: Hat; facing: 1 | -1 }) {
  return (
    <>
      {/* しま模様の囚人服 */}
      <rect
        className={styles.body}
        x="-20"
        y="-52"
        width="40"
        height="52"
        rx="12"
      />
      <rect className={styles.stripe} x="-20" y="-40" width="40" height="6" />
      <rect className={styles.stripe} x="-20" y="-29" width="40" height="6" />
      <rect className={styles.stripe} x="-20" y="-18" width="40" height="6" />
      <circle className={styles.head} cy="-72" r="19" />
      {/* 向いているほうに目を置く */}
      <circle className={styles.eye} cx={8 * facing} cy="-72" r="2.6" />
      <g className={styles.hat} data-hat={hat}>
        <rect x="-15" y="-108" width="30" height="24" rx="5" />
        <rect x="-24" y="-88" width="48" height="7" rx="3.5" />
      </g>
      {hat === 'unknown' && (
        <text className={styles.unknown} y="-90">
          ？
        </text>
      )}
    </>
  )
}

// ステージに置く図。dim の人は薄くして、いま考えている人から外す。
// compact は、答えの行と一緒に置くページで図を小さくし、ステージの高さをほかのページとそろえる
export function PrisonersFigure({
  hats,
  dim = [],
  compact = false,
}: {
  hats: Hats
  dim?: Person[]
  compact?: boolean
}) {
  // 部屋の角を丸めるための切り抜き。準備の画面と台本で同時に出ても重ならないようにする
  const clipId = useId()
  const label = `壁の左にAさん・Bさん・Cさんが並び、壁から遠い人ほど高い段にいます。壁の右にはDさんが立っています。4人とも壁のほうを向いています。帽子は${people
    .map((person) => `${person}さんが${hatNames[hats[person]]}`)
    .join('、')}です`
  return (
    <svg
      className={`${styles.figure} ${compact ? styles.compact : ''}`}
      viewBox="0 0 352 204"
      role="img"
      aria-label={label}
    >
      <clipPath id={clipId}>
        <rect width="352" height="204" rx="16" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect className={styles.room} width="352" height="204" />
        {/* 床と、Aさん・Bさんが乗る2つの段 */}
        <rect className={styles.floor} y="172" width="352" height="32" />
        <path className={styles.floor} d="M0 172 V128 H84 V150 H156 V172 Z" />
        <text className={styles.wallName} x="248" y="24">
          壁
        </text>
        <rect className={styles.wall} x="242" y="34" width="12" height="138" />
        {people.map((person) => {
          const { x, y } = positions[person]
          return (
            <g
              key={person}
              className={dim.includes(person) ? styles.dim : undefined}
            >
              <g transform={`translate(${x} ${y})`}>
                <Prisoner hat={hats[person]} facing={person === 'D' ? -1 : 1} />
              </g>
              <text className={styles.name} x={x} y="194">
                {person}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
