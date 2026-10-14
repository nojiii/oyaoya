import { Fragment } from 'react'
import { Link } from 'react-router'
import { useHomeUrl } from './festival'
import type { PageLink } from './loaders'

interface Props {
  crumbs: PageLink[]
  current: string
}

function Separator() {
  return (
    <span className="separator" aria-hidden="true">
      ›
    </span>
  )
}

export function Breadcrumb({ crumbs, current }: Props) {
  const homeUrl = useHomeUrl()
  return (
    <nav className="breadcrumb" aria-label="パンくずリスト">
      <Link to={homeUrl} viewTransition>
        ホーム
      </Link>
      <Separator />
      {crumbs.map((crumb) => (
        <Fragment key={crumb.url}>
          <Link to={crumb.url} viewTransition>
            {crumb.name}
          </Link>
          <Separator />
        </Fragment>
      ))}
      <span aria-current="page">{current}</span>
    </nav>
  )
}
