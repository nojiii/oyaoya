import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startDebugTheme } from './debugTheme'

// デバッグモード（URL に ?debug）で選んだ台本の色を、最初の描画の前に当てておく
startDebugTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
