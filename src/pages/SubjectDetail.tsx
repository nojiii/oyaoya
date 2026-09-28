import { Link, useLoaderData } from 'react-router'
import type { fetchSubjectWithUnits } from '../content/api'
import { usePageTitle } from './usePageTitle'

export default function SubjectDetail() {
  const { subject, units } =
    useLoaderData<Awaited<ReturnType<typeof fetchSubjectWithUnits>>>()
  usePageTitle(subject.name)

  return (
    <>
      <nav className="breadcrumb">
        <Link to="/">ホーム</Link> / {subject.name}
      </nav>
      <h2>{subject.name}: 単元をえらんでください</h2>
      <ul className="list">
        {units.length === 0 && <li>単元がまだ登録されていません。</li>}
        {units.map((unit) => (
          <li key={unit.slug}>
            <Link to={`/${subject.slug}/${unit.slug}`}>{unit.name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
