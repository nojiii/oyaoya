import { useEffect, useState } from 'react'
import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
} from '@rive-app/react-canvas'
import { loadedOyajii, loadOyajii } from './oyajiiFile'

// おやじいの動き（public/oyajii.riv の ViewModel「Oyajii」のトリガー）。
// ふだんは待機（idle）をくり返し、動きを1回したら待機に戻る
export type OyajiiMotion = 'start' | 'finish' | 'correct' | 'talk'

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })

// 読み込み済みなら、最初からその oyajii.riv で描く（ページを送るたびに作り直される台本でも、すぐ出る）
function useOyajiiFile() {
  const [file, setFile] = useState(loadedOyajii)
  useEffect(() => {
    if (file) return
    let active = true
    loadOyajii().then(
      (next) => {
        if (active) setFile(next)
      },
      // 読み込めなければ、枠だけを出しておく
      () => {},
    )
    return () => {
      active = false
    }
  }, [file])
  return file
}

// 動きを減らす設定の人には、止まった絵だけを出す
function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
}

// おやじい（Rive）。大きさは className で決める（中の <canvas> が枠いっぱいに描く）
export function Oyajii({
  className,
  motion,
  label,
}: {
  className?: string
  // 変わるたびに、その動きを1回する。読み込みが終わる前に渡したときは、読み込んでからする
  motion?: OyajiiMotion | null
  // 読み上げで伝える名前。なければ飾りとして読み上げない
  label?: string
}) {
  const file = useOyajiiFile()
  const { rive, RiveComponent } = useRive(
    file && {
      riveFile: file,
      stateMachines: 'State Machine 1',
      layout: LAYOUT,
      autoplay: !reducedMotion(),
      // おやじいは触って動かすものではないので、指の操作を受けない（スワイプの邪魔をしない）
      shouldDisableRiveListeners: true,
    },
  )
  const viewModel = useViewModel(rive, { name: 'Oyajii' })
  const instance = useViewModelInstance(viewModel, { rive })

  useEffect(() => {
    if (motion) instance?.trigger(motion)?.trigger()
  }, [motion, instance])

  return (
    <RiveComponent
      className={className}
      data-oyajii=""
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
    />
  )
}
