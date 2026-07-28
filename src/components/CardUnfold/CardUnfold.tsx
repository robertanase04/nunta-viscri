import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CardFrame, CompassStar } from '../Ornament'
import { criticalArtUrls, InkLayer } from '../Illustration/InkLayer'
import { usePreloadAssets } from '../../hooks/usePreloadAssets'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './CardUnfold.css'

const CRITICAL = criticalArtUrls(['cover-left', 'cover-right', 'map'])

/** The whole opening, in seconds. */
const OPEN = 3

/** Each cover leaves at a slightly different moment. */
const SLIDE_DUR = 2.3
const LEAD_LEFT = 0.32
const LEAD_RIGHT = 0.46

interface CardUnfoldProps {
  /** Fires once the cover is open and the page below may be scrolled. */
  onOpen: () => void
}

/**
 * The card that greets you.
 *
 * Shut, it is two equal framed panels meeting at the seam, with a wax seal
 * pressed over the join. Breaking the seal draws the two covers off to
 * either side, the way a pair of doors is slid rather than swung, and
 * leaves the map standing whole. There is no dismiss control — once it is
 * open, scrolling carries you into the page.
 */
export function CardUnfold({ onOpen }: CardUnfoldProps) {
  const reduced = useReducedMotion()
  const { progress, done: loaded } = usePreloadAssets(CRITICAL)

  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const seal = useRef<HTMLButtonElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  const [opened, setOpened] = useState(false)

  const open = useCallback(() => {
    if (opened) return
    setOpened(true)

    const leftEl = left.current
    const rightEl = right.current
    if (!leftEl || !rightEl) return

    if (reduced) {
      gsap.set([leftEl, rightEl, seal.current], { autoAlpha: 0 })
      gsap.to(hint.current, { opacity: 0.8, duration: 0.4 })
      onOpen()
      return
    }

    const flaps = [leftEl, rightEl]
    gsap.set(flaps, { willChange: 'transform' })

    const tl = gsap.timeline({
      onComplete: () => gsap.set(flaps, { clearProps: 'willChange' }),
    })

    // The seal lifts and breaks first, and is gone before anything moves.
    tl.to(seal.current, { scale: 1.16, duration: 0.16, ease: 'power2.out' }, 0)
      .to(seal.current, { scale: 0.82, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0.16)

    /* Each cover is drawn off its own side. A little over its own width, so
       it is clear of the frame before it stops, and the left leads by a
       seventh of a second — released together they read as a mechanism
       rather than as two hands. */
    tl.to(leftEl, { xPercent: -112, duration: SLIDE_DUR, ease: 'power2.inOut' }, LEAD_LEFT)
      .to(rightEl, { xPercent: 112, duration: SLIDE_DUR, ease: 'power2.inOut' }, LEAD_RIGHT)

    /* They dissolve while still travelling, so it reads as one movement.
       Timed from measurement rather than by eye: on a cubic ease the first
       half-second of the slide moves the covers three pixels, which looks
       like nothing happening, and holding the fade until the travel ended
       turned one gesture into two. */
    tl.to([leftEl, rightEl], { opacity: 0, duration: 0.95, ease: 'power1.in' }, LEAD_RIGHT + SLIDE_DUR * 0.52)

    /* The map settles rather than pushing in. What is wanted at the end is
       the whole picture, not a detail of it, so the move is small and it
       finishes at its full size. */
    tl.fromTo(
      card.current,
      { scale: 0.965 },
      { scale: 1, duration: OPEN - 0.5, ease: 'power2.out' },
      0.5,
    )

    tl.call(onOpen, undefined, OPEN)
    tl.to(hint.current, { opacity: 0.8, duration: 0.7 }, OPEN - 0.4)
  }, [opened, reduced, onOpen])

  // Enter and Space arrive as clicks on a real button, so only Escape needs
  // handling — a way past the cover for anyone who would rather not hunt.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const pct = Math.round(progress * 100)

  return (
    <div className="stage" ref={stage} data-open={opened}>
      {!loaded && (
        <div className="preloader">
          <div className="preloader-inner">
            <CompassStar
              className="preloader-star"
              style={{ '--progress': progress } as React.CSSProperties}
            />
            <p className="caps caps-wide preloader-label" aria-live="polite">
              {pct}%
            </p>
          </div>
        </div>
      )}

      <div className="card-viewport">
        <div className="card" ref={card}>
          {/* The map, behind the cover from the start. */}
          <div className="panel panel-map">
            <InkLayer
              name="map"
              alt="Harta weekendului: vineri la Cetatea Saschiz, sâmbătă la Viscri 9, duminică la Bike Check-Inn"
              sizes="(max-width: 720px) 86vw, min(52vw, 62vh)"
              priority
            />
            <CardFrame />
          </div>

          <div className="shutter shutter-left" ref={left}>
            <div className="shutter-face">
              <InkLayer
                name="cover-left"
                alt="Casa Tanase — noi doi, va chemam pe voi, pe colinele Transilvaniei"
                sizes="(max-width: 720px) 43vw, min(26vw, 31vh)"
                priority
              />
              <CardFrame />
            </div>
          </div>

          <div className="shutter shutter-right" ref={right}>
            <div className="shutter-face">
              <InkLayer
                name="cover-right"
                alt="Cele mai frumoase ture sunt cele pe care le facem impreuna cu voi — transport, cazare si dress code"
                sizes="(max-width: 720px) 43vw, min(26vw, 31vh)"
                priority
              />
              <CardFrame />
            </div>
          </div>
        </div>

        {!opened && (
          <button
            type="button"
            className="wax-seal"
            ref={seal}
            onClick={open}
            aria-label="Rupe sigiliul și deschide invitația"
          >
            <WaxSeal />
          </button>
        )}
      </div>

      <div className="scroll-hint" ref={hint} aria-hidden>
        <span className="caps caps-wide">Coboară</span>
        <span className="scroll-hint-rule" />
      </div>
    </div>
  )
}

/**
 * A wax seal: a pressed disc with a scalloped edge and the couple's
 * initials struck into it, under the compass star the plate uses as its
 * mark. Red, which on this invitation is the colour of the couple.
 */
function WaxSeal() {
  const scallops = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2
    const r = 46 + (i % 2 === 0 ? 3.4 : 0)
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`
  })

  return (
    <svg viewBox="-56 -56 112 112" aria-hidden>
      <defs>
        {/* Wax pools thicker at the rim and catches the light off-centre. */}
        <radialGradient id="wax" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#c0303a" />
          <stop offset="58%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-deep)" />
        </radialGradient>
      </defs>

      <polygon points={scallops.join(' ')} fill="url(#wax)" />
      <circle r={38} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth={1.4} />

      {/* The struck impression: highlight above, shadow below, so it reads
          as pressed into the wax rather than printed on it. */}
      <g className="wax-strike" fill="none" strokeLinejoin="round">
        <g transform="translate(0 -1)" stroke="rgb(0 0 0 / 0.28)" strokeWidth={2.2}>
          <Strike />
        </g>
        <g transform="translate(0 1)" stroke="rgb(255 255 255 / 0.3)" strokeWidth={2.2}>
          <Strike />
        </g>
      </g>
    </svg>
  )
}

/** The mark struck into the seal — the compass star, at seal scale. */
function Strike() {
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const r = i % 2 === 0 ? 24 : 15
    pts.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`)
    const b = a + Math.PI / 8
    pts.push(`${(Math.cos(b) * 6).toFixed(1)} ${(Math.sin(b) * 6).toFixed(1)}`)
  }
  return <polygon points={pts.join(' ')} />
}
