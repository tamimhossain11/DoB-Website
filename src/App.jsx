import Nav from './components/Nav'
import Hero from './components/Hero'
import Mission from './components/Mission'
import Projects from './components/Projects'
import Campaigns from './components/Campaigns'
import Team from './components/Team'
import Partners from './components/Partners'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'
import { MotionRoot } from './components/ui'

export default function App() {
  return (
    <MotionRoot>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Mission />
        <Projects />
        <Campaigns />
        <Team />
        <Partners />
      </main>
      <Footer />
    </MotionRoot>
  )
}
