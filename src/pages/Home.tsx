import { useLoaderData } from 'react-router'
import { Oyajii } from '../components/Oyajii'
import { ItemLink } from './ItemLink'
import { RowArrow } from './RowArrow'
import { TagPicture } from './TagPicture'
import type { loadHome } from './loaders'

// 親が教えるときに、やってはいけないこと
const TEACHING_RULES = [
  {
    title: '怒鳴らない',
    reason:
      'こわい気持ちが残ると、考えることより顔色を見ることが先になります。',
  },
  {
    title: '答えを先に言わない',
    reason: '待つ時間も勉強です。自分で気づけた分だけ、力になります。',
  },
  {
    title: 'ほかの子と比べない',
    reason: '比べるのは、昨日のその子とだけ。できたことを一緒に喜びましょう。',
  },
]

export default function Home() {
  const { groups } = useLoaderData<ReturnType<typeof loadHome>>()

  return (
    <>
      {/* ステージ：上に「見るもの」を置く */}
      <div className="stage">
        <Oyajii className="stage-mascot" label="おやじい" />
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
                {group.tag && group.count > 0 && (
                  <TagPicture index={group.tag.index} />
                )}
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
        </ul>
      </section>

      {/* 親が教えるときに守ること */}
      <section className="home-rules" aria-labelledby="home-rules-title">
        <h2 id="home-rules-title" className="home-rules-title">
          教えるときの3つの約束
        </h2>
        {/* list-style をなくすと、Safari の読み上げでリストと伝わらなくなるため、role で補う */}
        <ol className="home-rules-list" role="list">
          {TEACHING_RULES.map((rule, i) => (
            <li key={rule.title}>
              <span className="home-rules-number" aria-hidden="true">
                {i + 1}
              </span>
              <span className="home-rules-text">
                <span className="home-rules-name">{rule.title}</span>
                <span className="home-rules-sub">{rule.reason}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
