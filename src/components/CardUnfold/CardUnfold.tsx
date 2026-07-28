import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CardFrame, CompassStar } from '../Ornament'
import { criticalArtUrls, InkLayer } from '../Illustration/InkLayer'
import { usePreloadAssets } from '../../hooks/usePreloadAssets'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './CardUnfold.css'

const CRITICAL = criticalArtUrls(['cover-left', 'cover-right', 'map'])

/** The open takes three seconds; the covers then fade for three more. */
const OPEN = 3
const FADE = 3

/** How far each cover swings, and over how long. */
const TURN = 152
const TURN_DUR = OPEN * 0.78
const LEAD_LEFT = 0.34
const LEAD_RIGHT = 0.44

/**
 * When a cover passes edge-on, as a fraction of its turn.
 *
 * Rotation is eased power2.inOut, so the quarter turn does not arrive at
 * the halfway mark: solving the ease for 90/152 of the range puts it at
 * 0.548. This is what the printed side is hidden on — see the note in the
 * markup on why there is no second face.
 */
const EDGE_ON = 0.548

interface CardUnfoldProps {
  /** Fires once the cover is open and the page below may be scrolled. */
  onOpen: () => void
}

/**
 * The card that greets you.
 *
 * Shut, it is two equal framed panels meeting at the seam, with a wax seal
 * pressed over the join. Breaking the seal swings them outward to their
 * blank insides and pushes in on the map behind; the covers then fade away
 * over a further three seconds rather than snapping out. There is no
 * dismiss control — once it is open, scrolling carries you into the page.
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
    // A pixel of separation so the covers and the map never compete for
    // depth order while turning.
    gsap.set(flaps, { z: 1, transformPerspective: 2200 })

    const tl = gsap.timeline({
      onComplete: () => gsap.set(flaps, { clearProps: 'willChange' }),
    })

    // The seal lifts and breaks first, and is gone before anything turns.
    tl.to(seal.current, { scale: 1.16, duration: 0.16, ease: 'power2.out' }, 0)
      .to(seal.current, { scale: 0.82, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 0.16)

    // Both covers swing out over most of the three seconds. The left leads
    // by a tenth — released together they read as a mechanism.
    tl.to(leftEl, { rotationY: -TURN, duration: TURN_DUR, ease: 'power2.inOut' }, LEAD_LEFT)
      .to(rightEl, { rotationY: TURN, duration: TURN_DUR, ease: 'power2.inOut' }, LEAD_RIGHT)

    // The printed side is taken off as each cover passes edge-on, which is
    // what turns it into the blank inside. Done on a timed fade rather than
    // with backface-visibility: the face carries `overflow: hidden`, and a
    // grouping property like that drops the element out of the 3D context
    // in Chromium, so the browser kept drawing the front through the back —
    // the invitation's own title, mirrored and upside down.
    const swap = (el: Element, lead: number) =>
      tl.to(el.querySelector('.shutter-print'), {
        autoAlpha: 0,
        duration: 0.22,
        ease: 'power1.inOut',
      }, lead + TURN_DUR * EDGE_ON - 0.11)

    swap(leftEl, LEAD_LEFT)
    swap(rightEl, LEAD_RIGHT)

    // Each face darkens as it turns away from the light.
    tl.to(leftEl.querySelector('.shutter-shade'), { opacity: 0.42, duration: 1.2, ease: 'power1.in' }, LEAD_LEFT)
      .to(rightEl.querySelector('.shutter-shade'), { opacity: 0.42, duration: 1.2, ease: 'power1.in' }, LEAD_RIGHT)

    // The push-in runs underneath the turn so the two read as one gesture.
    tl.to(card.current, { scale: 1.1, duration: OPEN - 0.6, ease: 'power2.inOut' }, 0.6)

    // The page is handed over as soon as the map is clear — the covers are
    // still fading at this point, and waiting for them would leave the
    // reader looking at a finished picture with nothing to do.
    tl.call(onOpen, undefined, OPEN)

    // And then they go, slowly.
    tl.to([leftEl, rightEl], { autoAlpha: 0, duration: FADE, ease: 'power1.inOut' }, OPEN)

    tl.to(hint.current, { opacity: 0.8, duration: 0.8 }, OPEN + 0.4)
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
              {/* Only the printing is removed as the cover turns past
                  edge-on. The paper and the frame stay: the frame is
                  symmetric, so mirrored it is indistinguishable, and what
                  is left reads as exactly what it is — the blank inside. */}
              <div className="shutter-print">
                <InkLayer
                  name="cover-left"
                  alt="Casa Tanase — noi doi, vă chemăm pe voi, pe colinele Transilvaniei"
                  sizes="(max-width: 720px) 43vw, min(26vw, 31vh)"
                  priority
                />
              </div>
              <CardFrame />
              <div className="shutter-shade" />
            </div>
          </div>

          <div className="shutter shutter-right" ref={right}>
            <div className="shutter-face">
              {/* Only the printing is removed as the cover turns past
                  edge-on. The paper and the frame stay: the frame is
                  symmetric, so mirrored it is indistinguishable, and what
                  is left reads as exactly what it is — the blank inside. */}
              <div className="shutter-print">
                <InkLayer
                  name="cover-right"
                  alt="Cele mai frumoase ture sunt cele pe care le facem împreună cu voi — transport, cazare și dress code"
                  sizes="(max-width: 720px) 43vw, min(26vw, 31vh)"
                  priority
                />
              </div>
              <CardFrame />
              <div className="shutter-shade" />
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
