import { Link, useLoaderData } from 'react-router'
import { problems } from '../problems'
import { Breadcrumb } from './Breadcrumb'
import type { loadGroup } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function GroupDetail() {
  const { group, url, crumbs } = useLoaderData<ReturnType<typeof loadGroup>>()
  usePageTitle(group.name)

  const children = group.children ?? []
  const problemIds = group.problems ?? []

  return (
    <>
      <Breadcrumb crumbs={crumbs} current={group.name} />
      <h2>
        {group.name}:{' '}
        {children.length === 0 ? '問題をえらんでください' : 'えらんでください'}
      </h2>
      <ul className="list">
        {children.length + problemIds.length === 0 && (
          <li>まだ登録されていません。</li>
        )}
        {children.map((child) => (
          <li key={child.slug}>
            <Link to={`${url}/${child.slug}`}>{child.name}</Link>
          </li>
        ))}
        {problemIds.map((id) => (
          <li key={id}>
            <Link to={`/problems/${id}`}>{problems[id].title}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
