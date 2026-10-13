import { useState, useEffect } from 'react'
import { NAV_LINKS } from './data'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  const [active, setActive] = useState('Home')

  // Track which section is in view for nav highlight
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.toLowerCase())
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const match = NAV_LINKS.find((l) => l.toLowerCase() === entry.target.id)
            if (match) setActive(match)
          }
        })
      },
      { threshold: 0.4 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <div>
      <Navbar active={active} setActive={setActive} />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
