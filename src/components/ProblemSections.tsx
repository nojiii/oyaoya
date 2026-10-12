import type { ReactNode } from 'react'

interface Props {
  question: ReactNode
  howToSolve: ReactNode
  howToTeach: ReactNode
  examplePhrases: ReactNode
}

// 問題ページの標準の構成（問題 → 解き方 → 教え方 → 声掛け例）。
// 見出しはここに1回だけ書き、各問題は中身だけを渡す
export function ProblemSections({
  question,
  howToSolve,
  howToTeach,
  examplePhrases,
}: Props) {
  const sections = [
    ['問題', question],
    ['解き方', howToSolve],
    ['教え方', howToTeach],
    ['声掛け例', examplePhrases],
  ] as const

  return (
    <>
      {sections.map(([heading, body]) => (
        <section className="step" key={heading}>
          <h2>{heading}</h2>
          {body}
        </section>
      ))}
    </>
  )
}
