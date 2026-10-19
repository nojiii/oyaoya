import { ArithmeticLesson } from '../../components/ArithmeticLesson'

export const title = 'くり上がりのたしざん'

export default function AdditionCarry() {
  return <ArithmeticLesson mode="carry" initial={[8, 7]} />
}
