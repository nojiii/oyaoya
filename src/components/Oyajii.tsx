import { useEffect } from 'react'
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  useRive,
  useViewModel,
  useViewModelInstance,
} from '@rive-app/react-canvas'
import wasmUrl from '@rive-app/canvas/rive.wasm?url'

// Rive の描画エンジン（wasm）は、外部の CDN からではなく、アプリと一緒に配信する。
// JS と wasm の版は合わせる必要があるので、@rive-app/canvas は package.json に書かず、
// @rive-app/react-canvas が使っているものから wasm を読む（react-canvas を上げると、wasm も一緒に上がる）
RuntimeLoader.setWasmUrl(wasmUrl)
RuntimeLoader.setWasmFallbackUrl(null)

// おやじいの動き（public/oyajii.riv の ViewModel「Oyajii」のトリガー）。
// ふだんは待機（idle）をくり返し、動きを1回したら待機に戻る
export type OyajiiMotion = 'start' | 'finish' | 'correct' | 'talk'

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })

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
  const { rive, RiveComponent } = useRive({
    src: '/oyajii.riv',
    stateMachines: 'State Machine 1',
    layout: LAYOUT,
    autoplay: !reducedMotion(),
    // おやじいは触って動かすものではないので、指の操作を受けない（スワイプの邪魔をしない）
    shouldDisableRiveListeners: true,
  })
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
