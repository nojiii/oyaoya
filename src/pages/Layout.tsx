import {
  isRouteErrorResponse,
  Link,
  Outlet,
  useLocation,
  useNavigation,
  useRouteError,
} from 'react-router'

function Header() {
  return (
    <header className="site-header">
      <h1>
        <Link to="/">Oyaoya</Link>
      </h1>
    </header>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  return (
    <>
      {pathname !== '/' && <Header />}
      <main className={navigation.state === 'loading' ? 'is-loading' : ''}>
        <Outlet />
      </main>
    </>
  )
}

export function Loading() {
  return <p className="status">よみこみ中…</p>
}

export function ErrorPage() {
  const error = useRouteError()
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
          <Link to="/">ホームへもどる</Link>
        </p>
      </main>
    </>
  )
}
