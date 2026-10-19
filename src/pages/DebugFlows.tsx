import { Link, useLoaderData } from 'react-router'
import { FlowTreeContext } from '../components/flowTreeContext'
import type { loadFlows } from './loaders'
import { usePageTitle } from './usePageTitle'
import styles from './DebugFlows.module.css'

// 動線一覧（開発中だけ開ける /debug）。問題ごとに、台本の通りうる画面を木にして並べる（森）。
// 問題の画面をそのまま描き、TeachingScript には台本の代わりに木を描かせる（FlowTreeContext）。
// 台本を直せば、この一覧も同じデータからそのまま変わる
export default function DebugFlows() {
  const { problems } = useLoaderData<ReturnType<typeof loadFlows>>()
  usePageTitle('動線一覧')

  return (
    <div className={styles.page} data-debug-page>
      <h1 className="page-title">動線一覧（開発用）</h1>
      <ul className={styles.notes}>
        <li>
          1画面を1つの節にして、待つ画面の反応のボタンで枝分かれする。左の数字は、最初の画面から
          いちばん短い道で何画面目か
        </li>
        <li>
          ほかの道で先に出てきた画面は「→
          〇〇へ合流」と書く（押すとその画面へ移る）
        </li>
        <li>
          「おわる」（おしまいへ）と「←
          もどる」（1つ前の画面へ）は、どの画面からでも押せるので、木には入れていない
        </li>
        <li>「開く」で、その画面から台本を開ける（開発中だけ）</li>
      </ul>
      {problems.map(({ id, title, Component }) => (
        // id は、台本の横の「一覧で見る」から、この問題の位置へ移るのに使う
        <details className={styles.problem} key={id} id={`problem-${id}`} open>
          <summary>
            {title} <span className={styles.id}>{id}</span>{' '}
            <Link className={styles.sideLink} to={`/problems/${id}?debug=true`}>
              台本の横で開く
            </Link>
          </summary>
          {/* 問題の画面のうち、木だけを見せる（台本を使っていない問題は、その旨を出す） */}
          <div className={styles.sandbox}>
            <FlowTreeContext value={{ problemId: id }}>
              <Component />
            </FlowTreeContext>
          </div>
        </details>
      ))}
    </div>
  )
}
