import { ContentError, loadContent } from './content.ts'

const count = (lists: Record<string, unknown[]>) =>
  Object.values(lists).reduce((sum, list) => sum + list.length, 0)

try {
  const { subjects, units, problems } = loadContent()
  console.log(
    `${subjects.length}教科 / ${count(units)}単元 / ${count(problems)}問題を検証しました`,
  )
} catch (err) {
  console.error(err instanceof ContentError ? `エラー: ${err.message}` : err)
  process.exit(1)
}
