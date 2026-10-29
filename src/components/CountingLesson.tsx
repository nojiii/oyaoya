import { useState } from 'react'
import { TeachingScript } from './TeachingScript'
import { CountingFlow } from './CountingFlow'
import { countingWords } from './countingFlowState'
import styles from './CountingLesson.module.css'

interface Props {
  initial: number
}

// 身近なものを1こずつ指さして数える教材。数える数（1〜10）は親が選ぶ
export function CountingLesson({ initial }: Props) {
  const [n, setN] = useState(initial)
  const editor = (
    <fieldset className={styles.numberChoice}>
      <legend>数える数</legend>
      <div>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === n}
            onClick={() => setN(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </fieldset>
  )
  return (
    <TeachingScript
      key={n}
      flow={<CountingFlow n={n} editor={editor} />}
      editor={editor}
      prepare={{
        goal: `${n}このものを、1こずつ指さして数えます。`,
        materials: [
          `おはじき・ブロック・お菓子など、同じくらいの大きさのものを${n}こ`,
        ],
        point:
          '数えたものを横にずらしながら数えると、2回数えたり飛ばしたりしにくくなります。最後に言った数が「全部の数」になることを、一緒に確かめましょう。',
        avoid: [
          '親が先に数えてしまう',
          '間違えたときに「ちがう」とだけ言う',
          '「早く数えて」と急かす',
        ],
      }}
      question={{ say: countingWords.read }}
      turns={[
        { say: countingWords.line },
        { say: countingWords.count },
        { say: countingWords.answer },
      ]}
    />
  )
}
