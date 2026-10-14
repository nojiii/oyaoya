import { useLocation } from 'react-router'

// 大学祭モードのホームのURL。通常のURLの先頭にこれを付けたものが、大学祭モードのURLになる
// （例: /problems/addition-apples → /festival/problems/addition-apples）
export const FESTIVAL_URL = '/festival'

// 今のURLが大学祭モードかどうか
export function useFestival() {
  const { pathname } = useLocation()
  return pathname === FESTIVAL_URL || pathname.startsWith(`${FESTIVAL_URL}/`)
}

// 今のモードのホームのURL
export function useHomeUrl() {
  return useFestival() ? FESTIVAL_URL : '/'
}
