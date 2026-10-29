import { useLoaderData } from 'react-router'
import { Breadcrumb } from './Breadcrumb'
import { ItemLink, TONE_COUNT } from './ItemLink'
import type { loadGroup } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function GroupDetail() {
  const { name, rootIndex, crumbs, groups, problems } =
    useLoaderData<ReturnType<typeof loadGroup>>()
  usePageTitle(name)
  const isEmpty = groups.length + problems.length === 0

  return (
    // 一番上の段の分類ごとに色を変える（ホームのタイルと同じ色）
    <div data-tone={rootIndex % TONE_COUNT}>
      <Breadcrumb crumbs={crumbs} current={name} />
      <header className="group-head">
        <h1 className="page-title">{name}</h1>
        <p>
          {isEmpty
            ? 'じゅんび中'
            : groups.length === 0
              ? '問題をえらんでください'
              : 'えらんでください'}
        </p>
      </header>
      {isEmpty && <p className="status">まだ登録されていません。</p>}
      <ul className="rows">
        {groups.map((group, i) => (
          <li key={group.url} style={{ animationDelay: `${i * 60}ms` }}>
            <ItemLink className="row" to={group.url} empty={group.count === 0}>
              <span className="row-badge" aria-hidden="true">
                {i + 1}
              </span>
              <span className="row-text">
                {group.tag && (
                  <span className="row-tag" data-tag={group.tag.index}>
                    {group.tag.name}
                  </span>
                )}
                <span className="item-name">{group.name}</span>
                <span className="row-sub">
                  {group.count === 0 ? 'じゅんび中' : `${group.count}問`}
                </span>
              </span>
              <span className="row-arrow" aria-hidden="true">
                ›
              </span>
            </ItemLink>
          </li>
        ))}
        {problems.map((problem, i) => (
          <li
            key={problem.url}
            style={{ animationDelay: `${(groups.length + i) * 60}ms` }}
          >
            <ItemLink className="row" to={problem.url}>
              <span
                className="row-badge"
                data-kind="problem"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="row-text">
                <span className="item-name">{problem.name}</span>
                <span className="row-sub">教え方をみる</span>
              </span>
              <span className="row-arrow" aria-hidden="true">
                ›
              </span>
            </ItemLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
