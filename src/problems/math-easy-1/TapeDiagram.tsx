// 波括弧（ { や } のような形）を描画するヘルパー部品
function Brace({
  x,
  y,
  width,
  up = true,
}: {
  x: number
  y: number
  width: number
  up?: boolean
}) {
  const dir = up ? -1 : 1
  const h = 16 // 括弧の縦の高さ
  const r = 12 // カーブの丸み
  const mid = x + width / 2
  const end = x + width

  return (
    <path
      d={`M ${x} ${y}
         Q ${x} ${y + dir * h} ${x + r} ${y + dir * h}
         L ${mid - r} ${y + dir * h}
         Q ${mid} ${y + dir * h} ${mid} ${y + dir * h * 2}
         Q ${mid} ${y + dir * h} ${mid + r} ${y + dir * h}
         L ${end - r} ${y + dir * h}
         Q ${end} ${y + dir * h} ${end} ${y}`}
      fill="none"
      stroke="black"
      strokeWidth="2.5"
    />
  )
}

type TapeDiagramProps = {
  // 台本のページに合わせて表示を切り替えるためのプロパティ
  step?: 'whole' | 'discount' | 'price'
}

export function TapeDiagram({ step = 'price' }: TapeDiagramProps) {
  // 全体の寸法設定
  const barX = 100
  const barY = 160
  const barWidth = 600
  const barHeight = 100

  // 80%と20%の幅を計算
  const rightWidth = barWidth * 0.2
  const leftWidth = barWidth * 0.8

  return (
    <svg
      viewBox="0 0 800 450"
      width="100%"
      height="100%"
      aria-label="値段と割合の帯グラフ"
    >
      {/* ===== 共通部分（上の括弧と100%の帯） ===== */}
      <Brace x={barX} y={barY - 10} width={barWidth} up={true} />
      <text
        x={barX + barWidth / 2}
        y={barY - 80}
        fontSize="38"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        1200円
      </text>
      <text
        x={barX + barWidth / 2}
        y={barY - 35}
        fontSize="36"
        fontWeight="bold"
        fontFamily="sans-serif"
        textAnchor="middle"
      >
        100%
      </text>

      {/* 左側の帯 (水色) */}
      <rect
        x={barX}
        y={barY}
        width={leftWidth}
        height={barHeight}
        fill="#b3d4f0"
        stroke="black"
        strokeWidth="3"
      />

      {/* ===== step: 'discount' か 'price' の時だけ右のピンクの帯と20%を出す ===== */}
      {step !== 'whole' && (
        <>
          <rect
            x={barX + leftWidth}
            y={barY}
            width={rightWidth}
            height={barHeight}
            fill="#ffb6c1"
            stroke="black"
            strokeWidth="3"
          />
          <Brace
            x={barX + leftWidth}
            y={barY + barHeight + 10}
            width={rightWidth}
            up={false}
          />
          <text
            x={barX + leftWidth + rightWidth / 2}
            y={barY + barHeight + 70}
            fontSize="34"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            20%
          </text>
          <text
            x={barX + leftWidth + rightWidth / 2}
            y={barY + barHeight + 115}
            fontSize="34"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            240円
          </text>
        </>
      )}

      {/* ===== step: 'price' の時だけ左下の80%を出す（ご提示いただいた画像の状態） ===== */}
      {step === 'price' && (
        <>
          <Brace
            x={barX}
            y={barY + barHeight + 10}
            width={leftWidth}
            up={false}
          />
          <text
            x={barX + leftWidth / 2}
            y={barY + barHeight + 70}
            fontSize="34"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            80%
          </text>
          <text
            x={barX + leftWidth / 2}
            y={barY + barHeight + 115}
            fontSize="34"
            fontWeight="bold"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            ? 円
          </text>
        </>
      )}
    </svg>
  )
}
