import { Link, useLoaderData } from 'react-router'
import { Breadcrumb } from './Breadcrumb'
import type { loadGroup } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function GroupDetail() {
  const { name, crumbs, groups, problems } =
    useLoaderData<ReturnType<typeof loadGroup>>()
  usePageTitle(name)

  return (
    <>
      <Breadcrumb crumbs={crumbs} current={name} />
      <h2>
        {name}:{' '}
        {groups.length === 0 ? '問題をえらんでください' : 'えらんでください'}
      </h2>
      <ul className="list">
        {groups.length + problems.length === 0 && (
          <li>まだ登録されていません。</li>
        )}
        {[...groups, ...problems].map((link) => (
          <li key={link.url}>
            <Link to={link.url}>{link.name}</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
