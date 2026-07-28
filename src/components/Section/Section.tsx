import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Milestone } from '../Ornament'
import { WAYPOINT_ATTR } from '../RouteLine/RouteLine'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { T } from '../../copy'
import './Section.css'

gsap.registerPlugin(ScrollTrigger)

interface SectionProps {
  id: string
  /** Shown on the milestone stone that anchors this stop on the route. */
  stop: string
  title: string
  /** Which side of the route this section hangs off. */
  side?: 'left' | 'right' | 'center'
  children: ReactNode
}

export function Section({ id, stop, title, side = 'center', children }: SectionProps) {
  const reduced = useReducedMotion()
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduced) return

    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]')

      reveals.forEach((el) => {
        // A wipe along the reading direction, not a fade-up. Fade-up is the
        // default of every scroll library there is, and it shows.
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 100% 0 0)', y: 12 },
          {
            clipPath: 'inset(0 0% 0 0)',
            y: 0,
            duration: 0.95,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          },
        )
      })
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section id={id} ref={root} className="section" data-side={side}>
      <div className="section-stone" {...{ [WAYPOINT_ATTR]: side }}>
        <Milestone n={stop} label={T.stopLabel(stop, title)} />
      </div>

      <div className="section-body">
        <h2 className="section-title" data-reveal>
          {title}
        </h2>
        {children}
      </div>

      {/* A second, invisible waypoint at the foot of the section, on the same
          side as the stone. Without it the route left a stop at the top of one
          section and made straight for the next one's stop on the opposite
          side, which meant descending diagonally through the body copy it was
          supposed to be running alongside. Anchoring the exit keeps the track
          hugging its own margin for the length of the section and confines the
          crossing to the gap between sections. */}
      <span className="section-exit" aria-hidden {...{ [WAYPOINT_ATTR]: side }} />
    </section>
  )
}
