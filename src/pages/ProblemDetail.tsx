import { useLoaderData } from 'react-router'
import { Breadcrumb } from './Breadcrumb'
import type { loadProblem } from './loaders'
import { usePageTitle } from './usePageTitle'
import { TONE_COUNT } from './ItemLink'

export default function ProblemDetail() {
  const { title, Component, crumbs, rootIndex } =
    useLoaderData<ReturnType<typeof loadProblem>>()
  usePageTitle(title)

  return (
    <div data-tone={rootIndex % TONE_COUNT}>
      <Breadcrumb crumbs={crumbs} current={title} />
      <h1 className="page-title">{title}</h1>
      <Component />
    </div>
  )
}
