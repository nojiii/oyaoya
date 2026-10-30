import { useLoaderData } from 'react-router'
import { ItemLink } from './ItemLink'
import { RowArrow } from './RowArrow'
import { TagPicture } from './TagPicture'
import type { GroupLink, loadGroup } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function GroupDetail() {
  const { name, crumbs, groups, problems } =
    useLoaderData<ReturnType<typeof loadGroup>>()
  usePageTitle(name)
  const isEmpty = groups.length + problems.length === 0
  // 選べる項目を上に大きく並べ、じゅんび中の項目は、選べる項目があるときだけたたんでおく
  const ready = groups.filter((group) => group.count > 0)
  const preparing = groups.filter((group) => group.count === 0)
  const folded = ready.length + problems.length > 0 && preparing.length > 0
  const shown = folded ? ready : groups

  const row = (group: GroupLink) => (
    <ItemLink className="row" to={group.url} empty={group.count === 0}>
      {group.tag && group.count > 0 && <TagPicture index={group.tag.index} />}
      <span className="row-text">
        <span className="item-name">{group.name}</span>
        {group.count === 0 && !folded && (
          <span className="row-sub">じゅんび中</span>
        )}
      </span>
      <RowArrow />
    </ItemLink>
  )

  return (
    <div>
      {crumbs.length > 0 && (
        <p className="context">
          {crumbs.map((crumb) => crumb.name).join('・')}
        </p>
      )}
      <h1 className="page-title">{name}</h1>
      {isEmpty && <p className="status">まだ登録されていません。</p>}
      <ul className="rows">
        {shown.map((group, i) => (
          <li key={group.url} style={{ animationDelay: `${i * 60}ms` }}>
            {row(group)}
          </li>
        ))}
        {problems.map((problem, i) => (
          <li
            key={problem.url}
            style={{ animationDelay: `${(shown.length + i) * 60}ms` }}
          >
            <ItemLink className="row" to={problem.url}>
              <span className="row-text">
                <span className="item-name">{problem.name}</span>
                <span className="row-sub">教え方をみる</span>
              </span>
              <RowArrow />
            </ItemLink>
          </li>
        ))}
      </ul>
      {folded && (
        <details className="more">
          <summary>じゅんび中（{preparing.length}）</summary>
          <ul className="rows">
            {preparing.map((group) => (
              <li key={group.url}>{row(group)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
