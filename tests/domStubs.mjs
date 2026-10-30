import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// happy-dom（ブラウザの代わり）は、要素の大きさを持たず、アニメーションやポインターの捕捉もしない。
// 画面を操作するテストでは、それらをここで差し替え、テストごとに元へ戻す
const restores = []

// テストでは通信しない。おやじい（Rive）の絵と描画エンジンは読み込まず、枠だけを描く
beforeEach(() => {
  stub(globalThis, 'fetch', () => new Promise(() => {}))
})

afterEach(() => {
  cleanup()
  while (restores.length) restores.pop()()
  sessionStorage.clear()
  localStorage.clear()
})

export function stub(target, name, value) {
  const original = Object.getOwnPropertyDescriptor(target, name)
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value,
  })
  restores.push(() => {
    if (original) Object.defineProperty(target, name, original)
    else delete target[name]
  })
}

// すべての要素を width × height の大きさにする
export function stubSize(width, height) {
  stub(Element.prototype, 'getBoundingClientRect', () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
  }))
}

// element.animate() は、終わらないアニメーションを返す。onfinish() を呼ぶと終わったことにできる
export function stubAnimations() {
  const animations = []
  stub(Element.prototype, 'animate', function () {
    const animation = {
      target: this,
      onfinish: null,
      finished: new Promise(() => {}),
      cancel() {},
    }
    animations.push(animation)
    return animation
  })
  stub(Element.prototype, 'getAnimations', () => [])
  // 動きを減らす設定はオフ。変化を見張る仕組み（おやじい（Rive）が使う）は、何もしない
  stub(window, 'matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }))
  return animations
}

// setPointerCapture() を呼んだ回数を数える
export function stubPointerCapture() {
  const captured = []
  stub(Element.prototype, 'setPointerCapture', (pointerId) => {
    captured.push(pointerId)
  })
  stub(Element.prototype, 'releasePointerCapture', () => {})
  return captured
}
