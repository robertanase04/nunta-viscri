/**
 * Shared construction for the engraved ornaments.
 *
 * Every ornament on the invitation is built from the same two moves:
 * points radiating from a centre, and rays split lengthwise into a lit
 * facet and a shadowed one. Generating them from geometry rather than
 * transcribing path data keeps the family coherent — change the light
 * angle here and every ornament turns with it.
 */

export type Point = readonly [number, number]

/** Polar to cartesian, with 0deg pointing up the way a compass reads. */
export function polar(angleDeg: number, radius: number): Point {
  const t = ((angleDeg - 90) * Math.PI) / 180
  return [radius * Math.cos(t), radius * Math.sin(t)]
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString()
export const pt = (p: Point) => `${fmt(p[0])} ${fmt(p[1])}`

export interface StarOptions {
  /** Radius of the four cardinal points. */
  major: number
  /** Radius of the four diagonal points. */
  minor: number
  /** Radius at which adjacent points meet — controls how fat a ray is. */
  valley: number
  /** Number of points. Eight everywhere on the invitation. */
  points?: number
}

/**
 * A faceted star as two path strings: the shadowed halves and the lit
 * halves. Kept separate so they can be filled differently and animated
 * independently — the preloader sweeps light around the star by
 * transforming one of the two.
 */
export function facetedStar({
  major,
  minor,
  valley,
  points = 8,
}: StarOptions): { dark: string; light: string } {
  const step = 360 / points
  const half = step / 2
  const dark: string[] = []
  const light: string[] = []

  for (let i = 0; i < points; i++) {
    const a = i * step
    const r = i % 2 === 0 ? major : minor
    const tip = polar(a, r)
    const left = polar(a - half, valley)
    const right = polar(a + half, valley)

    light.push(`M ${pt(left)} L ${pt(tip)} L 0 0 Z`)
    dark.push(`M 0 0 L ${pt(tip)} L ${pt(right)} Z`)
  }

  return { dark: dark.join(' '), light: light.join(' ') }
}

/** Evenly spaced spokes, as one path. Used by the wheel rosette. */
export function spokes(count: number, inner: number, outer: number): string {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const a = (i * 360) / count
    out.push(`M ${pt(polar(a, inner))} L ${pt(polar(a, outer))}`)
  }
  return out.join(' ')
}

/**
 * The four-petal flourish that sits between rules on the divider: long
 * cardinal petals, short diagonal ones, each a lens rather than a triangle.
 */
export function flourish(major: number, minor: number, waist: number): string {
  const out: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = i * 45
    const r = i % 2 === 0 ? major : minor
    const tip = polar(a, r)
    const l = polar(a - 45, waist)
    const rt = polar(a + 45, waist)
    out.push(`M 0 0 Q ${pt(l)} ${pt(tip)} Q ${pt(rt)} 0 0 Z`)
  }
  return out.join(' ')
}
