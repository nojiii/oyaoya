import type { ScriptedUnitId } from './units'

export function QuestionVisual({ id }: { id: ScriptedUnitId }) {
  if (id === 'clock-reading')
    return (
      <svg viewBox="0 0 200 200" width="200" role="img" aria-label="時計">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="white"
          stroke="currentColor"
          strokeWidth="3"
        />
        {[
          [100, 30, '12'],
          [175, 106, '3'],
          [100, 182, '6'],
          [25, 106, '9'],
        ].map(([x, y, n]) => (
          <text key={n} x={x} y={y} textAnchor="middle" fontSize="20">
            {n}
          </text>
        ))}
        <path
          d="M100 100V45 M100 100H145"
          stroke="currentColor"
          strokeWidth="6"
        />
      </svg>
    )
  if (id === 'shape-sides')
    return (
      <svg viewBox="0 0 200 150" width="200" role="img" aria-label="三角形">
        <path
          d="M100 10L190 140H10Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
      </svg>
    )
  if (id === 'shape-corners')
    return (
      <svg viewBox="0 0 200 150" width="200" role="img" aria-label="四角形">
        <rect
          x="10"
          y="10"
          width="180"
          height="130"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
      </svg>
    )
  if (id === 'length-compare')
    return (
      <svg
        viewBox="0 0 240 100"
        width="240"
        role="img"
        aria-label="左端をそろえた線Aと線B"
      >
        <text x="0" y="30">
          A
        </text>
        <path d="M30 25H230" stroke="currentColor" strokeWidth="6" />
        <text x="0" y="80">
          B
        </text>
        <path d="M30 75H150" stroke="currentColor" strokeWidth="6" />
      </svg>
    )
  return null
}
