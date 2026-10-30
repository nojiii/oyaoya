import { RiveFile, RuntimeLoader } from '@rive-app/react-canvas'
import wasmUrl from '@rive-app/canvas/rive.wasm?url'
import fallbackWasmUrl from '@rive-app/canvas/rive_fallback.wasm?url'

// Rive の描画エンジン（wasm）は、外部の CDN からではなく、アプリと一緒に配信する。
// 本体の wasm が動かない古い端末のための予備（fallback）も、同じように配信する。
// JS と wasm の版は合わせる必要があるので、@rive-app/canvas は package.json に書かず、
// @rive-app/react-canvas が使っているものから wasm を読む（react-canvas を上げると、wasm も一緒に上がる。
// 同じものかは tests/oyajii.test.mjs で確かめている）
RuntimeLoader.setWasmUrl(wasmUrl)
RuntimeLoader.setWasmFallbackUrl(fallbackWasmUrl)

// 読み込んだ oyajii.riv は、すべてのおやじいで使い回す
let loaded: RiveFile | null = null
let loading: Promise<RiveFile> | null = null

// 読み込み終えていれば、その oyajii.riv
export function loadedOyajii() {
  return loaded
}

// oyajii.riv と描画エンジンを読み込む（1回だけ）。main.tsx で、アプリを開いたときに先に読んでおく。
// 台本をはじめる幕は1秒ほどで消えるので、幕で初めて読むと間に合わないことがあるため
export function loadOyajii() {
  loading ??= new Promise<RiveFile>((resolve, reject) => {
    const file = new RiveFile({
      src: '/oyajii.riv',
      onLoad: () => {
        // おやじいがすべて画面から消えても、ファイルは捨てずに持っておく
        file.getInstance()
        loaded = file
        resolve(file)
      },
      onLoadError: () => {
        // 通信が切れていたときなどは、次に出すときに読み直す
        loading = null
        reject(new Error('oyajii.riv を読み込めませんでした'))
      },
    })
    void file.init()
  })
  return loading
}
