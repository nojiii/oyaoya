import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadOyajii } from './components/oyajiiFile'
import { startDebugTheme } from './debugTheme'

// デバッグモード（URL に ?debug）で選んだ台本の色を、最初の描画の前に当てておく
startDebugTheme()

// おやじい（Rive）を先に読み込んでおく。読み込めなかったときは、おやじいを出すときに読み直す
loadOyajii().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
