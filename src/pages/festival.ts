// 大学祭用のサイト（festival ブランチ）では、大学祭モードだけをサイトのトップ（/）から出す。
// 本編（main）からは大学祭モードを外したので、展示したときの状態（タグ festival-2026-11-01）に、
// この出し方の違いだけを足して公開する

// 大学祭モードのURLの先頭。大学祭用のサイトでは付けない（例: /problems/math-easy-1）
export const FESTIVAL_URL = ''

// 大学祭用のサイトでは、いつも大学祭モード
export function useFestival() {
  return true
}

// ホームのURL
export function useHomeUrl() {
  return '/'
}
