import { useLoaderData } from 'react-router'
import type { loadProblem } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function ProblemDetail() {
  const { title, Component } = useLoaderData<ReturnType<typeof loadProblem>>()
  usePageTitle(title)

  return (
    <div>
      {/* 問題の画面では、単元名は小さなラベルにして、各画面の伝えること（この学習でやること など）を大きく出す */}
      <h1 className="page-title" data-small>
        {title}
      </h1>
      <Component />
    </div>
  )
}
