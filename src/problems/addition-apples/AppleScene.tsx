import styles from './AppleScene.module.css'

// 並べるりんご。数字は、数えるときに下に出す番号
const GROUPS = [
  { color: 'red', numbers: [1, 2, 3] },
  { color: 'blue', numbers: [4, 5] },
] as const

interface Props {
  // 何こ目まで見せるか（3ならあかだけ、5ならあおも）
  count: number
  // あかとあおの間をあけて、それぞれの数を出す
  split?: boolean
  // りんごの下に 1〜5 の番号を順に出す
  counted?: boolean
  // りんごの下に出す式（question は「?」、sum は「3 + 2」、answer は「3 + 2 = 5」）
  formula?: 'question' | 'sum' | 'answer'
}

function Apple() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        className={styles.body}
        d="M24 16C21 12.5 14 12 10.5 16 6 21 7 31 12 38c3.5 5 7.5 5.5 12 3.5 4.5 2 8.5 1.5 12-3.5 5-7 6-17 1.5-22C34 12 27 12.5 24 16Z"
      />
      <path className={styles.stem} d="M24 16c0-4 1-6.5 3.5-9" />
      <path
        className={styles.leaf}
        d="M27.5 9.5c2.5-3.5 6.5-4 9.5-2.5-1.5 3.5-5.5 5-9.5 2.5Z"
      />
      <ellipse
        className={styles.shine}
        cx="16"
        cy="24"
        rx="2.5"
        ry="5"
        transform="rotate(20 16 24)"
      />
    </svg>
  )
}

// りんごの図。渡す値を変えると、りんごが出たり、分かれたり、番号が付いたりする
export function AppleScene({ count, split, counted, formula }: Props) {
  return (
    <div className={styles.scene}>
      <div
        className={styles.apples}
        data-split={split}
        role="img"
        aria-label={`りんご ${count}こ`}
      >
        {GROUPS.map((group) => (
          <div className={styles.group} key={group.color}>
            {group.numbers.map((number, i) => {
              const shown = number <= count
              return (
                <span
                  className={styles.apple}
                  key={number}
                  data-color={group.color}
                  data-shown={shown}
                  // 出るときだけ、左から順にずらす
                  style={{ transitionDelay: shown ? `${i * 100}ms` : '0ms' }}
                >
                  <Apple />
                  <span
                    className={styles.number}
                    data-shown={counted}
                    // 「1、2、3…」と数える速さで順に出す
                    style={{
                      transitionDelay: counted
                        ? `${(number - 1) * 250}ms`
                        : '0ms',
                    }}
                  >
                    {number}
                  </span>
                </span>
              )
            })}
            <span className={styles.groupLabel} data-shown={split}>
              {group.numbers.length}こ
            </span>
          </div>
        ))}
      </div>
      <p
        className={styles.formula}
        data-state={formula ?? 'none'}
        aria-hidden="true"
      >
        <span className={styles.question}>?</span>
        <span className={styles.sum}>
          3 + 2
          <span className={styles.answer}>
            {' = '}
            <strong>5</strong>
          </span>
        </span>
      </p>
    </div>
  )
}
