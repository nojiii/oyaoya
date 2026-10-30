import { Link, useLoaderData } from 'react-router'
import { ItemLink } from './ItemLink'
import { RowArrow } from './RowArrow'
import type { loadHome } from './loaders'
import { FESTIVAL_URL, useFestival } from './festival'

export default function Home() {
  const { groups } = useLoaderData<ReturnType<typeof loadHome>>()
  const festival = useFestival()

  return (
    <>
      {/* ステージ：上に「見るもの」を置く。キャラクターは将来 Rive の <canvas> に替える */}
      <div className="stage">
        <img
          className="stage-mascot"
          src="/mascot.png"
          alt="おやじい"
          draggable={false}
        />
      </div>

      <section className="home-start">
        <h1 className="home-lead">教えたい内容を選びましょう</h1>
        {groups.length === 0 && <p className="status">教材は準備中です。</p>}
        <ul className="rows">
          {groups.map((group, i) => (
            <li key={group.url} style={{ animationDelay: `${i * 60}ms` }}>
              <ItemLink
                className="row"
                to={group.url}
                empty={group.count === 0}
              >
                <span className="row-text">
                  <span className="item-name">{group.name}</span>
                  {group.count === 0 && (
                    <span className="row-sub">じゅんび中</span>
                  )}
                </span>
                <RowArrow />
              </ItemLink>
            </li>
          ))}
          {!festival && (
            <li style={{ animationDelay: `${groups.length * 60}ms` }}>
              <Link className="row" to={FESTIVAL_URL} viewTransition>
                <span className="row-text">
                  <span className="item-name">大学祭</span>
                  <span className="row-sub">大学祭の問題に挑戦</span>
                </span>
                <RowArrow />
              </Link>
            </li>
          )}
        </ul>
      </section>
    </>
  )
}
