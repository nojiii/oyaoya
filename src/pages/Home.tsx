import { Link, useLoaderData } from 'react-router'
import type { Subject } from '../content/types'

export default function Home() {
  const subjects = useLoaderData<Subject[]>()

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

      <section className="card">
        <p className="card-lead">🌱 今日もいっしょにがんばろう!</p>
        <p className="card-sub">学習を始めて、できた!を増やしていこう。</p>
        <hr className="dotted" />
        <ul className="list subject-list">
          {subjects.length === 0 && <li>教科がまだ登録されていません。</li>}
          {subjects.map((subject) => (
            <li key={subject.slug}>
              <Link to={`/${subject.slug}`}>
                📖 {subject.name} <span className="chevron">›</span>
              </Link>
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
