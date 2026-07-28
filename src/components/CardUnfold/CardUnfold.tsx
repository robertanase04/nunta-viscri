import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CardFrame, CompassStar } from '../Ornament'
import { criticalArtUrls, InkLayer } from '../Illustration/InkLayer'
import { usePreloadAssets } from '../../hooks/usePreloadAssets'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { T } from '../../copy'
import './CardUnfold.css'

const CRITICAL = criticalArtUrls(['cover-left', 'cover-right', 'map'])

/** The whole opening, in seconds. */
const OPEN = 3

/**
 * How much the assembly must shrink for all three panels to fit.
 *
 * Shut, the card measures the map alone; open, the two covers sit outside
 * it and the whole thing is twice as wide. Anything narrower than that has
 * to scale, so this is measured against the real viewport rather than
 * guessed at a breakpoint.
 */
function openScale(card: HTMLElement): number {
  const w = card.getBoundingClientRect().width
  if (w === 0) return 1
  return Math.min(1, (window.innerWidth * 0.94) / (w * 2))
}

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
 * pressed over the join. Breaking the seal draws the two covers apart —
 * slid, not swung — until they come to rest flanking the map, and what is
 * left standing is the whole invitation, all three panels of it. There is
 * no dismiss control: once it is open, scrolling carries you into the page.
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
    const cardEl = card.current
    if (!leftEl || !rightEl || !cardEl) return

    if (reduced) {
      // The same finished state, arrived at rather than performed.
      gsap.set(seal.current, { autoAlpha: 0 })
      gsap.set(leftEl, { xPercent: -100 })
      gsap.set(rightEl, { xPercent: 100 })
      gsap.set(cardEl, { scale: openScale(cardEl) })
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

    /* Each cover is drawn aside by exactly its own width, which lands it
       flush against the map rather than off the card. They stay: what the
       opening reveals is the whole invitation, all three panels of it, not
       the middle one on its own.

       The left leads by a seventh of a second — released together they read
       as a mechanism rather than as two hands. */
    tl.to(leftEl, { xPercent: -100, duration: SLIDE_DUR, ease: 'power2.inOut' }, LEAD_LEFT)
      .to(rightEl, { xPercent: 100, duration: SLIDE_DUR, ease: 'power2.inOut' }, LEAD_RIGHT)

    /* Open, the spread is twice as wide as the shut card, so it has to be
       drawn back to fit. Measured rather than assumed: at a laptop size it
       already fits and nothing moves, while on a phone it has to come down
       to about half. */
    tl.to(cardEl, { scale: openScale(cardEl), duration: SLIDE_DUR, ease: 'power2.inOut' }, LEAD_LEFT)

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
              alt={T.intro.altMap}
              sizes="(max-width: 720px) 86vw, min(52vw, 62vh)"
              priority
            />
            <CardFrame />
          </div>

          <div className="shutter shutter-left" ref={left}>
            <div className="shutter-face">
              <InkLayer
                name="cover-left"
                alt={T.intro.altCoverLeft}
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
                alt={T.intro.altCoverRight}
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
            aria-label={T.intro.seal}
          >
            <WaxSeal />
          </button>
        )}
      </div>

      <div className="scroll-hint" ref={hint} aria-hidden>
        <span className="caps caps-wide">{T.intro.scroll}</span>
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
