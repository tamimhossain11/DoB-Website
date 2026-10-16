import React from 'react'
import ReactDOM from 'react-dom/client'
import Nav from './components/Nav'
import Footer from './components/Footer'
import PressRelease from './components/PressRelease'
import ScrollProgress from './components/ScrollProgress'
import { MotionRoot } from './components/ui'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionRoot>
      <ScrollProgress />
      {/* hrefBase sends the shared nav/footer anchors back to the home page */}
      <Nav hrefBase="/" page="press" />
      <main>
        <PressRelease />
      </main>
      <Footer hrefBase="/" />
    </MotionRoot>
  </React.StrictMode>,
)
