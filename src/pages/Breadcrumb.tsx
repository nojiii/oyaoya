import { Fragment } from 'react'
import { Link } from 'react-router'
import type { PageLink } from './loaders'

interface Props {
  crumbs: PageLink[]
  current: string
}

export function Breadcrumb({ crumbs, current }: Props) {
  return (
    <nav className="breadcrumb">
      <Link to="/">ホーム</Link> /{' '}
      {crumbs.map((crumb) => (
        <Fragment key={crumb.url}>
          <Link to={crumb.url}>{crumb.name}</Link> /{' '}
        </Fragment>
      ))}
      {current}
    </nav>
  )
}
