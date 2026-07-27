/**
 * Asset pipeline.
 *
 * The source is ink on paper: a flat JPEG where every light pixel is paper
 * and every dark pixel is ink. Rather than shipping opaque rectangles, we
 * key the paper out into the alpha channel, so each layer becomes an ink
 * stamp. Three things fall out of that:
 *
 *   - layers overlap during parallax with no seams and no paper-on-paper
 *     rectangle edges;
 *   - the CSS paper colour and the procedural grain show through the art
 *     instead of sitting on top of a baked-in background;
 *   - the JPEG's own paper noise is discarded, which is most of what the
 *     encoder spent bits on.
 *
 * Alpha is derived from luminance between a measured paper point and a
 * measured ink point, then gamma-shaped so mid-density hatching keeps its
 * tone instead of collapsing toward either end.
 */

import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets/source/invitation-hi.jpeg')
const OUT = join(ROOT, 'public/art')

/** Measured from the source — see the palette extraction in the README. */
const PAPER_LUM = 231
const INK_LUM = 45
/** <1 lifts mid-density hatching so it does not wash out. */
const ALPHA_GAMMA = 0.78

/**
 * Everything below this coverage is the source JPEG's paper grain, not
 * drawing. It has to be snapped to zero rather than carried: as fine noise
 * spread across the whole alpha channel it was the single most expensive
 * thing in the output, costing more bits than the illustration itself.
 * The site paints its own paper and its own grain, so this is discarded
 * detail we actively do not want.
 */
const PAPER_FLOOR = 0.055

/** The one ink, as measured. See tokens.css on why there is only one. */
const INK_RGB = [30, 42, 54]

/**
 * Regions in source pixels. The panel bounds were found by locating the
 * fold gutters (sustained bright columns) and the border rules (darkest
 * columns) rather than by eye.
 */
const REGIONS = {
  'panel-left': { left: 6, top: 0, width: 444, height: 1024 },
  'panel-center': { left: 462, top: 0, width: 738, height: 1024 },
  'panel-right': { left: 1226, top: 0, width: 304, height: 1024 },

  /* Parallax strata, cut from the centre panel. They overlap deliberately;
     alpha keying means the overlaps are invisible until they move. */
  'layer-sky': { left: 470, top: 0, width: 726, height: 300 },
  'layer-castle': { left: 700, top: 190, width: 496, height: 400 },
  'layer-village': { left: 470, top: 620, width: 726, height: 404 },

  /* Vignettes reused across the site. */
  'crest': { left: 74, top: 150, width: 310, height: 430 },
  'haystacks': { left: 1240, top: 800, width: 280, height: 190 },
  'swallow': { left: 1300, top: 180, width: 160, height: 110 },
  'tree-left': { left: 466, top: 600, width: 190, height: 330 },
}

/** Widths to emit per asset class. */
const WIDTH_SETS = {
  panel: [420, 640, 900, 1200],
  layer: [480, 760, 1100, 1460],
  vignette: [200, 320, 480, 640],
}

const classOf = (name) =>
  name.startsWith('panel-') ? 'panel' : name.startsWith('layer-') ? 'layer' : 'vignette'

/**
 * Replace the image with a single-colour ink stamp whose alpha encodes the
 * original ink density. Done on raw pixels because it is a per-pixel curve,
 * not something sharp exposes.
 */
async function toInkStamp(pipeline) {
  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const px = info.width * info.height
  const out = Buffer.allocUnsafe(px * 4)
  const span = PAPER_LUM - INK_LUM

  for (let i = 0; i < px; i++) {
    const o = i * info.channels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]

    // Rec. 709 luma — the source is near-monochrome so this is faithful.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    let a = (PAPER_LUM - lum) / span
    a = a < 0 ? 0 : a > 1 ? 1 : a

    // Cut the paper grain away, then restretch so real hatching keeps its
    // full range instead of being uniformly thinned by the subtraction.
    a = a <= PAPER_FLOOR ? 0 : (a - PAPER_FLOOR) / (1 - PAPER_FLOOR)
    a = Math.pow(a, ALPHA_GAMMA)

    const q = i * 4
    // A flat RGB plane costs almost nothing to encode and is the honest
    // representation: this is one ink at varying coverage, and coverage is
    // exactly what alpha means.
    out[q] = INK_RGB[0]
    out[q + 1] = INK_RGB[1]
    out[q + 2] = INK_RGB[2]
    out[q + 3] = Math.round(a * 255)
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

/** A 20px WebP standing in for the image until it decodes. */
async function lqip(pipeline) {
  const buf = await pipeline
    .clone()
    .resize(20, null, { fit: 'inside' })
    .webp({ quality: 42, alphaQuality: 60 })
    .toBuffer()
  return `data:image/webp;base64,${buf.toString('base64')}`
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const manifest = {}

  for (const [name, box] of Object.entries(REGIONS)) {
    const stamp = await toInkStamp(sharp(SRC).extract(box))
    const cls = classOf(name)
    const widths = WIDTH_SETS[cls].filter((w) => w <= box.width * 2)
    if (widths.length === 0) widths.push(box.width)

    const emitted = []
    for (const w of widths) {
      const h = Math.round((w / box.width) * box.height)
      const base = stamp.clone().resize(w, h, { kernel: 'lanczos3' })

      const jobs = [
        base.clone().avif({ quality: 60, effort: 6 }).toFile(join(OUT, `${name}-${w}.avif`)),
        base.clone().webp({ quality: 84, alphaQuality: 92, effort: 5 }).toFile(join(OUT, `${name}-${w}.webp`)),
      ]
      // PNG exists only as a floor for browsers with neither AVIF nor WebP,
      // which will not be running the animated build anyway. One size is
      // enough; emitting the full ladder tripled the directory for nobody.
      if (w === widths[0]) {
        jobs.push(base.clone().png({ compressionLevel: 9, palette: true }).toFile(join(OUT, `${name}-${w}.png`)))
      }
      await Promise.all(jobs)
      emitted.push(w)
    }

    manifest[name] = {
      width: box.width,
      height: box.height,
      aspect: +(box.width / box.height).toFixed(4),
      widths: emitted,
      lqip: await lqip(stamp),
    }
    console.log(`  ${name.padEnd(14)} ${box.width}x${box.height}  ->  ${emitted.join(', ')}`)
  }

  await writeFile(
    join(ROOT, 'src/assets/manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  )
  console.log(`\n${Object.keys(manifest).length} regions -> ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
