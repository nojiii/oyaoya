import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import styles from './AdditionFlow.module.css'
import countingStyles from './CountingLesson.module.css'
import {
  countingPages,
  countingWords,
  restoreCountingPage,
  type CountingPage,
} from './countingFlowState'

export function CountingFlow({ n, editor }: { n: number; editor: ReactNode }) {
  const location = useLocation()
  const storageKey = `counting-flow:v1:${location.pathname}:${n}`
  const [page, setPage] = useState<CountingPage>(() => {
    try {
      return restoreCountingPage(sessionStorage.getItem(storageKey))
    } catch {
      return 'read'
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, page)
    } catch {
      // 保存できなくても、この画面で学習を続けられる。
    }
  }, [page, storageKey])
  const index = countingPages.indexOf(page)
  const slides: Record<CountingPage, LessonSlide> = {
    read: {
      id: 'read',
      title: '何こあるか、数えてみましょう',
      content: (
        <>
          <TeachingPoints
            note={`おはじき・ブロック・お菓子など、身近なものを**${n}個**用意して、お子さんの前に置きましょう。\n\n数える数は下で変えられます。はじめは**5個まで**がおすすめです。`}
          />
          <div className={styles.problem}>{editor}</div>
          <SpokenWords>{countingWords.read}</SpokenWords>
        </>
      ),
    },
    line: {
      id: 'line',
      title: '1列に並べましょう',
      content: (
        <>
          <TeachingPoints
            note={
              'ばらばらのままだと、どれを数えたか分からなくなります。**横1列に、少し間をあけて**並べましょう。\n\nお子さんに並べてもらうと、1個ずつ触るきっかけになります。'
            }
          />
          <div
            className={countingStyles.line}
            role="img"
            aria-label={`おはじきが${n}こ、1列に並んでいます`}
          >
            {Array.from({ length: n }, (_, i) => (
              <span key={i} aria-hidden="true" />
            ))}
          </div>
          <SpokenWords>{countingWords.line}</SpokenWords>
        </>
      ),
    },
    count: {
      id: 'count',
      title: '1こずつ指さして数えましょう',
      content: (
        <>
          <TeachingPoints
            note={
              'お子さんが**1個ずつ指でさしながら**、声に出して数えます。親は一緒に数えず、見守りましょう。\n\n数えたものは、**1個ずつ横へずらして**もらいます。数えたものとまだのものが分かれるので、2回数えたり飛ばしたりせずに、最後まで数えられます。'
            }
          />
          <SpokenWords>{countingWords.count}</SpokenWords>
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '全部で何こだったかな？',
      content: (
        <div className={styles.answer}>
          <TeachingPoints
            note={
              '数え終わったら、何個だったかを聞きます。\n\nお子さんが答えたら、**最後に言った数が、全部の数**になることを一緒に確かめましょう。'
            }
          />
          <SpokenWords>{countingWords.answer}</SpokenWords>
          <SpokenWords title="答えたら">{countingWords.confirm(n)}</SpokenWords>
          <button
            className={styles.secondary}
            type="button"
            onClick={() => setPage('read')}
          >
            数を変えて、もう1回
          </button>
        </div>
      ),
    },
  }
  return (
    <LessonSlides
      slides={countingPages.map((id) => slides[id])}
      currentId={page}
      totalKnown
      nextLabel={
        page === 'answer'
          ? undefined
          : page === 'count'
            ? '数え終わった'
            : '次へ'
      }
      canNext={page !== 'answer'}
      onNext={() => setPage(countingPages[index + 1] ?? page)}
      onBack={() => setPage(countingPages[index - 1] ?? page)}
    />
  )
}
