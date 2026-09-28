import { Link, useLoaderData } from 'react-router'
import type { fetchUnitWithProblems } from '../content/api'
import { usePageTitle } from './usePageTitle'

export default function UnitDetail() {
  const { subject, unit, problems } =
    useLoaderData<Awaited<ReturnType<typeof fetchUnitWithProblems>>>()
  usePageTitle(unit.name)

  return (
    <>
      <nav className="breadcrumb">
        <Link to="/">ホーム</Link> /{' '}
        <Link to={`/${subject.slug}`}>{subject.name}</Link> / {unit.name}
      </nav>
      <h2>{unit.name}: 問題をえらんでください</h2>
      <ul className="list">
        {problems.length === 0 && <li>問題がまだ登録されていません。</li>}
        {problems.map((problem) => (
          <li key={problem.slug}>
            <Link to={`/${subject.slug}/${unit.slug}/${problem.slug}`}>
              {problem.title}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
