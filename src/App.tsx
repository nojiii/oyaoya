import { useState } from 'react'
import { subjects } from './content/data'
import type { Problem } from './content/types'
import './App.css'

function App() {
  const [selected, setSelected] = useState<Problem | null>(null)

  return (
    <div className="app">
      <header>
        <img src="/mascot.png" alt="" className="mascot" />
        <h1>おやおや</h1>
        <p>いっしょに学ぶ、いっしょに成長。</p>
      </header>

      {selected ? (
        <ProblemDetail problem={selected} onBack={() => setSelected(null)} />
      ) : (
        <ContentList onSelect={setSelected} />
      )}
    </div>
  )
}

function ContentList({ onSelect }: { onSelect: (problem: Problem) => void }) {
  return (
    <div>
      {subjects.map((subject) => (
        <section key={subject.slug}>
          <h2>{subject.name}</h2>
          {subject.units.map((unit) => (
            <div key={unit.slug}>
              <h3>{unit.name}</h3>
              <ul>
                {unit.problems.map((problem) => (
                  <li key={problem.slug}>
                    <button type="button" onClick={() => onSelect(problem)}>
                      {problem.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

function ProblemDetail({
  problem,
  onBack,
}: {
  problem: Problem
  onBack: () => void
}) {
  return (
    <div>
      <button type="button" onClick={onBack}>
        ← もどる
      </button>
      <h2>{problem.title}</h2>

      <h3>もんだい</h3>
      <p>{problem.question}</p>

      <h3>とき方</h3>
      <p>{problem.howToSolve}</p>

      <h3>おうちの方へ：おしえ方</h3>
      <p>{problem.howToTeach}</p>

      <h3>おうちの方へ：声かけ例</h3>
      <p>{problem.examplePhrases}</p>
    </div>
  )
}

export default App
