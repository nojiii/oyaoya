import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useMatches } from 'react-router'
import { curriculum, festivalCurriculum } from '../curriculum'
import { useFestival, useHomeUrl } from '../pages/festival'
import type { PageLink } from '../pages/loaders'

export function SideNavigation() {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const sheetId = useId()
  const homeUrl = useHomeUrl()
  const festival = useFestival()
  const { pathname } = useLocation()
  const matches = useMatches()
  const data = matches.at(-1)?.data as { crumbs?: PageLink[] } | undefined
  const crumbs = data?.crumbs ?? []
  const groups = festival ? festivalCurriculum : curriculum
  const base = festival ? homeUrl : ''

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const close = () => dialog.current?.close()
  return (
    <>
      <button
        className="menu-trigger"
        type="button"
        ref={trigger}
        aria-label="メニューを開く"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => {
          dialog.current?.showModal()
          setOpen(true)
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <dialog
        id={sheetId}
        className="side-sheet"
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false)
          trigger.current?.focus({ preventScroll: true })
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close()
        }}
      >
        <div className="side-sheet-heading">
          <h2 id={titleId}>メニュー</h2>
          <button
            className="menu-trigger"
            type="button"
            aria-label="メニューを閉じる"
            onClick={close}
            autoFocus
          >
            ×
          </button>
        </div>
        <nav aria-label="学習メニュー">
          <Link
            className="sheet-link"
            to={homeUrl}
            onClick={close}
            aria-current={pathname === homeUrl ? 'page' : undefined}
          >
            ホーム・学年を選ぶ
          </Link>
          {crumbs.length > 0 && (
            <section className="sheet-section">
              <h3>今の学習から戻る</h3>
              {crumbs.map((crumb, index) => (
                <Link
                  className="sheet-link"
                  key={crumb.url}
                  to={crumb.url}
                  onClick={close}
                >
                  {crumb.name}
                  {index === 1 ? 'の単元を選ぶ' : 'へ戻る'}
                </Link>
              ))}
            </section>
          )}
          <section className="sheet-section">
            <h3>{festival ? '難しさから選ぶ' : '学年・単元から選ぶ'}</h3>
            {groups.map((group) => (
              <details className="sheet-group" key={group.slug}>
                <summary>{group.name}</summary>
                <Link
                  className="sheet-link"
                  to={`${base}/${group.slug}`}
                  onClick={close}
                >
                  {group.name}の一覧
                </Link>
                {group.children?.map((subject) => (
                  <div key={subject.slug}>
                    <Link
                      className="sheet-link"
                      to={`${base}/${group.slug}/${subject.slug}`}
                      onClick={close}
                    >
                      {subject.name}の単元を選ぶ
                    </Link>
                    {subject.children?.map((unit) => {
                      const url = `${base}/${group.slug}/${subject.slug}/${unit.slug}`
                      return (
                        <Link
                          className="sheet-link sheet-unit"
                          key={url}
                          to={url}
                          onClick={close}
                          aria-current={pathname === url ? 'page' : undefined}
                        >
                          {unit.name}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </details>
            ))}
          </section>
        </nav>
      </dialog>
    </>
  )
}
