import { units, type UnitId } from './units'
import { ArithmeticLesson } from '../../components/ArithmeticLesson'

// units.ts の単元から、問題（タイトルと画面）を作る
export function lesson(id: UnitId) {
  const unit = units.find((unit) => unit.id === id)
  if (!unit) throw new Error(`Unknown unit: ${id}`)
  const { mode, initial } = unit.arithmetic
  function Arithmetic() {
    return (
      <ArithmeticLesson
        mode={mode}
        initial={initial}
        additionFlow={id === 'addition-within-10'}
      />
    )
  }
  return { title: unit.title, default: Arithmetic }
}
