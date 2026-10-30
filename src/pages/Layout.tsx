import {
  isRouteErrorResponse,
  Link,
  Outlet,
  ScrollRestoration,
  useMatches,
  useNavigation,
  useRouteError,
} from 'react-router'
import { useHomeUrl } from './festival'
import type { PageLink } from './loaders'
import { SideNavigation } from '../components/SideNavigation'

// 上の帯。ホームではロゴ、それ以外の画面では1つ上の一覧へ戻るボタンを左に置き、メニューは右に置く
function Header() {
  const homeUrl = useHomeUrl()
  const data = useMatches().at(-1)?.loaderData as
    { crumbs?: PageLink[] } | undefined
  const crumbs = data?.crumbs
  return (
    <header className="site-header">
      {crumbs ? (
        <Link
          className="back-link"
          to={crumbs.at(-1)?.url ?? homeUrl}
          viewTransition
          aria-label={`${crumbs.at(-1)?.name ?? 'ホーム'}にもどる`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        </Link>
      ) : (
        <Link className="site-logo" to={homeUrl} viewTransition>
          <span className="accent">O</span>ya<span className="accent">O</span>
          ya
        </Link>
      )}
      <SideNavigation />
    </header>
  )
}

export function Layout() {
  const navigation = useNavigation()
  return (
    <>
      <Header />
      <main className={navigation.state === 'loading' ? 'is-loading' : ''}>
        <Outlet />
      </main>
      {/* ページを移ったら一番上から表示し、ブラウザの「戻る」では元の位置に戻す */}
      <ScrollRestoration />
    </>
  )
}

export function Loading() {
  return <p className="status">よみこみ中…</p>
}

export function ErrorPage() {
  const error = useRouteError()
  const homeUrl = useHomeUrl()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <>
      <Header />
      <main>
        <p className="status">
          {notFound
            ? 'ページが見つかりませんでした。'
            : 'データの読み込みに失敗しました。'}
        </p>
        <p className="status">
          <Link to={homeUrl}>ホームへもどる</Link>
        </p>
      </main>
    </>
  )
}
