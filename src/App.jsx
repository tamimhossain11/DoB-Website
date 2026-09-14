import Nav from './components/Nav'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Mission from './components/Mission'
import Projects from './components/Projects'
import Campaigns from './components/Campaigns'
import Team from './components/Team'
import Partners from './components/Partners'
import Footer from './components/Footer'
import ScrollProgress from './components/ScrollProgress'

export default function App() {
  return (
    <>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Mission />
        <Projects />
        <Campaigns />
        <Team />
        <Partners />
      </main>
      <Footer />
    </>
  )
}
