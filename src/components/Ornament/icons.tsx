import type { CSSProperties } from 'react'

/**
 * The programme icons, matched to the ones printed on the invitation.
 *
 * Every one is stroke-only with no fills, and every path carries
 * `pathLength={1}`. That makes "redraw the icon" a single normalised
 * dashoffset tween regardless of how long the real geometry is, so the
 * whole set redraws at the same rate on hover — which a fill-based icon
 * set simply cannot do.
 */

export type IconName =
  | 'bicycle'
  | 'glass'
  | 'cutlery'
  | 'church'
  | 'feast'
  | 'music'
  | 'bonfire'
  | 'cup'
  | 'heart'

interface IconProps {
  name: IconName
  label: string
  className?: string
  style?: CSSProperties
}

/** Path data only — the wrapper supplies stroke, size and semantics. */
const PATHS: Record<IconName, readonly string[]> = {
  bicycle: [
    'M 17 39 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0',
    'M 47 39 m -9 0 a 9 9 0 1 0 18 0 a 9 9 0 1 0 -18 0',
    'M 17 39 L 27 20 L 40 20',
    'M 27 20 L 34 39 L 47 39',
    'M 24 20 L 31 20',
    'M 40 20 L 43 14 L 49 14',
  ],
  glass: [
    'M 20 12 L 44 12 L 41 26 A 9 9 0 0 1 23 26 Z',
    'M 32 35 L 32 48',
    'M 23 50 L 41 50',
  ],
  cutlery: [
    'M 22 10 L 22 26 M 27 10 L 27 26 M 17 10 L 17 26',
    'M 22 26 L 22 52',
    'M 45 10 q 6 4 6 13 q 0 7 -6 8 L 45 52',
  ],
  church: [
    'M 32 6 L 32 14 M 28 10 L 36 10',
    'M 32 14 L 46 30 L 46 52 L 18 52 L 18 30 Z',
    'M 32 34 m -5 0 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0',
    'M 27 52 L 27 42 a 5 5 0 0 1 10 0 L 37 52',
  ],
  feast: [
    'M 32 34 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0',
    'M 32 34 m -7 0 a 7 7 0 1 0 14 0 a 7 7 0 1 0 -14 0',
    'M 8 20 L 8 34 M 5 20 L 5 27 M 11 20 L 11 27',
    'M 56 20 q 4 4 4 10 q 0 4 -4 4 L 56 48',
  ],
  music: [
    'M 26 44 m -7 0 a 7 5 0 1 0 14 0 a 7 5 0 1 0 -14 0',
    'M 33 44 L 33 12 L 50 8 L 50 38',
    'M 43 38 m -7 0 a 7 5 0 1 0 14 0 a 7 5 0 1 0 -14 0',
    'M 33 22 L 50 18',
  ],
  bonfire: [
    'M 32 10 q 9 10 9 18 a 9 9 0 0 1 -18 0 q 0 -8 9 -18 Z',
    'M 32 26 q 4 5 4 8 a 4 4 0 0 1 -8 0 q 0 -3 4 -8 Z',
    'M 12 50 L 52 42 M 12 42 L 52 50',
  ],
  cup: [
    'M 16 20 L 44 20 L 42 42 a 8 8 0 0 1 -8 7 L 26 49 a 8 8 0 0 1 -8 -7 Z',
    'M 44 25 q 9 0 9 7 q 0 7 -9 7',
    'M 14 56 L 48 56',
    'M 26 8 q -3 4 0 8 M 34 8 q -3 4 0 8',
  ],
  heart: [
    'M 32 50 C 14 38 10 28 10 22 a 11 11 0 0 1 22 -4 a 11 11 0 0 1 22 4 c 0 6 -4 16 -22 28 Z',
  ],
}

export function Icon({ name, label, className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      role="img"
      aria-label={label}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} pathLength={1} />
      ))}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS) as readonly IconName[]
