import React from 'react'
import ReactDOM from 'react-dom/client'
import Nav from './components/Nav'
import Footer from './components/Footer'
import SignInPage from './components/SignInPage'
import { MotionRoot } from './components/ui'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionRoot>
      {/* hrefBase sends the shared nav/footer anchors back to the home page */}
      <Nav hrefBase="/" page="signin" />
      <main>
        <SignInPage />
      </main>
      <Footer hrefBase="/" />
    </MotionRoot>
  </React.StrictMode>,
)
