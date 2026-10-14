import { useLoaderData } from 'react-router'
import { Breadcrumb } from './Breadcrumb'
import type { loadProblem } from './loaders'
import { usePageTitle } from './usePageTitle'

export default function ProblemDetail() {
  const { title, Component, crumbs } =
    useLoaderData<ReturnType<typeof loadProblem>>()
  usePageTitle(title)

  return (
    <>
      <Breadcrumb crumbs={crumbs} current={title} />
      <h1 className="page-title">{title}</h1>
      <Component />
    </>
  )
}
