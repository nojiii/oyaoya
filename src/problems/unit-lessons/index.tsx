import { QuestionVisual } from './QuestionVisual'
import { TeachingScript } from '../../components/TeachingScript'
import { units, type UnitId } from './units'
import { ArithmeticLesson } from '../../components/ArithmeticLesson'
import { teaching, questionNotes } from './teaching'
import { LessonVisual } from '../../components/LessonVisual'

// units.ts の単元から、問題（タイトルと画面）を作る
export function lesson(id: UnitId) {
  const unit = units.find((unit) => unit.id === id)
  if (!unit) throw new Error(`Unknown unit: ${id}`)
  if ('arithmetic' in unit) {
    const { mode, initial } = unit.arithmetic
    function Arithmetic() {
      return (
        <ArithmeticLesson
          mode={mode}
          initial={initial}
          additionFlow={id === 'addition-basic'}
        />
      )
    }
    return { title: unit.title, default: Arithmetic }
  }
  const scripted = unit
  const counters =
    scripted.id === 'counting-to-10'
      ? ({ mode: 'count', a: 5, b: 0 } as const)
      : undefined
  function Lesson() {
    return (
      <TeachingScript
        renderVisual={(step) => (
          <LessonVisual unitId={scripted.id} problem={counters} step={step} />
        )}
        counters={counters}
        prepare={{
          goal: scripted.learn,
          materials: [
            '紙と鉛筆',
            'おはじきやブロック（数の学習）',
            '時計・定規（取り組む単元に合わせて）',
          ],
          point: scripted.parent,
          avoid: [
            '答えを先に教える',
            '一度に全部説明する',
            '「なんでわからないの？」と言う',
          ],
        }}
        question={{
          say: scripted.q,
          parentNote: questionNotes[scripted.id],
          show: (
            <>
              <QuestionVisual id={scripted.id} />
              <p>{scripted.q}</p>
            </>
          ),
          how: '問題の文をゆっくり読み、数えるものや見る場所を指さして伝えます。',
          why: '何について考える問題なのかを、最初にはっきりさせます。',
          avoid: [
            `最初に「答えは${scripted.a}だよ」と言ってしまう`,
            '読み終える前に答えを急かす',
          ],
        }}
        turns={teaching[scripted.id].map((turn, index) => ({
          ...turn,
          resourceHint:
            index === 0 && !counters
              ? '下の' +
                (scripted.id === 'clock-reading' ||
                scripted.id === 'time-duration'
                  ? '時計'
                  : scripted.id === 'length-compare'
                    ? '長さ'
                    : '図形') +
                'の図をタップすると、大きく表示できます。'
              : undefined,
        }))}
      />
    )
  }
  return { title: unit.title, default: Lesson }
}
