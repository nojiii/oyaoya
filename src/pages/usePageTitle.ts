import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} - Oyaoya`
    return () => {
      document.title = 'Oyaoya'
    }
  }, [title])
}
