import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { TeachingPoints } from './TeachingPoints'
import { SpokenWords } from './SpokenWords'
import { LessonSlides, type LessonSlide } from './LessonSlides'
import { useScriptControls } from './scriptControls'
import styles from './AdditionFlow.module.css'
import countingStyles from './CountingLesson.module.css'
import {
  countingGiveCount,
  countingPages,
  countingStorageKey,
  countingWords,
  restoreCountingPage,
  type CountingPage,
} from './countingFlowState'

// 1列に並べたおはじき。台本の並べる・数えるページのステージと、準備の画面の図に使う
export function CountingLine({ n }: { n: number }) {
  return (
    <div
      className={countingStyles.line}
      role="img"
      aria-label={`おはじきが${n}こ、1列に並んでいます`}
    >
      {Array.from({ length: n }, (_, i) => (
        <span key={i} aria-hidden="true" />
      ))}
    </div>
  )
}

// 数える数は準備の画面で選ぶ。台本の中では変えない
export function CountingFlow({ n }: { n: number }) {
  const { toPrepare } = useScriptControls()
  const location = useLocation()
  const storageKey = countingStorageKey(location.pathname)
  const [page, setPage] = useState<CountingPage>(() => {
    try {
      return restoreCountingPage(sessionStorage.getItem(storageKey), n)
    } catch {
      return 'read'
    }
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ n, page }))
    } catch {
      // 保存できなくても、この画面で学習を続けられる。
    }
  }, [n, page, storageKey])
  const index = countingPages.indexOf(page)
  const line = <CountingLine n={n} />
  const give = countingGiveCount(n)
  // 各ページ：上のステージに見るもの、下に見出し → セリフ → 教え方のポイント
  const slides: Record<CountingPage, LessonSlide> = {
    read: {
      id: 'read',
      title: '何こあるか、数えてみましょう',
      stage: line,
      content: (
        <>
          <SpokenWords>{countingWords.read}</SpokenWords>
          <TeachingPoints
            folded
            note={`おはじき・ブロック・お菓子など、身近なものを**${n}個**用意して、お子さんの前に置きましょう。\n\n数える数は、準備の画面で変えられます。はじめは**5個まで**がおすすめです。`}
          />
        </>
      ),
    },
    line: {
      id: 'line',
      title: '1列に並べましょう',
      stage: line,
      content: (
        <>
          <SpokenWords>{countingWords.line}</SpokenWords>
          <TeachingPoints
            folded
            note={
              'ばらばらのままだと、どれを数えたか分からなくなります。**横1列に、少し間をあけて**並べましょう。\n\nお子さんに並べてもらうと、1個ずつ触るきっかけになります。'
            }
          />
        </>
      ),
    },
    count: {
      id: 'count',
      title: '1こずつ指さして数えましょう',
      stage: line,
      content: (
        <>
          <SpokenWords>{countingWords.count}</SpokenWords>
          <TeachingPoints
            folded
            note={
              'お子さんが**1個ずつ指でさしながら**、声に出して数えます。親は一緒に数えず、見守りましょう。\n\n数えたものは、**1個ずつ手前（お子さんの側）へずらして**もらいます。数えたものとまだのものが分かれるので、2回数えたり飛ばしたりせずに、最後まで数えられます。'
            }
          />
        </>
      ),
    },
    answer: {
      id: 'answer',
      title: '全部で何こだったかな？',
      content: (
        <div className={styles.answer}>
          <SpokenWords>{countingWords.answer}</SpokenWords>
          <SpokenWords title="答えたら">{countingWords.confirm}</SpokenWords>
          <TeachingPoints
            folded
            note={
              '数え終わったら、何個だったかを聞きます。\n\nお子さんが答えたら、**最後に言った数が、全部の数**になることを一緒に確かめましょう。'
            }
          />
        </div>
      ),
    },
    // ここから「たしかめ」。数え方が身についたかを、向きを変えて数える・言われた数だけ取る、で確かめる
    recount: {
      id: 'recount',
      section: 'たしかめ',
      title: '反対のはしから数えてみましょう',
      stage: line,
      content: (
        <div className={styles.answer}>
          <SpokenWords>{countingWords.recount}</SpokenWords>
          <SpokenWords title="同じ数になったら">
            {countingWords.recountSame}
          </SpokenWords>
          <SpokenWords title="ちがう数になったら" minor>
            {countingWords.recountDifferent}
          </SpokenWords>
          <TeachingPoints
            folded
            note={
              '手前にずらしたものを、**もう一度1列に戻して**から数えます。\n\n数える向きを変えても、**全部の数は変わらない**ことが分かっているかを見ます。同じ数を答えられたら、数え方が身についています。'
            }
          />
        </div>
      ),
    },
    give: {
      id: 'give',
      section: 'たしかめ',
      title: `${give}こ取ってもらいましょう`,
      stage: line,
      content: (
        <div className={styles.answer}>
          <SpokenWords>{countingWords.give(give)}</SpokenWords>
          <SpokenWords title="渡してくれたら">
            {countingWords.given}
          </SpokenWords>
          <TeachingPoints
            folded
            note={`お子さんが**数えながら1個ずつ**取り、**${give}個で止められるか**を見ます。\n\n全部渡してしまったり、数えずにつかんだりしたときは、まだ「最後に言った数が、全部の数」がつかめていないかもしれません。今日はここまでにして、次は**1列に並べて数える**ところから、もう一度一緒にやりましょう。`}
          />
          {/* 終わると準備の画面へ戻る。次に台本を開くと、最初のページから */}
          <button className={styles.finish} type="button" onClick={toPrepare}>
            終わる
          </button>
        </div>
      ),
    },
  }
  return (
    <LessonSlides
      label="数える台本"
      slides={countingPages.map((id) => slides[id])}
      currentId={page}
      totalKnown
      canNext={page !== 'give'}
      onNext={() => setPage(countingPages[index + 1] ?? page)}
      onBack={() => setPage(countingPages[index - 1] ?? page)}
    />
  )
}
