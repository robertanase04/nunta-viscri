import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './RouteLine.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * The cart track that runs the length of the page.
 *
 * This is the one device holding the site together, so it is a single real
 * path rather than a per-section decoration: it is measured through the
 * actual waypoint elements, drawn by scroll position, and the tandem rides
 * it as the progress indicator. Because the geometry is generated from
 * live element offsets it survives reflow, long copy and font swaps —
 * a hand-authored path in a fixed viewBox would drift away from the
 * sections it is supposed to be threading.
 */

/** Elements carrying this attribute are the points the route must pass. */
export const WAYPOINT_ATTR = 'data-waypoint'

interface Waypoint {
  x: number
  y: number
}

/**
 * A cart track through the waypoints.
 *
 * Where consecutive stops sit on opposite sides of the page the swing comes
 * free. Where they stack vertically — which is every stop once the layout
 * collapses to a single column — a straight run would be the result, and a
 * ruled vertical line is not a road. So segments whose endpoints share an x
 * get an alternating lateral bow, and the track keeps meandering at 390px
 * exactly as it does at 1440.
 */
function buildPath(points: readonly Waypoint[], bow: number): string {
  if (points.length < 2) return ''

  // Nudge runs of vertically stacked waypoints alternately left and right.
  // Splining straight through collinear points gives a straight line, and
  // once the layout is a single column every waypoint shares an x.
  const shaped = points.map((p, i) => {
    const prev = points[i - 1]
    const next = points[i + 1]
    const stacked =
      (!prev || Math.abs(p.x - prev.x) < 40) && (!next || Math.abs(p.x - next.x) < 40)
    return stacked ? { x: p.x + bow * (i % 2 === 0 ? 1 : -1), y: p.y } : p
  })

  // Catmull-Rom, converted segment by segment to cubic Beziers. Deriving
  // each segment's handles from its neighbours is what buys curvature
  // continuity at the joins: handles chosen per segment in isolation meet
  // at an angle, and the track came out reading as a bracket rather than
  // as a road.
  const d: string[] = [`M ${shaped[0]!.x.toFixed(1)} ${shaped[0]!.y.toFixed(1)}`]

  for (let i = 0; i < shaped.length - 1; i++) {
    const p0 = shaped[i - 1] ?? shaped[i]!
    const p1 = shaped[i]!
    const p2 = shaped[i + 1]!
    const p3 = shaped[i + 2] ?? p2

    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6

    d.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)},` +
        ` ${c2x.toFixed(1)} ${c2y.toFixed(1)},` +
        ` ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    )
  }

  return d.join(' ')
}

export function RouteLine() {
  const reduced = useReducedMotion()
  const host = useRef<HTMLDivElement>(null)
  const track = useRef<SVGPathElement>(null)
  const drawn = useRef<SVGPathElement>(null)
  const rider = useRef<SVGGElement>(null)

  const [path, setPath] = useState('')
  const [size, setSize] = useState({ w: 0, h: 0 })

  /* --- measure ---------------------------------------------------- */
  useEffect(() => {
    const measure = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(`[${WAYPOINT_ATTR}]`),
      )
      if (nodes.length === 0) return

      const w = document.documentElement.clientWidth
      const h = document.documentElement.scrollHeight

      // Read the true centre of each milestone rather than a fraction of
      // the viewport. Guessing at fractions put the track straight through
      // the body copy, because a centred max-width column and a percentage
      // of the window do not stay in step across breakpoints. Following the
      // real elements means layout decides where the route goes, and the
      // route is correct by construction at every width.
      const points = nodes.map((el) => {
        const r = el.getBoundingClientRect()
        return {
          x: r.left + window.scrollX + r.width / 2,
          y: r.top + window.scrollY + r.height / 2,
        }
      })

      const first = points[0]!
      const last = points[points.length - 1]!

      /* The road stops short of the colophon rather than a fixed distance
         past the last stop. The tandem rides the head of the drawn line, so
         wherever the line ends is where it parks — and measured from the
         last stop it was parking on top of the couple in the heart. Ending
         it against the colophon's own top keeps that clear whatever the
         copy above does to the page length. */
      const colophon = document.querySelector('.colophon')
      const colophonTop = colophon
        ? colophon.getBoundingClientRect().top + window.scrollY
        : last.y + 150
      const tailEnd = Math.max(last.y + 40, colophonTop - 56)

      const full = [
        // Arrives from above the fold...
        { x: first.x, y: 0 },
        ...points,
        // ...and runs out below the final stop, drawn back toward the middle
        // so it points at the centred colophon instead of leaving sideways
        // off whichever edge the last stop happened to sit on.
        { x: (last.x + w / 2) / 2, y: Math.min((last.y + tailEnd) / 2, h) },
        { x: w / 2, y: Math.min(tailEnd, h) },
      ]

      // The bow is only here to keep a run of same-side waypoints from
      // being a ruled vertical; the serpentine itself comes from stops
      // alternating sides. It has to stay inside the lane the layout
      // leaves clear, and every section now holds two waypoints on one
      // side, so a viewport-scaled amplitude put the track through the
      // body copy at full width. Small and fixed is what this wants.
      setSize({ w, h })
      setPath(buildPath(full, 26))
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('load', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('load', measure)
    }
  }, [])

  /* --- draw on scroll --------------------------------------------- */
  useEffect(() => {
    const line = drawn.current
    if (!line || !path) return

    const len = line.getTotalLength()
    gsap.set(line, { strokeDasharray: len })

    if (reduced) {
      // Fully drawn, no scroll coupling. The route is a wayfinding device
      // as much as an effect, so it stays legible either way.
      gsap.set(line, { strokeDashoffset: 0 })
      gsap.set(rider.current, { autoAlpha: 0 })
      return
    }

    gsap.set(line, { strokeDashoffset: len })

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: ({ progress }) => {
        line.style.strokeDashoffset = String(len * (1 - progress))

        // The bicycle travels the line and nothing else. Turning it to face
        // along the tangent is the obvious thing to do and it was wrong:
        // the route runs mostly vertically, so the tangent points down, and
        // the bicycle spent the page lying on its side or upside down. A
        // bicycle is read as an upright symbol — it keeps its bearing.
        const p = line.getPointAtLength(len * progress)
        gsap.set(rider.current, { x: p.x, y: p.y })
      },
    })

    return () => st.kill()
  }, [path, reduced])

  if (!path) return <div ref={host} className="route-host" aria-hidden />

  return (
    <div ref={host} className="route-host" aria-hidden>
      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        fill="none"
      >
        {/* The track as printed: faint, always fully present, so the page
            has a spine even before anything is scrolled. */}
        <path
          ref={track}
          d={path}
          stroke="var(--ink)"
          strokeWidth={2}
          strokeDasharray="7 9"
          strokeLinecap="round"
          opacity={0.16}
        />
        {/* The same track, inked in as you travel it. */}
        <path
          ref={drawn}
          d={path}
          stroke="var(--ink)"
          strokeWidth={2}
          strokeDasharray="7 9"
          strokeLinecap="round"
          opacity={0.62}
        />
        {/* Tread marks between the rails, at a coarser interval. */}
        <path
          d={path}
          stroke="var(--ink)"
          strokeWidth={8}
          strokeDasharray="1.5 14"
          strokeLinecap="round"
          opacity={0.12}
        />

        <g ref={rider} className="route-rider">
          <Tandem />
        </g>
      </svg>
    </div>
  )
}

/**
 * The tandem from the invitation, side on, riding the track.
 *
 * Red, because the plate draws this same tandem in red both times it
 * appears on the map — so the marker that carries you down the page is the
 * one mark you already met up in the card.
 */
function Tandem() {
  return (
    <g
      transform="translate(-26 -14) scale(0.86)"
      fill="none"
      stroke="var(--accent)"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={30} r={11} />
      <circle cx={50} cy={30} r={11} />
      <path d="M 12 30 L 21 13 L 33 13 L 41 30" />
      <path d="M 21 13 L 27 30 L 50 30" />
      <path d="M 33 13 L 38 6 L 45 6" />
      <path d="M 18 13 L 25 13" />
      <path d="M 27 30 L 31 12" />
    </g>
  )
}
