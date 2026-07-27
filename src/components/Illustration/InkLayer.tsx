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
          // Reserving the box is the whole of the layout-shift story here;
          // there is deliberately no blur-up placeholder behind the image.
          // These layers have a transparent ground, so an opaque thumbnail
          // sitting underneath is not covered when the real image decodes —
          // it stays visible through every part of the art that is meant to
          // be paper, as a grey rectangle around the drawing.
          aspectRatio: `${meta.width} / ${meta.height}`,
          width: '100%',
          height: 'auto',
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
