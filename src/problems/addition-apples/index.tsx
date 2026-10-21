import { ArithmeticLesson } from '../../components/ArithmeticLesson'

export const title = 'あわせていくつ'

export default function AdditionApples() {
  return <ArithmeticLesson mode="add" initial={[3, 2]} apples />
}
