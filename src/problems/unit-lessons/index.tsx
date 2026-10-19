import { QuestionVisual } from './QuestionVisual'
import { TeachingScript } from '../../components/TeachingScript'
import units from './units.json'
import { ArithmeticLesson } from '../../components/ArithmeticLesson'
import type { ArithmeticMode } from '../arithmetic'
import { teaching } from './teaching'
import { LessonVisual } from '../../components/LessonVisual'

const arithmeticUnits: Record<
  string,
  { mode: ArithmeticMode; initial: [number, number] }
> = {
  add: { mode: 'add', initial: [3, 4] },
  sub: { mode: 'sub', initial: [8, 3] },
  borrow: { mode: 'borrow', initial: [13, 5] },
  times: { mode: 'times', initial: [2, 3] },
}

export function lesson(id: string) {
  const unit = units.find((unit) => unit.id === id)
  if (!unit) throw new Error(`Unknown unit: ${id}`)
  const question =
    id === 'time' ? '1時間は60分だね。30分は1時間のどれくらいかな？' : unit.q
  const answer = id === 'time' ? '1時間の半分' : unit.a
  function Lesson() {
    const settings = arithmeticUnits[id]
    if (settings) return <ArithmeticLesson {...settings} />
    return (
      <TeachingScript
        renderVisual={(step) => (
          <LessonVisual
            unitId={id}
            problem={
              id === 'numbers' ? { mode: 'count', a: 5, b: 0 } : undefined
            }
            step={step}
          />
        )}
        counters={id === 'numbers' ? { mode: 'count', a: 5, b: 0 } : undefined}
        prepare={{
          goal: unit!.learn,
          materials: [
            '紙と鉛筆',
            'おはじきやブロック（数の学習）',
            '時計・定規（取り組む単元に合わせて）',
          ],
          point: unit!.parent,
          avoid: [
            '答えを先に教える',
            '一度に全部説明する',
            '「なんでわからないの？」と言う',
          ],
        }}
        question={{
          say: question,
          show: (
            <>
              <QuestionVisual id={id} />
              <p>{question}</p>
            </>
          ),
          expect: answer,
          how: '問題の文をゆっくり読み、数えるものや見る場所を指さして伝えます。',
          why: '何について考える問題なのかを、最初にはっきりさせます。',
          avoid: [
            `最初に「答えは${answer}だよ」と言ってしまう`,
            '読み終える前に答えを急かす',
          ],
          praise: '答えられたね。どう考えたかも教えてね。',
        }}
        turns={teaching[id] ?? []}
        check={[
          {
            say: 'どうやって答えを見つけたか、教えてくれる？',
            expect: '今の手順を、言葉や実物を使って説明できる',
            stuck: [
              {
                say: '最初に何をしたかな？ 使ったものを指さしながら教えてね。',
              },
            ],
            praise: '考え方を教えてくれてありがとう！',
          },
        ]}
      />
    )
  }
  return { title: unit.title, default: Lesson }
}
