import { useLoaderData } from 'react-router'
import { ItemLink, TONE_COUNT } from './ItemLink'
import type { loadHome } from './loaders'

export default function Home() {
  const { groups } = useLoaderData<ReturnType<typeof loadHome>>()

  return (
    <>
      <section className="hero">
        <div className="logo">
          <span className="accent">O</span>ya<span className="accent">O</span>
          ya
        </div>
        <p className="tagline">
          いっしょに学ぶ、いっしょに成長。
          <br />
          親子の「わかった!」がふえるアプリ
        </p>
        <img className="mascot" src="/mascot.png" alt="おやじい" />
      </section>

      <section className="home-start">
        <p className="home-lead">🌱 今日もいっしょにがんばろう!</p>
        <p className="home-sub">学習を始めて、できた!を増やしていこう。</p>
        {groups.length === 0 && (
          <p className="status">まだ登録されていません。</p>
        )}
        <ul className="tiles">
          {groups.map((group, i) => (
            <li
              key={group.url}
              data-tone={i % TONE_COUNT}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ItemLink
                className="tile"
                to={group.url}
                empty={group.count === 0}
              >
                <span className="tile-number" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="item-name">{group.name}</span>
                <span className="tile-sub">
                  {group.count === 0 ? 'じゅんび中' : `${group.count}問 ›`}
                </span>
              </ItemLink>
            </li>
          ))}
        </ul>
      </section>

      <p className="footer-note">
        🏠 おうちでの学びを、もっと楽しく、もっと身近に。 ♡
      </p>
    </>
  )
}
