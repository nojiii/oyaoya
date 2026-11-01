// 大学祭の謎解き 第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import styles from './puzzle-hard-1.module.css'
import { PrisonersFigure } from './PrisonersFigure'
import { PrisonersFigure as PrisonersFigure2 } from './PrisonersFigure2'

// 問題文。台本の最初のページと、準備画面の「声かけを先に読んでおく」の両方で使う
const QUESTION = [
  '4人の囚人が、図のように帽子をかぶり立っています。AさんとBさんの間には壁があり、全員が壁のほうを向いています。壁の向こうは見えません。',
  '看守が言いました。「4人の頭に帽子をかぶせた。黒が2つ、白が2つだ。だれか1人でも自分の帽子の色を当てられたら、全員を自由にしてやろう。ただし、回答するチャンスは全員で1回で、帽子を脱いで見たり、後ろを振り向いたりしてはいけない」',
  'しばらくして1人が、自分の帽子の色を答え、4人とも自由になりました。答えたのは、だれでしょう？',
]

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  see: 'それぞれの人から、だれの帽子が見えるかな？ 1人ずつ指でさして考えてみよう。',
  suppose:
    'いちばん後ろのAさんには、BさんとCさんの帽子が見えるね。もし2人とも白だったら、Aさんの帽子は何色かな？',
  silent:
    'でも本当は、Bさんが白で、Cさんが黒。これだと、Aさんは自分の色がわかるかな？',
  // Cさんの考えは、「もしも」と「気づく」の2ページに分ける
  suppose2:
    'こんどはBさんになって考えよう。Bさんには、Cさんの黒い帽子が見えるね。もし自分も黒だったら、Aさんはどうしたかな？',
  notice:
    'でも、Aさんはなにも言わないね。それに気づいたBさんは、自分の帽子が何色だとわかるかな？',
  ask: '自分の色がはっきりわかって答えたのは、だれかな？',
  right: 'そう！ Cさんが「黒」と答えたんだね！',
  wrong:
    'おしい！ Aさんがだまっていたことから、Cさんが何に気づいたか、もう一度考えてみよう。',
  explain: 'どうしてCさんには、自分の色がわかったの？ おしえてくれる？',
  check:
    'こんどは、Bさんが黒で、Cさんが白。だれが、どうやって自分の色に気づくかな？ ひとりで考えてみよう。',
  alone:
    'そのとおり！ Dさんがだまっているから、Cさんは自分が「白」だとわかるね！',
}

// 台本のページ。左へスワイプで次、右へで前。explain・check が「たしかめ」
const pages = [
  'read',
  'see',
  'suppose',
  'silent',
  'suppose2',
  'notice',
  'answer',
  'explain',
  'check',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('puzzle-hard-1', pages)

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
      {/* 答えを見たあとも場所は残し、ステージの高さ（下の文字の位置）を変えない */}
      <p className={`${flowStyles.revealHint} ${visible ? styles.hidden : ''}`}>
        お子さんが答えたら、「？」をタップ
      </p>
    </>
  )
}

function PuzzleHardFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, revealed, reveal, next, back } = flow.usePages()
  // 答えを見るまでは進めない。最後のページから先はない
  const canNext = page === 'answer' ? revealed : page !== 'check'

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んで、図をよく見てみましょう',
      stage: <PrisonersFigure />,
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
      stage: <PrisonersFigure />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '最初に誰がどの帽子を見えているか情報を整理しましょう。\n見えている帽子の色はAがB、 BがBとC、 CとDは誰も見えなくなっているはずです。'
            }
          />
          <SpokenWords>{words.see}</SpokenWords>
        </>
      ),
    },
    // ここからは、いちばん多く見えるDさんから順に考える
    suppose: {
      id: 'suppose',
      title: 'もしも、BさんとCさんが2人とも白だったら',
      stage: <PrisonersFigure2 />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '白は2つしかないので、BさんとCさんが2人とも白なら、Aさんは**すぐに「黒」と答えられます**（逆も同じ）。\n\n図の帽子は「もしも」の色です。'
            }
          />
          <SpokenWords>{words.suppose}</SpokenWords>
        </>
      ),
    },
    silent: {
      id: 'silent',
      title: '本当の帽子で、Dさんを考えましょう',
      stage: <PrisonersFigure />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              'BさんとCさんの色がちがうと、Dさんの帽子は黒でも白でもありえるので、**Dさんには答えられません**。\n\nだから、Dさんはだまったままになります。'
            }
          />
          <SpokenWords>{words.silent}</SpokenWords>
        </>
      ),
    },
    // Cさんに見えるのはBさんだけなので、ほかの帽子は「？」にする
    suppose2: {
      id: 'suppose2',
      title: 'Cさんの気持ちになって考えましょう',
      stage: <PrisonersFigure />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              'さっきの「もしも」と同じで、BさんとCさんが2人とも黒なら、**Aさんはすぐに「白」と答えたはず**です。\n\n前のページに戻って、もう一度確かめてもかまいません。'
            }
          />
          <SpokenWords>{words.suppose2}</SpokenWords>
        </>
      ),
    },
    notice: {
      id: 'notice',
      title: 'Dさんがだまっていることに気づきましょう',
      stage: <PrisonersFigure />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '問題文には"しばらくして"と書いてあります。Aさんが答えられなくて困っているとわかるので、Bさんは**自分は黒ではない**、つまり白だとわかります。\n\n「だまっていること」も手がかりになるのが、この問題のポイントです。'
            }
          />
          <SpokenWords>{words.notice}</SpokenWords>
        </>
      ),
    },
    // 答えのページ：答えは先に言わず、お子さんが答えてから「？」で見る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: (
        <>
          <PrisonersFigure />
          <Answer
            label="答えたのは"
            answer="Bさん"
            visible={revealed}
            onReveal={reveal}
          />
        </>
      ),
      content: (
        <div className={flowStyles.answer} aria-live="polite">
          {revealed ? (
            <>
              <TeachingPoints
                collapsible
                note={
                  'ちがう人を答えたときは、前のページに戻って、Aさんがだまっている理由をもう一度考えます。\n\n**Aさんがだまっていること**を、Bさんが手がかりにしたと気づけているかを見ましょう。'
                }
              />
              <SpokenWords title="「Bさん」と答えたら">
                {words.right}
              </SpokenWords>
              <SpokenWords title="ちがう人を答えたら" minor>
                {words.wrong}
              </SpokenWords>
            </>
          ) : (
            <>
              <TeachingPoints
                collapsible
                note="お子さんが答えてから、「？」を押して確かめましょう。**答えを先に言わない**ようにします。"
              />
              <SpokenWords>{words.ask}</SpokenWords>
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
      stage: <PrisonersFigure />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '**「Bさんは白」→「自分も白なら、Dさんが『黒』と答えたはず」→「でもDさんはだまっている」→「だから自分は黒」**の順に、お子さんが自分の言葉で話せるかを見ます。\n\n途中までしか言えなくても大丈夫です。言えたところをほめて、続きを一緒に考えましょう。'
            }
          />
          <SpokenWords>{words.explain}</SpokenWords>
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
          <PrisonersFigure />
          <Answer
            label="答えるのは"
            answer="Cさん"
            visible={revealed}
            onReveal={reveal}
          />
        </>
      ),
      content: (
        <>
          <div className={flowStyles.answer} aria-live="polite">
            <TeachingPoints
              collapsible
              note={
                '親は手を出さず、**見守りましょう**。Dさんには黒と白が見えるので、だまったまま。Cさんは「自分が黒なら、Dさんが『白』と答えたはず」と考えて、自分は白だとわかります。\n\n答えは問題と同じCさんなので、**理由まで言えるか**を見ましょう。'
              }
            />
            {revealed ? (
              <SpokenWords title="「Cさん」と答えたら">
                {words.alone}
              </SpokenWords>
            ) : (
              <SpokenWords>{words.check}</SpokenWords>
            )}
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
      label="謎解き 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={canNext}
      onNext={next}
      onBack={back}
    />
  )
}

export default function PuzzleHard1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<PuzzleHardFlow />}
      flowStatus={() => flow.status(location.pathname)}
      // 準備の画面のステージに大きく出す図
      picture={<PrisonersFigure />}
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
        { say: words.suppose2 },
        { say: words.notice },
        { say: words.ask },
        { say: `（答えたら）${words.right}` },
        { say: `（たしかめ）${words.explain}` },
        { say: `（たしかめ）${words.check}` },
      ]}
    />
  )
}
