import type { CSSProperties } from 'react'
import manifest from '../../assets/manifest.json'

/**
 * One layer of the engraving, served responsively.
 *
 * The exported art is an ink stamp with a transparent ground, so these
 * composite over the page's paper rather than carrying their own. Aspect
 * ratio comes from the manifest and is applied as a style, which is what
 * keeps cumulative layout shift at zero — the box is correct before a
 * single byte of image arrives.
 */

export type LayerName = keyof typeof manifest

interface InkLayerProps {
  name: LayerName
  /** Descriptive text, or empty string for purely decorative layers. */
  alt: string
  /** Matches the CSS box this renders into; drives which width is fetched. */
  sizes: string
  priority?: boolean
  className?: string
  style?: CSSProperties
}

const srcset = (name: LayerName, ext: string) =>
  manifest[name].widths.map((w) => `/art/${name}-${w}.${ext} ${w}w`).join(', ')

export function InkLayer({
  name,
  alt,
  sizes,
  priority = false,
  className,
  style,
}: InkLayerProps) {
  const meta = manifest[name]
  const fallbackWidth = meta.widths[0]

  return (
    <picture>
      <source type="image/avif" srcSet={srcset(name, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(name, 'webp')} sizes={sizes} />
      <img
        src={`/art/${name}-${fallbackWidth}.png`}
        alt={alt}
        width={meta.width}
        height={meta.height}
        className={className}
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        // Lowercase: React 18 passes this straight through to the DOM and
        // warns on the camelCase spelling.
        {...(priority ? { fetchpriority: 'high' } : {})}
        style={{
          aspectRatio: `${meta.width} / ${meta.height}`,
          width: '100%',
          height: 'auto',
          // The blurred stand-in is painted behind the image, so it is
          // covered the instant the real one decodes — no crossfade needed
          // and nothing to clean up.
          backgroundImage: `url("${meta.lqip}")`,
          backgroundSize: 'cover',
          ...style,
        }}
      />
    </picture>
  )
}

/** URLs the opening sequence must have in hand before it can start. */
export function criticalArtUrls(names: readonly LayerName[]): string[] {
  return names.map((n) => {
    const widths = manifest[n].widths
    const w = widths[Math.min(1, widths.length - 1)]
    return `/art/${n}-${w}.webp`
  })
}
