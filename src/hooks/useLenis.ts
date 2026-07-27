import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from './useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth scrolling, driven from GSAP's ticker rather than its own rAF loop.
 *
 * Two loops reading and writing scroll position in the same frame is how
 * smooth-scroll libraries and ScrollTrigger end up fighting: the page
 * judders and pinned elements drift. One ticker, one update, one layout
 * read per frame.
 */
export function useLenis(): void {
  const reduced = useReducedMotion()

  useEffect(() => {
    // Someone who has asked for less motion did not ask for scrolling to
    // acquire momentum they did not initiate.
    if (reduced) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [reduced])
}
