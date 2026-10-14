import { useState } from 'react'
import { ProblemSections } from '../../components/ProblemSections'
import { StumbleSupport } from '../../components/StumbleSupport'
import { unit, stumbleStates } from './content'
import styles from './style.module.css'

export const title = 'くり上がりのたしざん'

export default function AdditionCarry() {
  const [answerVisible, setAnswerVisible] = useState(false)
  const [reaction, setReaction] = useState<
    keyof typeof unit.guide.responses | null
  >(null)

  return (
    <>
      <ProblemSections
        question={
          <>
            <p>{unit.learn}</p>
            <p className={styles.equation}>{unit.q}</p>
            <button
              className={styles.button}
              type="button"
              aria-expanded={answerVisible}
              aria-controls="carry-answer"
              onClick={() => setAnswerVisible(!answerVisible)}
            >
              {answerVisible ? '答えを隠す' : '答えを確認する'}
            </button>
            <p id="carry-answer" hidden={!answerVisible}>
              答え：{unit.a}
            </p>
          </>
        }
        howToSolve={
          <ol>
            {unit.guide.steps.map((step) => (
              <li className={styles.item} key={step.text}>
                <strong>{step.text}</strong>
                <p>すること：{step.doing}</p>
                <p>声かけ：{step.ask}</p>
              </li>
            ))}
          </ol>
        }
        howToTeach={
          <>
            <p>{unit.parent}</p>
            <p>{unit.guide.why}</p>
            <p>使えるもの：{unit.guide.materials.join('・')}</p>
            <p>気をつけたいところ：{unit.mistake}</p>
            <details>
              <summary>避けたい言い方と、代わりの声かけ</summary>
              <ul>
                {unit.guide.ng.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              <ul>
                {unit.guide.better.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </details>
          </>
        }
        examplePhrases={
          <>
            <div className={styles.mascot}>
              <img src="/mascot.png" alt="おやじい" />
              <blockquote>{unit.voice}</blockquote>
            </div>
            <p>お子さんの反応に合わせて、次の言葉を選べます。</p>
            <div className={styles.reactions}>
              {(
                [
                  ['understood', 'わかった'],
                  ['unsure', '少し不安そう'],
                  ['unknown', 'わからない'],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={styles.button}
                  type="button"
                  key={value}
                  aria-pressed={reaction === value}
                  onClick={() => setReaction(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p aria-live="polite">
              {reaction && unit.guide.responses[reaction]}
            </p>
            <details>
              <summary>理解を確かめる声かけ</summary>
              <ul>
                {unit.guide.check.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            </details>
          </>
        }
      />
      <StumbleSupport states={stumbleStates} />
    </>
  )
}
