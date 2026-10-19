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
          台本を読むだけで、おうちの先生に。
          <br />
          声かけの台本で、親子で解き方を学ぼう。
        </p>
        <img className="mascot" src="/mascot.png" alt="おやじい" />
      </section>

      <section className="home-start">
        <h1 className="home-lead">教えたい内容を選びましょう</h1>
        <p className="home-sub">
          教え方に迷っても大丈夫。台本が、声をかける言葉と順番を案内します。
        </p>
        <ol className="home-sub">
          <li>お子さんと取り組む問題を選ぶ。</li>
          <li>親が台本を読み、声や紙、実物で問題を伝える。</li>
          <li>台本を左右にスワイプして、順番に解き方を教える。</li>
        </ol>
        {groups.length === 0 && <p className="status">教材は準備中です。</p>}
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
        🏠 「どう教えよう」を、親子の「わかった！」に。
      </p>
    </>
  )
}
