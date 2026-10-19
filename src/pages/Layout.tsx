import {
  isRouteErrorResponse,
  Link,
  Outlet,
  ScrollRestoration,
  useNavigation,
  useRouteError,
} from 'react-router'
import { useHomeUrl } from './festival'
import { SideNavigation } from '../components/SideNavigation'

function Header() {
  const homeUrl = useHomeUrl()
  return (
    <header className="site-header">
      <SideNavigation />
      <Link className="site-logo" to={homeUrl} viewTransition>
        <span className="accent">O</span>ya<span className="accent">O</span>ya
      </Link>
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
