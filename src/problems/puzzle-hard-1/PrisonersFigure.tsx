type PrisonerProps = {
  id: string
  x: number
  y: number
  hatColor: 'black' | 'white'
  facing: 'right' | 'left'
}

// 1人分の囚人を描画する部品
function Prisoner({ id, x, y, hatColor, facing }: PrisonerProps) {
  // 右向きなら1、左向きなら-1を掛けて反転させる
  const dir = facing === 'right' ? 1 : -1

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 鎖と鉄球 */}
      <path
        d={`M ${-15 * dir} -10 Q ${-30 * dir} 0 ${-45 * dir} -10`}
        stroke="#666"
        strokeWidth="2"
        fill="none"
      />
      <circle cx={-50 * dir} cy={-12} r="14" fill="#333" />

      {/* 脚と靴 */}
      <line x1={-7} y1={-40} x2={-7} y2={-5} stroke="black" strokeWidth="3" />
      <line x1={7} y1={-40} x2={7} y2={-5} stroke="black" strokeWidth="3" />
      <ellipse
        cx={-7 + 5 * dir}
        cy={-4}
        rx="8"
        ry="4"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      <ellipse
        cx={7 + 5 * dir}
        cy={-4}
        rx="8"
        ry="4"
        fill="white"
        stroke="black"
        strokeWidth="2"
      />

      {/* 囚人服 (体) */}
      <rect
        x={-16}
        y={-80}
        width={32}
        height={40}
        rx={6}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      {/* ボーダー柄 */}
      <rect x={-16} y={-70} width={32} height={5} fill="black" />
      <rect x={-16} y={-58} width={32} height={5} fill="black" />
      <rect x={-16} y={-46} width={32} height={5} fill="black" />

      {/* 腕 */}
      <path
        d={`M 0 -75 Q ${10 * dir} -60 ${5 * dir} -45`}
        stroke="black"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* 顔 */}
      <circle
        cx={0}
        cy={-100}
        r={20}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      {/* 鼻 */}
      <path
        d={`M ${17 * dir} -100 Q ${23 * dir} -96 ${17 * dir} -92`}
        stroke="black"
        strokeWidth="2"
        fill="none"
      />
      {/* 目 */}
      <circle cx={8 * dir} cy={-103} r={2.5} fill="black" />

      {/* 帽子 (半円) */}
      <path
        d="M -20 -100 A 20 20 0 0 1 20 -100 Z"
        fill={hatColor}
        stroke="black"
        strokeWidth="2"
      />
      <path d="M -22 -100 L 22 -100" stroke="black" strokeWidth="2" />

      {/* A, B, C, D のラベル */}
      <text
        x={0}
        y={-135}
        fontSize="22"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        {id}
      </text>
    </g>
  )
}

// 舞台全体を描画するコンポーネント
export function PrisonersFigure() {
  return (
    <svg
      viewBox="0 0 800 450"
      width="100%"
      height="100%"
      aria-label="囚人の帽子パズルの図解"
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {/* 背景（必要に応じて色を変えられます） */}
      <rect width="800" height="450" fill="#f8f9fa" />

      {/* 地面 */}
      <line x1={0} y1={360} x2={800} y2={360} stroke="black" strokeWidth="3" />

      {/* 階段 */}
      {/* 1段目（Aが乗る高い段） */}
      <rect
        x={50}
        y={160}
        width={130}
        height={200}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      {/* 2段目（Bが乗る中くらいの段） */}
      <rect
        x={180}
        y={260}
        width={130}
        height={100}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />

      {/* 壁（CとDの間） */}
      <rect
        x={520}
        y={60}
        width={40}
        height={300}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />

      {/* 囚人たち（元の画像の配色に合わせています） */}
      <Prisoner id="A" x={115} y={160} hatColor="black" facing="right" />
      <Prisoner id="B" x={245} y={260} hatColor="white" facing="right" />
      <Prisoner id="C" x={420} y={360} hatColor="black" facing="right" />
      <Prisoner id="D" x={670} y={360} hatColor="white" facing="left" />
    </svg>
  )
}
