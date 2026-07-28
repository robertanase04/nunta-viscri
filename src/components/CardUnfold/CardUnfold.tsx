import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CompassStar } from '../Ornament'
import { criticalArtUrls, InkLayer } from '../Illustration/InkLayer'
import { usePreloadAssets } from '../../hooks/usePreloadAssets'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './CardUnfold.css'

const CRITICAL = criticalArtUrls(['panel-left', 'panel-right', 'panel-center'])

interface CardUnfoldProps {
  /** Fires once the cover is open and the page below may be scrolled. */
  onOpen: () => void
}

/**
 * The card that greets you.
 *
 * Shut, it shows the two bordered panels that make up the front. Pressing
 * the button on the seam swings them outward — their insides are blank,
 * because nothing is printed there — and pushes in on the map behind. No
 * dismiss button: once it is open, scrolling carries you into the page.
 */
export function CardUnfold({ onOpen }: CardUnfoldProps) {
  const reduced = useReducedMotion()
  const { progress, done: loaded } = usePreloadAssets(CRITICAL)

  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  const [opened, setOpened] = useState(false)

  const open = useCallback(() => {
    if (opened) return
    setOpened(true)

    if (reduced) {
      gsap.set([left.current, right.current], { autoAlpha: 0 })
      gsap.set(button.current, { autoAlpha: 0 })
      gsap.to(hint.current, { opacity: 0.8, duration: 0.4 })
      onOpen()
      return
    }

    const leftEl = left.current
    const rightEl = right.current
    if (!leftEl || !rightEl) return

    const flaps = [leftEl, rightEl]
    const leftShade = leftEl.querySelector('.shutter-shade')
    const rightShade = rightEl.querySelector('.shutter-shade')
    gsap.set(flaps, { willChange: 'transform' })

    // A pixel of separation so the two shutters and the map never compete
    // for depth order while turning.
    gsap.set(flaps, { z: 1, transformPerspective: 2200 })

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(flaps, { clearProps: 'willChange' })
        onOpen()
      },
    })

    // The button goes first and quickly — it must be out of the way before
    // anything starts moving behind it.
    // Opacity only. The button is centred with a translate in CSS, and
    // handing GSAP a scale here would rewrite the whole transform and drop
    // it back to the top-left corner on its way out.
    tl.to(button.current, { autoAlpha: 0, duration: 0.28, ease: 'power2.in' }, 0)

    // Both shutters swing out. The left one leads by 90ms: released
    // together they read as a mechanism rather than as two hands.
    tl.to(leftEl, { rotationY: -155, duration: 1.5, ease: 'power3.inOut' }, 0.1)
      .to(rightEl, { rotationY: 155, duration: 1.5, ease: 'power3.inOut' }, 0.19)

    // Each face darkens as it turns away from the light, then the whole
    // flap fades as it leaves — otherwise the covers hang around edge-on
    // at the sides of the map like two stray slivers.
    tl.to(leftShade, { opacity: 0.55, duration: 0.8, ease: 'power2.in' }, 0.1)
      .to(rightShade, { opacity: 0.55, duration: 0.8, ease: 'power2.in' }, 0.19)
      .to(leftEl, { autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, 1.05)
      .to(rightEl, { autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, 1.14)

    // The push-in starts while the covers are still moving, so the two
    // read as one gesture instead of a sequence of two.
    tl.to(card.current, { scale: 1.12, duration: 1.5, ease: 'power2.inOut' }, 0.55)

    tl.to(hint.current, { opacity: 0.8, duration: 0.6 }, 1.7)
  }, [opened, reduced, onOpen])

  // Enter and Space arrive as clicks on a real button, so only Escape needs
  // handling — as a way past the cover for anyone who would rather not
  // hunt for it.
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
          <div className="card-centre">
            <InkLayer
              name="panel-center"
              alt="Harta weekendului: vineri la Cetatea Saschiz, sâmbătă la Viscri, duminică la Bike Check-Inn"
              sizes="(max-width: 720px) 86vw, 54vh"
              priority
            />
          </div>

          <div className="shutter shutter-left" ref={left}>
            <div className="shutter-face shutter-front">
              <InkLayer
                name="panel-left"
                alt="Casa Tanase — noi doi, vă chemăm pe voi, pe colinele Transilvaniei"
                sizes="(max-width: 720px) 48vw, 30vh"
                priority
              />
              <div className="shutter-shade" />
            </div>
            <div className="shutter-face shutter-back" />
          </div>

          <div className="shutter shutter-right" ref={right}>
            <div className="shutter-face shutter-front">
              <InkLayer
                name="panel-right"
                alt="Cele mai frumoase ture sunt cele pe care le facem împreună cu voi — detalii practice și dress code"
                sizes="(max-width: 720px) 38vw, 24vh"
                priority
              />
              <div className="shutter-shade" />
            </div>
            <div className="shutter-face shutter-back" />
          </div>

        </div>

        {!opened && (
          <button
            type="button"
            className="open-button"
            ref={button}
            onClick={open}
            aria-label="Deschide invitația"
          >
            <SealStar />
            <span className="caps caps-wide open-button-label">Deschide</span>
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

/** The compass star at button size, without the pale facets. */
function SealStar() {
  return (
    <svg viewBox="-112 -112 224 224" aria-hidden fill="none">
      <g stroke="currentColor" strokeWidth={7} strokeLinejoin="round">
        <path
          fill="currentColor"
          d="M 0 0 L 0 -100 L 13.8 -33.3 Z M 0 0 L 46.7 -46.7 L 33.3 -13.8 Z M 0 0 L 100 0 L 33.3 13.8 Z
             M 0 0 L 46.7 46.7 L 13.8 33.3 Z M 0 0 L 0 100 L -13.8 33.3 Z M 0 0 L -46.7 46.7 L -33.3 13.8 Z
             M 0 0 L -100 0 L -33.3 -13.8 Z M 0 0 L -46.7 -46.7 L -13.8 -33.3 Z"
        />
      </g>
    </svg>
  )
}
