// 大学祭の謎解き（易しい）第1問。台本の書き方は src/problems/sample にそろえる
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { TeachingScript } from '../../components/TeachingScript'
import { LessonSlides, type LessonSlide } from '../../components/LessonSlides'
import { SpokenWords } from '../../components/SpokenWords'
import { TeachingPoints } from '../../components/TeachingPoints'
import { pagedFlow } from '../../components/pagedFlow'
import { useScriptControls } from '../../components/scriptControls'
import flowStyles from '../../components/AdditionFlow.module.css'
import styles from './puzzle-easy-1.module.css'

// 問題文。台本の最初のページと、準備画面の「声かけを先に読んでおく」の両方で使う
const QUESTION = [
  '3つの箱に、「あめ」「チョコ」「あめとチョコ」の札がはってあります。箱の中身は、あめだけ・チョコだけ・あめとチョコがまざったもの、が1箱ずつです。',
  'ところが、札は3つとも、まちがった箱にはってあります。',
  '中を見ないで、どれか1つの箱から、お菓子を1こだけ取り出せます。3つの箱の中身をかならずぜんぶ当てるには、どの箱から取り出せばいいでしょう？',
]

// 子どもに読み上げるセリフ。台本のページと準備画面の「声かけを先に読んでおく」の両方で使う
const words = {
  labels:
    '札はぜんぶまちがっているよ。「あめ」の札の箱には、何が入っているかな？',
  tryCandy:
    '「あめ」の札の箱から1こ取ったら、チョコが出てきたよ。この箱の中身は、これでわかるかな？',
  mixed:
    'じゃあ、「あめとチョコ」の札の箱には、何が入っているかな？ 1こ取り出したら、どうなる？',
  ask: 'どの箱から取り出せばいいかな？',
  right:
    'そう！ 「あめとチョコ」の札の箱なら、1こ見るだけで、その箱の中身がかならずわかるね！',
  wrong:
    'おしい！ その箱だと、出てくるお菓子によっては、中身が2通り残ってしまうよ。もう一度、札がまちがっていることから考えてみよう。',
  explain: 'どうしてその箱にしたの？ おしえてくれる？',
  check:
    '「あめとチョコ」の札の箱から、あめが出てきたよ。ほかの2つの箱の中身もわかるかな？ ひとりでやってみよう。',
  alone: 'ひとりでできたね！ 3つとも中身がわかったね！',
}

// 箱の札。図では左から、この順に並べる
const LABELS = ['あめ', 'チョコ', 'あめとチョコ'] as const
// たしかめで、「あめとチョコ」の札の箱からあめが出たときの中身（札と同じ順）
const CHECK_CONTENTS = ['チョコだけ', 'まざったもの', 'あめだけ']

// 台本のページ。左へスワイプで次、右へで前。explain・check が「たしかめ」
const pages = [
  'read',
  'labels',
  'try',
  'mixed',
  'answer',
  'explain',
  'check',
] as const
type Page = (typeof pages)[number]

const flow = pagedFlow('puzzle-easy-1', pages)

// ステージに置く3つの箱。picked の箱を橙にし、notes があれば箱の下に書く（null は空ける）
function Boxes({
  picked,
  notes,
}: {
  picked?: number
  notes?: (string | null)[]
}) {
  const label = `3つの箱。札は左から${LABELS.map((label) => `「${label}」`).join('')}${
    picked === undefined ? '' : `。「${LABELS[picked]}」の札の箱を選んでいます`
  }${
    notes
      ? `。${LABELS.map((label, i) =>
          notes[i] ? `「${label}」の札の箱：${notes[i]}` : '',
        )
          .filter(Boolean)
          .join('、')}`
      : ''
  }`
  return (
    <div className={styles.boxes} role="img" aria-label={label}>
      {LABELS.map((label, i) => (
        <div key={label} className={styles.item}>
          <div className={styles.box} data-picked={picked === i || undefined}>
            <span className={styles.label}>
              {/* 「あめと／チョコ」のように、言葉の切れ目でだけ折り返す */}
              {label.split(/(?<=と)/).map((phrase) => (
                <span key={phrase}>{phrase}</span>
              ))}
            </span>
          </div>
          {notes && <span className={styles.note}>{notes[i]}</span>}
        </div>
      ))}
    </div>
  )
}

// お子さんが答えてから押す「？」と、その案内
function RevealButton({ onReveal }: { onReveal: () => void }) {
  return (
    <>
      {/* ボタンは答えの行より大きくして、押しやすくする */}
      <p className={flowStyles.equation}>
        <button
          className={flowStyles.reveal}
          type="button"
          aria-label="答えを見る"
          onClick={onReveal}
        >
          ？
        </button>
      </p>
      <p className={flowStyles.revealHint}>
        お子さんが答えたら、「？」をタップ
      </p>
    </>
  )
}

// ステージに置く答え。「？」を押すと、箱の図と答えの行が出る
function Answer({
  visible,
  onReveal,
}: {
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
      <Boxes picked={visible ? 2 : undefined} />
      {visible ? (
        <p
          className={`${flowStyles.equation} ${styles.equation}`}
          aria-live="polite"
          ref={line}
          tabIndex={-1}
        >
          <em>あめとチョコ</em>の札の箱
        </p>
      ) : (
        <RevealButton onReveal={onReveal} />
      )}
    </>
  )
}

// たしかめのステージ。「？」を押すと、残りの2つの箱の中身が出る
function CheckContents({
  visible,
  onReveal,
}: {
  visible: boolean
  onReveal: () => void
}) {
  const figure = useRef<HTMLDivElement>(null)
  const wasVisible = useRef(visible)
  useEffect(() => {
    if (visible && !wasVisible.current)
      figure.current?.focus({ preventScroll: true })
    wasVisible.current = visible
  }, [visible])
  return (
    <>
      <div
        className={styles.reveal}
        aria-live="polite"
        ref={figure}
        tabIndex={-1}
      >
        <Boxes
          picked={2}
          notes={visible ? CHECK_CONTENTS : ['？', '？', 'あめだけ']}
        />
      </div>
      {!visible && <RevealButton onReveal={onReveal} />}
    </>
  )
}

function PuzzleEasyFlow() {
  // 最後のページの「終わる」で、準備の画面へ戻る
  const { finish } = useScriptControls()
  const { page, revealed, reveal, next, back } = flow.usePages()
  // 答えを見るまでは進めない。最後のページから先はない
  const canNext = page === 'answer' ? revealed : page !== 'check'

  const slides: Record<Page, LessonSlide> = {
    read: {
      id: 'read',
      title: 'まずは問題を読んで、箱をよく見てみましょう',
      stage: <Boxes />,
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
    labels: {
      id: 'labels',
      title: '札がまちがっていることを確かめましょう',
      stage: <Boxes picked={0} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '札がまちがっているので、「あめ」の札の箱は**あめだけではありません**。チョコだけか、まざったもののどちらかです。\n\n「中身は、札とはちがう」ことを、お子さんの言葉で言ってもらいましょう。'
            }
          />
          <SpokenWords>{words.labels}</SpokenWords>
        </>
      ),
    },
    try: {
      id: 'try',
      title: '「あめ」の札の箱から取り出してみましょう',
      stage: <Boxes picked={0} notes={['チョコが出た', null, null]} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              'チョコが出ると、チョコだけの箱か、まざったものの箱か、**まだ2通り残ります**。あめが出れば決まりますが、**いつも決まるとはかぎりません**。「チョコ」の札の箱も同じです。\n\nお子さんが「あめが出ればわかる」と気づいたら、ほめましょう。そのうえで「どっちが出ても、かならずわかる箱はどれかな？」と聞きます。'
            }
          />
          <SpokenWords>{words.tryCandy}</SpokenWords>
        </>
      ),
    },
    mixed: {
      id: 'mixed',
      title: '「あめとチョコ」の札の箱を考えましょう',
      stage: <Boxes picked={2} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '札がまちがっているので、この箱は**まざっていません**。あめだけか、チョコだけのどちらかです。\n\nだから、1こ取り出せば、出てきたお菓子だけが入った箱だとわかります。残りの2つの箱もそこから決まりますが、それはたしかめで、ひとりでやってもらいます。'
            }
          />
          <SpokenWords>{words.mixed}</SpokenWords>
        </>
      ),
    },
    // 答えのページ：答えは先に言わず、お子さんが答えてから「？」で見る
    answer: {
      id: 'answer',
      title: '答えを確認しましょう！',
      stage: <Answer visible={revealed} onReveal={reveal} />,
      content: (
        <div className={flowStyles.answer} aria-live="polite">
          {revealed ? (
            <>
              <TeachingPoints
                collapsible
                note={
                  'ちがう箱を答えたときは、前のページに戻って、その箱から取り出したらどうなるかを一緒に確かめます。\n\n**1こで中身が決まる箱はどれか**、という見方ができているかを見ましょう。'
                }
              />
              <SpokenWords title="「あめとチョコ」の札の箱と答えたら">
                {words.right}
              </SpokenWords>
              <SpokenWords title="ちがう箱を答えたら" minor>
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
      title: 'どうしてその箱にしたのか、聞いてみましょう',
      stage: <Boxes picked={2} />,
      content: (
        <>
          <TeachingPoints
            collapsible
            note={
              '**「札がまちがい」→「この箱はまざっていない」→「1こで中身がわかる」→「残りの2つも、札がまちがいなことから決まる」**の順に、お子さんが自分の言葉で話せるかを見ます。\n\n途中までしか言えなくても大丈夫です。言えたところをほめて、続きを一緒に考えましょう。'
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
      title: 'ひとりで残りの箱を当ててみましょう',
      stage: <CheckContents visible={revealed} onReveal={reveal} />,
      content: (
        <>
          <div className={flowStyles.answer} aria-live="polite">
            <TeachingPoints
              collapsible
              note={
                '親は手を出さず、**見守りましょう**。「チョコ」の札の箱はチョコだけではないので、まざったもの。残りの「あめ」の札の箱が、チョコだけです。\n\n札がまちがっていることを使って、順に決められていれば、解けています。'
              }
            />
            {revealed ? (
              <SpokenWords title="3つとも当てられたら">
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
      label="謎解き 易しい 第1問の台本"
      slides={pages.map((page) => slides[page])}
      currentId={page}
      totalKnown
      canNext={canNext}
      onNext={next}
      onBack={back}
    />
  )
}

export default function PuzzleEasy1() {
  const location = useLocation()
  return (
    <TeachingScript
      flow={<PuzzleEasyFlow />}
      flowStatus={() => flow.status(location.pathname)}
      // 準備の画面のステージに大きく出す図
      picture={<Boxes />}
      prepare={{
        goal: '札がぜんぶまちがいなことを使って、取り出す箱を決めます。',
        materials: ['問題の図（この画面）'],
        point:
          '「中身は、札とはちがう」と、箱を1つずつ言葉にして確かめます。答えを言いたくなっても、お子さんが考えるのを待ちましょう。',
        avoid: [
          '先に「『あめとチョコ』の札の箱だよ」と答えを言う',
          'なんとなく選んだ箱で、理由を聞かずに先へ進む',
        ],
      }}
      // 「声かけを先に読んでおく」に出す。台本のページと同じ words を使う
      question={{ say: QUESTION.join('') }}
      turns={[
        { say: words.labels },
        { say: words.tryCandy },
        { say: words.mixed },
        { say: words.ask },
        { say: `（答えたら）${words.right}` },
        { say: `（たしかめ）${words.explain}` },
        { say: `（たしかめ）${words.check}` },
      ]}
    />
  )
}
