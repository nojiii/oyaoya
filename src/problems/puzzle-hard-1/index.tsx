// 大学祭の謎解き（難しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import {
  TeachingScript,
  type FlowStatus,
} from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import styles from './puzzle-hard-1.module.css'

// 問題文。台本の最初のページと、準備画面の「声かけを先に読んでおく」の両方で使う
const QUESTION = [
  '4人の囚人が、図のように立たされています。AさんとBさんの間には壁があり、4人とも壁のほうを向いています。壁の向こうは見えません。',
  '看守が言いました。「4人の頭に帽子をかぶせた。黒が2つ、白が2つだ。だれか1人でも自分の帽子の色を当てられたら、全員を自由にしてやろう。ただし、帽子を脱いで見たり、後ろを振り向いたりしてはいけない」',
  'しばらくして1人が正しい色を答え、4人とも自由になりました。答えたのは、だれでしょう？',
]

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  see: 'それぞれの人から、だれの帽子が見えるかな？ 1人ずつ指でさして考えてみよう。',
  suppose:
    'いちばん後ろのDさんには、BさんとCさんの帽子が見えるね。もし2人とも黒だったら、Dさんの帽子は何色かな？',
  silent:
    'でも本当は、Bさんが白で、Cさんが黒。これだと、Dさんは自分の色がわかるかな？',
  notice:
    'Dさんは、ずっとだまったままだね。それを聞いたCさんは、何に気づくかな？',
  ask: '答えたのは、だれかな？',
  right: 'そう！ Cさんが「黒」と答えたんだね！',
  wrong:
    'おしい！ Dさんがだまっていたことから、Cさんが何に気づいたか、もう一度考えてみよう。',
  explain: 'どうしてCさんには、自分の色がわかったの？ おしえてくれる？',
  check:
    'こんどは、BさんとCさんが2人とも白だったら、だれが答えるかな？ ひとりで考えてみよう。',
  alone: 'そのとおり！ Dさんがすぐに「黒」と答えられるね！',
}

// 図に出す4人。壁の左にAさん、右にBさん・Cさん・Dさんが壁に近い順に並ぶ
const people = ['A', 'B', 'C', 'D'] as const
type Person = (typeof people)[number]
// unknown は、その人にはまだわからない色（「？」の帽子）
type Hat = 'black' | 'white' | 'unknown'
type Hats = Record<Person, Hat>

// 問題の帽子。黒が2つ、白が2つ
const HATS: Hats = { A: 'black', B: 'white', C: 'black', D: 'white' }
// たしかめで使う帽子。BさんとCさんが白なら、残りの2人が黒
const CHECK_HATS: Hats = { A: 'black', B: 'white', C: 'white', D: 'black' }

// 台本のページ。左へスワイプで次、右へで前。explain・check が「たしかめ」
const pages = [
  'read',
  'see',
  'suppose',
  'silent',
  'notice',
  'answer',
  'explain',
  'check',
] as const
type Page = (typeof pages)[number]

// 進み具合は、同じタブの中で保存する（準備の画面へ戻ると、台本の部品は作り直されるため）
const storageKey = (pathname: string) => `puzzle-hard-1-flow:v1:${pathname}`

function readPage(raw: string | null): Page | null {
  try {
    const saved = JSON.parse(raw ?? 'null') as { page?: string } | null
    return pages.find((page) => page === saved?.page) ?? null
  } catch {
    // 古い形式や壊れた保存内容は使わない
    return null
  }
}

// 準備の画面で、続きがあるかを決める。最後のページまで進んだら、終えたものとして扱う
function flowStatus(raw: string | null): FlowStatus {
  const page = readPage(raw)
  if (!page || page === 'read') return 'start'
  return page === 'check' ? 'finished' : 'middle'
}

const hatNames: Record<Hat, string> = {
  black: '黒',
  white: '白',
  unknown: 'わからない色',
}

// 4人の並び（x は人の中心）。壁より左を向くのが B・C・D、右を向くのが A
const positions: Record<Person, number> = { A: 48, B: 156, C: 228, D: 300 }

// ステージに置く図。dim の人は薄くして、いま考えている人から外す
function Prisoners({ hats, dim = [] }: { hats: Hats; dim?: Person[] }) {
  const label = `壁の左にAさん、右に壁に近い順にBさん・Cさん・Dさんが立ち、4人とも壁のほうを向いています。帽子は${people
    .map((person) => `${person}さんが${hatNames[hats[person]]}`)
    .join('、')}です`
  return (
    <svg
      className={styles.figure}
      viewBox="0 0 352 196"
      role="img"
      aria-label={label}
    >
      <text className={styles.wallName} x="98" y="30">
        壁
      </text>
      <rect
        className={styles.wall}
        x="92"
        y="40"
        width="12"
        height="140"
        rx="3"
      />
      {people.map((person) => {
        const x = positions[person]
        const hat = hats[person]
        // 向いているほうに目を置く
        const eye = person === 'A' ? x + 9 : x - 9
        return (
          <g
            key={person}
            className={dim.includes(person) ? styles.dim : undefined}
          >
            <rect
              className={styles.body}
              x={x - 22}
              y="120"
              width="44"
              height="52"
              rx="18"
            />
            <circle className={styles.head} cx={x} cy="98" r="20" />
            <circle className={styles.eye} cx={eye} cy="98" r="2.6" />
            <g className={styles.hat} data-hat={hat}>
              <rect x={x - 15} y="52" width="30" height="26" rx="5" />
              <rect x={x - 24} y="74" width="48" height="7" rx="3.5" />
            </g>
            {hat === 'unknown' && (
              <text className={styles.unknown} x={x} y="72">
                ？
              </text>
            )}
            <text className={styles.name} x={x} y="192">
              {person}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ステージに置く答え。お子さんが答えてから「？」を押して、答えを見る
function Answer({
  label,
  answer,
  visible,
  onReveal,
}: {
  label: string
  answer: string
  visible: boolean
  onReveal: () => void
}) {
  // 「？」を押すとボタンが消えるので、答えの出た行へフォーカスを移す
  const line = useRef<HTMLParagraphElement>(null)
  const wasVisible = useRef(visible)
  useEffect(() => {
    if (visible && !wasVisible.current)
      line.current?.focus({ preventScroll: true })
    wasVisible.current = visible
  }, [visible])
  return (
    <>
      <p
        className={`${flowStyles.equation} ${styles.equation}`}
        aria-live="polite"
        ref={line}
        tabIndex={-1}
      >
        {label}{' '}
        {visible ? (
          <em>{answer}</em>
        ) : (
          <button
            className={flowStyles.reveal}
            type="button"
            aria-label="答えを見る"
            onClick={onReveal}
          >
            ？
          </button>
        )}
      </p>
      {!visible && (
        <p className={flowStyles.revealHint}>
          お子さんが答えたら、「？」をタップ
        </p>
      )}
    </>
  )
}

function PuzzleHardFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const key = storageKey(useLocation().pathname)
  const [page, setPage] = useState<Page>(() => {
    try {
      const saved = readPage(sessionStorage.getItem(key))
      // 最後のページまで終えたあとは、最初から
      if (saved && saved !== 'check') return saved
    } catch {
      // 読めないときは、最初から
    }
    return 'read'
  })
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ page }))
    } catch {
      // 保存できなくても、この画面で学習を続けられる
    }
  }, [key, page])
  // 「？」で答えを見たか。ページを送ると、見る前に戻す
  const [revealed, setRevealed] = useState(false)
  const index = pages.indexOf(page)
  const go = (next: Page | undefined) => {
    if (!next) return
    setPage(next)
    setRevealed(false)
  }
  // 答えを見るまでは進めない。最後のページから先はない
  const canNext = page === 'answer' ? revealed : page !== 'check'

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んで、図をよく見てみましょう',
      stage: <Prisoners hats={HATS} />,
      content: (
        <>
          <TeachingPoints note="下の問題を、お子さんと**一緒に読みましょう**。" />
          <div className={styles.question}>
            {QUESTION.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </>
      ),
    },
    see: {
      id: 'see',
      title: 'だれに、だれの帽子が見えるか確かめましょう',
      stage: <Prisoners hats={HATS} />,
      content: (
        <>
          <SpokenWords>{words.see}</SpokenWords>
          <TeachingPoints
            folded
            note={
              'AさんとBさんは壁しか見えず、**だれの帽子も見えません**。Cさんには Bさん、Dさんには BさんとCさんの帽子が見えます。\n\nここを最初に整理しておくと、あとで「その人の気持ち」になって考えやすくなります。'
            }
          />
        </>
      ),
    },
    // ここからは、いちばん多く見えるDさんから順に考える
    suppose: {
      id: 'suppose',
      title: 'いちばん後ろのDさんになって考えましょう',
      stage: (
        <Prisoners
          hats={{ A: 'unknown', B: 'black', C: 'black', D: 'unknown' }}
          dim={['A']}
        />
      ),
      content: (
        <>
          <SpokenWords>{words.suppose}</SpokenWords>
          <TeachingPoints
            folded
            note={
              '黒は2つしかないので、BさんとCさんが2人とも黒なら、Dさんは**すぐに「白」と答えられます**。\n\nまずは「もし〜だったら」と、答えが出る場合を考えてもらいます。'
            }
          />
        </>
      ),
    },
    silent: {
      id: 'silent',
      title: '本当の帽子で、Dさんを考えましょう',
      stage: <Prisoners hats={{ ...HATS, D: 'unknown' }} dim={['A']} />,
      content: (
        <>
          <SpokenWords>{words.silent}</SpokenWords>
          <TeachingPoints
            folded
            note={
              'BさんとCさんの色がちがうと、Dさんの帽子は黒でも白でもありえるので、**Dさんには答えられません**。\n\nだから、Dさんはだまったままになります。'
            }
          />
        </>
      ),
    },
    notice: {
      id: 'notice',
      title: 'Cさんの気持ちになって考えましょう',
      stage: <Prisoners hats={{ ...HATS, C: 'unknown' }} dim={['A']} />,
      content: (
        <>
          <SpokenWords>{words.notice}</SpokenWords>
          <TeachingPoints
            folded
            note={
              'Dさんがだまっているのは、**BさんとCさんの色がちがうから**です。Cさんにはそれがわかります。\n\nCさんにはBさんの白い帽子が見えるので、自分は黒だとわかります。「だまっていること」も手がかりになるのが、この問題のポイントです。'
            }
          />
        </>
      ),
    },
    // 答えのページ：答えは先に言わず、お子さんが答えてから「？」で見る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: (
        <>
          <Prisoners hats={HATS} />
          <Answer
            label="答えたのは"
            answer="Cさん"
            visible={revealed}
            onReveal={() => setRevealed(true)}
          />
        </>
      ),
      content: (
        <div className={flowStyles.answer} aria-live="polite">
          {revealed ? (
            <>
              <SpokenWords title="「Cさん」と答えたら">
                {words.right}
              </SpokenWords>
              <SpokenWords title="ちがう人を答えたら" minor>
                {words.wrong}
              </SpokenWords>
              <TeachingPoints
                folded
                note={
                  'ちがう人を答えたときは、前のページに戻って、Dさんがだまっている理由をもう一度考えます。\n\n**Dさんがだまっていること**を、Cさんが手がかりにしたと気づけているかを見ましょう。'
                }
              />
            </>
          ) : (
            <>
              <SpokenWords>{words.ask}</SpokenWords>
              <TeachingPoints
                folded
                note="お子さんが答えてから、「？」を押して確かめましょう。**答えを先に言わない**ようにします。"
              />
            </>
          )}
        </div>
      ),
    },
    // ここから「たしかめ」。答えが合ったかだけでなく、考え方が身についたかを確かめる
    explain: {
      id: 'explain',
      section: 'たしかめ',
      title: 'どうしてわかったのか、聞いてみましょう',
      stage: <Prisoners hats={HATS} />,
      content: (
        <>
          <SpokenWords>{words.explain}</SpokenWords>
          <TeachingPoints
            folded
            note={
              '**「Dさんがだまっていた」→「BさんとCさんは色がちがう」→「Bさんが白だから、Cさんは黒」**の順に、お子さんが自分の言葉で話せるかを見ます。\n\n途中までしか言えなくても大丈夫です。言えたところをほめて、続きを一緒に考えましょう。'
            }
          />
        </>
      ),
    },
    // 最後のページ：「終わる」で準備の画面へ戻る
    check: {
      id: 'check',
      section: 'たしかめ',
      title: 'ひとりで考えてみましょう',
      stage: (
        <>
          <Prisoners hats={CHECK_HATS} />
          <Answer
            label="答えるのは"
            answer="Dさん"
            visible={revealed}
            onReveal={() => setRevealed(true)}
          />
        </>
      ),
      content: (
        <>
          <div className={flowStyles.answer} aria-live="polite">
            {revealed ? (
              <SpokenWords title="「Dさん」と答えたら">
                {words.alone}
              </SpokenWords>
            ) : (
              <SpokenWords>{words.check}</SpokenWords>
            )}
            <TeachingPoints
              folded
              note={
                '親は手を出さず、**見守りましょう**。BさんとCさんが同じ色なら、Dさんはすぐに答えられます。\n\nいちばん多く見えるDさんから順に考えられていれば、解けています。'
              }
            />
          </div>
          {revealed && (
            <button
              className={flowStyles.finish}
              type="button"
              onClick={finish}
            >
              終わる
            </button>
          )}
        </>
      ),
    },
  }

  return (
    <LessonSlides
      label="謎解き 難しい 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={canNext}
      onNext={() => go(pages[index + 1])}
      onBack={() => go(pages[index - 1])}
    />
  )
}

export default function PuzzleHard1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<PuzzleHardFlow />}
      flowStatus={() =>
        flowStatus(sessionStorage.getItem(storageKey(location.pathname)))
      }
      // 準備の画面のステージに大きく出す図
      picture={<Prisoners hats={HATS} />}
      prepare={{
        goal: '見えている帽子と「だまっている人」から、答えた人を考えます。',
        materials: ['問題の図（この画面）'],
        point:
          'だれに何が見えているかを1人ずつ確かめ、その人の気持ちになって考えます。答えを言いたくなっても、お子さんが考えるのを待ちましょう。',
        avoid: [
          '先に「Cさんだよ」と答えを言う',
          '4人をいっぺんに考えさせる（いちばん後ろのDさんから順に考える）',
        ],
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION.join('') }}
      turns={[
        { say: words.see },
        { say: words.suppose },
        { say: words.silent },
        { say: words.notice },
        { say: words.ask },
        { say: `（答えたら）${words.right}` },
        { say: `（たしかめ）${words.explain}` },
        { say: `（たしかめ）${words.check}` },
      ]}
    />
  )
}
