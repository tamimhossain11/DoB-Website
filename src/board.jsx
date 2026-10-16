import React from 'react'
import ReactDOM from 'react-dom/client'
import BoardApp from './components/board/BoardApp'
import { MotionRoot } from './components/ui'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionRoot>
      <BoardApp />
    </MotionRoot>
  </React.StrictMode>,
)
