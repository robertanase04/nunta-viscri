import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CompassStar, Rosette } from '../Ornament'
import { criticalArtUrls, InkLayer } from '../Illustration/InkLayer'
import { usePreloadAssets } from '../../hooks/usePreloadAssets'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import './CardUnfold.css'

const CRITICAL = criticalArtUrls(['panel-center', 'panel-left', 'panel-right'])
const SEEN_KEY = 'viscri:intro-seen'

interface CardUnfoldProps {
  onDone: () => void
}

/** Whether to replay is the caller's decision — see `shouldPlayIntro`. */
export function CardUnfold({ onDone }: CardUnfoldProps) {
  const reduced = useReducedMotion()
  const { progress, done: loaded } = usePreloadAssets(CRITICAL)

  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)

  const [finished, setFinished] = useState(false)

  /** Runs on skip, on completion, and on Escape — must be idempotent. */
  const finish = useCallback(() => {
    setFinished((already) => {
      if (already) return true
      timeline.current?.kill()
      sessionStorage.setItem(SEEN_KEY, '1')
      gsap.to(stage.current, {
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        onComplete: onDone,
      })
      return true
    })
  }, [onDone])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  useEffect(() => {
    if (!loaded || finished) return

    // Already open, cross-fade only. Reduced motion means no vestibular
    // load, not a stripped-down page.
    if (reduced) {
      const t = window.setTimeout(finish, 900)
      return () => window.clearTimeout(t)
    }

    let built: gsap.core.Timeline | undefined

    const ctx = gsap.context(() => {
      const flaps = [left.current, right.current].filter(Boolean)
      // Confined to the flaps, and cleared the moment they stop: leaving
      // will-change on promotes layers that then sit around costing memory.
      gsap.set(flaps, { willChange: 'transform' })

      const tl = gsap.timeline({
        defaults: { ease: 'power4.out' },
        onComplete: () => {
          gsap.set(flaps, { willChange: 'auto', clearProps: 'willChange' })
        },
      })

      // --- the fold opens -------------------------------------------
      // A touch past flat, then settling back, the way stiff paper does.
      // The z offset is what makes the shut card read as shut: folded flat,
      // a flap lands within a couple of degrees of the centre panel, and
      // two near-coplanar surfaces sort unpredictably. Lifting the flaps
      // proves which is on top — and it is also simply true, since folded
      // paper lies over what it covers.
      tl.fromTo(
        left.current,
        { rotateY: -178, z: 12 },
        { rotateY: 2.5, z: 0, duration: 1.35 },
        0,
      )
        .to(left.current, { rotateY: 0, duration: 0.42, ease: 'power2.inOut' }, 1.35)
        // The right flap starts late. Perfect symmetry reads as machinery.
        .fromTo(
          right.current,
          { rotateY: 178, z: 12 },
          { rotateY: -2.5, z: 0, duration: 1.35 },
          0.14,
        )
        .to(right.current, { rotateY: 0, duration: 0.42, ease: 'power2.inOut' }, 1.49)

      // Fold shading tracks the angle: strongest edge-on, gone when flat.
      tl.fromTo(
        card.current,
        { '--fold-shade': 1, '--crease': 0.9 },
        { '--fold-shade': 0, '--crease': 0, duration: 1.5, ease: 'power2.out' },
        0.1,
      )

      // The cast shadow spreads as the card opens out.
      tl.fromTo(
        card.current,
        { '--shadow-width': '52%', '--shadow-opacity': 0.55 },
        { '--shadow-width': '96%', '--shadow-opacity': 0.32, duration: 1.6 },
        0,
      )

      // Re-centre as the card grows past its closed silhouette.
      tl.fromTo(
        card.current,
        { '--card-offset': '-4.7%' },
        { '--card-offset': '0%', duration: 1.5 },
        0.1,
      )

      // --- the camera settles in ------------------------------------
      tl.fromTo(
        card.current,
        { '--card-scale': 1 },
        { '--card-scale': 1.04, duration: 0.85, ease: 'power2.inOut' },
        1.2,
      )

      // --- and only then, the invitation to move on -----------------
      tl.to(hint.current, { opacity: 0.75, duration: 0.6 }, 2.05)

      built = tl
    }, stage)

    // Captured from inside the context rather than read off ctx.data:
    // data[0] is the willChange `set`, not the timeline, so indexing into
    // it silently handed back a zero-duration tween — which made skip kill
    // the wrong object and left the real sequence running underneath.
    timeline.current = built ?? null

    // Dev-only handle so the sequence can be paused and seeked frame by
    // frame from a screenshot script. Timing-based capture cannot hold
    // still long enough to judge a 2-second fold — each screenshot costs
    // more than the frame it is trying to catch.
    if (import.meta.env.DEV) {
      ;(window as unknown as { __intro: gsap.core.Timeline | null }).__intro = timeline.current
    }

    return () => ctx.revert()
  }, [loaded, reduced, finished, finish])

  const pct = Math.round(progress * 100)

  return (
    <div className="stage" ref={stage} data-done={finished} role="presentation">
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
          <div className="card-shadow" />

          <div className="panel panel-left" ref={left}>
            <div className="panel-face">
              <InkLayer
                name="panel-left"
                alt="Isabella și Alin — 4, 5 și 6 septembrie 2026, weekend în Viscri"
                sizes="(max-width: 720px) 0px, 30vw"
                priority
              />
              <div className="fold-shade" />
            </div>
            <div className="panel-face panel-face-back">
              <Rosette />
            </div>
          </div>

          <div className="panel panel-center">
            <div className="panel-face">
              <InkLayer
                name="panel-center"
                alt="Harta celor trei zile: vineri, sâmbătă și duminică, de-a lungul drumului spre Viscri"
                sizes="(max-width: 720px) 84vw, 50vw"
                priority
              />
            </div>
          </div>

          <div className="panel panel-right" ref={right}>
            <div className="panel-face">
              <InkLayer
                name="panel-right"
                alt="Cele mai bune drumuri sunt cele pe care le facem împreună — Viscri, Transilvania"
                sizes="(max-width: 720px) 0px, 21vw"
                priority
              />
              <div className="fold-shade" />
            </div>
            <div className="panel-face panel-face-back">
              <Rosette />
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-hint" ref={hint} aria-hidden>
        <span className="caps caps-wide">Coboară</span>
        <span className="scroll-hint-rule" />
      </div>

      <button type="button" className="skip caps" onClick={finish}>
        Sari peste
      </button>
    </div>
  )
}

/** Whether the sequence should run at all this session. */
export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SEEN_KEY) !== '1'
}

export { SEEN_KEY }
