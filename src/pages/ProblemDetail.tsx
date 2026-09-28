import Markdown from 'react-markdown'
import { Link, useLoaderData } from 'react-router'
import type { fetchProblem } from '../content/api'
import { usePageTitle } from './usePageTitle'

export default function ProblemDetail() {
  const { subject, unit, problem } =
    useLoaderData<Awaited<ReturnType<typeof fetchProblem>>>()
  usePageTitle(problem.title)

  const sections = [
    ['問題', problem.question],
    ['解き方', problem.howToSolve],
    ['教え方', problem.howToTeach],
    ['声掛け例', problem.examplePhrases],
  ] as const

  return (
    <>
      <nav className="breadcrumb">
        <Link to="/">ホーム</Link> /{' '}
        <Link to={`/${subject.slug}`}>{subject.name}</Link> /{' '}
        <Link to={`/${subject.slug}/${unit.slug}`}>{unit.name}</Link> /{' '}
        {problem.title}
      </nav>
      <h1>{problem.title}</h1>

      {sections.map(([heading, body]) => (
        <section className="step" key={heading}>
          <h2>{heading}</h2>
          <Markdown>{body}</Markdown>
        </section>
      ))}
    </>
  )
}
