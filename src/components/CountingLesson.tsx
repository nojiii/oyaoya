import { useState } from 'react'
import { useLocation } from 'react-router'
import { TeachingScript } from './TeachingScript'
import { CountingFlow, CountingLine } from './CountingFlow'
import {
  countingFlowStatus,
  countingGiveCount,
  countingStorageKey,
  countingWords,
} from './countingFlowState'
import styles from './CountingLesson.module.css'

interface Props {
  initial: number
}

// 身近なものを1こずつ指さして数える教材。数える数（1〜10）は親が選ぶ
export function CountingLesson({ initial }: Props) {
  const [n, setN] = useState(initial)
  const location = useLocation()
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
      flow={<CountingFlow n={n} />}
      flowStatus={() =>
        countingFlowStatus(
          sessionStorage.getItem(countingStorageKey(location.pathname)),
          n,
        )
      }
      editor={editor}
      picture={<CountingLine n={n} />}
      prepare={{
        goal: `${n}このものを、1こずつ指さして数えます。`,
        materials: [
          `おはじき・ブロック・お菓子など、同じくらいの大きさのものを${n}こ`,
        ],
        point:
          '数えたものを1こずつ手前にずらしながら数えると、2回数えたり飛ばしたりせずに数えられます。最後に言った数が「全部の数」になることを、一緒に確かめましょう。',
        together:
          'お子さんが数えるのを見守り、最後に言った数を一緒に確かめます。',
        approach: '身近なものを、お子さんが1こずつ指さして数える',
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
        { say: `（答えたら）${countingWords.confirm}` },
        { say: `（たしかめ）${countingWords.recount}` },
        { say: `（たしかめ）${countingWords.give(countingGiveCount(n))}` },
      ]}
    />
  )
}
