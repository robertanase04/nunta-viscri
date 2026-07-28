import type { CSSProperties, SVGProps } from 'react'
import { facetedStar, flourish, polar, pt, spokes } from './geometry'

/**
 * The ornament set, drawn rather than traced.
 *
 * Tracing the printed originals was tried and rejected: a single-threshold
 * trace flattens the lit/shadowed facets these shapes are built from, and
 * every ornament came back as a solid black blob. Drawn from geometry they
 * are a few hundred bytes each, sharp at any zoom, and every facet is a
 * separate path that can be animated on its own.
 *
 * All of them paint with `currentColor`, so they inherit ink from context
 * and need no per-instance colour wiring.
 */

type Decorative = {
  /** Give a label only when the ornament carries meaning on its own. */
  label?: string
  className?: string
  style?: CSSProperties
}

const decorative = (label?: string): Pick<SVGProps<SVGSVGElement>, 'role' | 'aria-label' | 'aria-hidden'> =>
  label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

/* ------------------------------------------------------------------ */

/**
 * The eight-point faceted star. The invitation uses it as a full stop
 * between blocks of type, and at larger size as the preloader.
 */
export function CompassStar({ label, className, style }: Decorative) {
  const { dark, light } = facetedStar({ major: 100, minor: 66, valley: 36 })
  return (
    <svg viewBox="-112 -112 224 224" className={className} style={style} {...decorative(label)}>
      <g stroke="currentColor" strokeWidth={2.8} strokeLinejoin="round">
        <path className="ornament-facet-light" d={light} fill="var(--star-facet)" />
        <path className="ornament-facet-dark" d={dark} fill="currentColor" />
      </g>
    </svg>
  )
}

/**
 * The spoked wheel that pins each corner of the border and punctuates the
 * foot of every panel. A cartwheel and a compass rose at once, which is
 * the whole conceit of the invitation in one mark.
 */
export function Rosette({ label, className, style }: Decorative) {
  const star = facetedStar({ major: 34, minor: 22, valley: 9 })
  return (
    <svg viewBox="-56 -56 112 112" className={className} style={style} {...decorative(label)}>
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle r={50} strokeWidth={4} />
        <circle r={43} strokeWidth={1.6} />
        <path d={spokes(16, 12, 42)} strokeWidth={1.5} />
      </g>
      <g stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
        <path d={star.light} fill="var(--paper)" />
        <path d={star.dark} fill="currentColor" />
      </g>
      <circle r={3.4} fill="var(--paper)" stroke="currentColor" strokeWidth={1.6} />
    </svg>
  )
}

/**
 * Rule, flourish, rule. The invitation sets its quote between two of these.
 */
export function Divider({ label, className, style }: Decorative) {
  return (
    <svg viewBox="0 0 260 30" className={className} style={style} {...decorative(label)}>
      <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
        <line x1={4} y1={15} x2={104} y2={15} />
        <line x1={156} y1={15} x2={256} y2={15} />
      </g>
      <g transform="translate(130 15)">
        <path d={flourish(13, 6.5, 3.4)} fill="currentColor" />
      </g>
    </svg>
  )
}

/**
 * A milestone stone: rounded head, hatched flank, sunken number panel,
 * grass at the foot. The invitation marks 04 and 06 with these; the site
 * reuses them as the anchor for every section along the route.
 */
export function Milestone({
  n,
  label,
  className,
  style,
}: Decorative & { n: string }) {
  return (
    <svg viewBox="0 0 72 104" className={className} style={style} {...decorative(label ?? `Popas ${n}`)}>
      {/* body */}
      <path
        d="M 14 100 L 14 34 A 22 22 0 0 1 58 34 L 58 100 Z"
        fill="var(--paper)"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* hatched flank — the light falls from the upper left throughout */}
      <g stroke="currentColor" strokeWidth={1.2} opacity={0.55}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={17} y1={42 + i * 4.6} x2={24} y2={38 + i * 4.6} />
        ))}
      </g>
      {/* sunken panel */}
      <rect
        x={24}
        y={40}
        width={26}
        height={30}
        rx={4}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        opacity={0.7}
      />
      <text
        x={37}
        y={62}
        textAnchor="middle"
        fill="currentColor"
        style={{ font: '500 19px var(--font-caps)', letterSpacing: '0.02em' }}
      >
        {n}
      </text>
      {/* grass */}
      <g stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" fill="none">
        <path d="M 8 100 q 3 -9 7 -12 M 12 100 q 1 -7 4 -11 M 64 100 q -3 -9 -7 -12 M 60 100 q -1 -7 -4 -11" />
      </g>
    </svg>
  )
}

/**
 * The ribbon cartouche under the crest. Rolled ends with hatching on the
 * curl, a shallow catenary sag across the middle.
 */
export function Ribbon({
  children,
  className,
  style,
}: Omit<Decorative, 'label'> & { children?: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 96" className={className} style={style} aria-hidden>
      <g stroke="currentColor" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
        {/* The tails hang behind the face, so they are drawn first. Each one
            flares outward and down, then rolls back on itself. */}
        <path d="M 62 30 L 20 18 Q 6 26 10 42 Q 14 54 30 50 L 34 38 Q 22 42 20 34 Q 20 26 30 28 Z" fill="var(--paper-warm)" />
        <path d="M 258 30 L 300 18 Q 314 26 310 42 Q 306 54 290 50 L 286 38 Q 298 42 300 34 Q 300 26 290 28 Z" fill="var(--paper-warm)" />

        {/* The face sags between its raised ends — a banner hung from two
            points, not a rectangle. */}
        <path d="M 62 26 Q 160 52 258 26 L 258 62 Q 160 88 62 62 Z" fill="var(--paper)" />

        {/* Where the face meets each tail it folds back under itself. */}
        <path d="M 62 26 L 62 62 Q 50 58 44 48 Q 52 40 62 40" fill="var(--paper-deep)" />
        <path d="M 258 26 L 258 62 Q 270 58 276 48 Q 268 40 258 40" fill="var(--paper-deep)" />
      </g>

      {/* Hatching on the curls only, following their turn. */}
      <g stroke="currentColor" strokeWidth={1} opacity={0.45}>
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`l${i}`} x1={14 + i * 3.4} y1={26 + i * 1.6} x2={20 + i * 3.4} y2={44 + i * 0.8} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`r${i}`} x1={306 - i * 3.4} y1={26 + i * 1.6} x2={300 - i * 3.4} y2={44 + i * 0.8} />
        ))}
      </g>

      {children ? (
        <text
          x={160}
          y={62}
          textAnchor="middle"
          fill="currentColor"
          style={{ font: '500 27px var(--font-display)', letterSpacing: '0.14em' }}
        >
          {children}
        </text>
      ) : null}
    </svg>
  )
}

/**
 * A dotted route segment, drawn as the invitation draws it: two parallel
 * dashed rules with a fainter tread between them, like a cart track.
 */
export function RouteSegment({
  d,
  className,
  style,
}: Omit<Decorative, 'label'> & { d: string }) {
  return (
    <g className={className} style={style} aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeDasharray="7 7" strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={7.5}
        strokeDasharray="1.5 9"
        strokeLinecap="round"
        opacity={0.32}
      />
    </g>
  )
}

/**
 * A swallow in level flight, heading right.
 *
 * The silhouette is the whole job: both wings rake back from the shoulder
 * into a single anchor shape, and the tail streamers trail well behind the
 * body. Drawn symmetrically about the body it reads as a bat instead, which
 * is exactly what a first attempt produced.
 */
export function Swallow({ label, className, style }: Decorative) {
  return (
    <svg viewBox="0 0 120 96" className={className} style={style} {...decorative(label)}>
      <path
        fill="currentColor"
        d="
          M 112 38
          C 106 33 99 30 92 30
          C 84 30 78 33 73 38
          C 62 26 44 14 20 8
          C 34 22 46 36 54 50
          C 44 47 30 45 16 46
          C 30 49 42 54 51 60
          L 40 66
          C 32 71 26 78 22 88
          C 33 79 45 72 57 68
          C 66 65 74 59 80 51
          C 88 48 96 45 104 44
          C 108 43 111 41 112 38
          Z"
      />
      {/* the fork, kept as its own path so it can flick on the wing-beat */}
      <path
        fill="currentColor"
        d="M 52 59 L 10 70 L 26 71 L 14 79 L 46 66 Z"
      />
    </svg>
  )
}

export { polar, pt }

/**
 * The double border with a rosette pinned at each corner.
 *
 * Built from CSS rules and four separately placed rosettes rather than one
 * stretched SVG. The printed frames on the two cover panels are 530 and 436
 * wide against the same height, so showing them as equal rectangles by
 * scaling the raster would have squeezed one set of corner rosettes into
 * ellipses. Drawn this way the rules stretch, the rosettes do not, and all
 * three panels of the card carry the identical frame.
 */
export function CardFrame({ className, style }: Omit<Decorative, 'label'>) {
  return (
    <div className={`card-frame ${className ?? ''}`} style={style} aria-hidden>
      <span className="card-frame-rule card-frame-outer" />
      <span className="card-frame-rule card-frame-inner" />
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <span key={corner} className={`card-frame-rosette card-frame-${corner}`}>
          <Rosette />
        </span>
      ))}
    </div>
  )
}
