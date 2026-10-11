import content from 'virtual:content'

// 教材は content/ をビルド時に読み込んだもの（vite.config.ts）。
// バックエンドへ移すときにページ側を変えずに済むよう、関数は非同期のままにしている

function notFound(): never {
  throw new Response('Not Found', { status: 404 })
}

function find<T extends { slug: string }>(items: T[], slug: string): T {
  return items.find((item) => item.slug === slug) ?? notFound()
}

export async function fetchSubjects() {
  return content.subjects
}

export async function fetchSubjectWithUnits(subjectSlug: string) {
  const subject = find(content.subjects, subjectSlug)
  const units = content.units[subject.slug]
  return { subject, units }
}

export async function fetchUnitWithProblems(
  subjectSlug: string,
  unitSlug: string,
) {
  const { subject, units } = await fetchSubjectWithUnits(subjectSlug)
  const unit = find(units, unitSlug)
  const problems = content.problems[`${subject.slug}/${unit.slug}`]
  return { subject, unit, problems }
}

export async function fetchProblem(
  subjectSlug: string,
  unitSlug: string,
  problemSlug: string,
) {
  const { subject, unit, problems } = await fetchUnitWithProblems(
    subjectSlug,
    unitSlug,
  )
  const problem = find(problems, problemSlug)
  return { subject, unit, problem }
}
