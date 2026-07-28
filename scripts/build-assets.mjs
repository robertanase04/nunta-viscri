/**
 * Asset pipeline.
 *
 * The source is ink on paper: every light pixel is paper, every dark one is
 * printing. Rather than shipping opaque rectangles, the paper is keyed out
 * into the alpha channel so each region becomes a stamp. Three things fall
 * out of that:
 *
 *   - regions overlap without seams and without paper-on-paper edges;
 *   - the CSS paper colour and the procedural grain show through the art
 *     instead of sitting on top of a baked-in background;
 *   - the source's paper noise is discarded, which is most of what the
 *     encoder would otherwise spend bits on.
 *
 * Alpha is derived from luminance between a measured paper point and a
 * measured ink point, then gamma-shaped so mid-density hatching keeps its
 * tone instead of collapsing toward either end.
 */

import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets/source/invitation-v2.png')
const OUT = join(ROOT, 'public/art')

/** Measured from the source — see the palette extraction in tokens.css. */
const PAPER_LUM = 236
const INK_LUM = 60
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

/**
 * What to paint the fully transparent pixels.
 *
 * This invitation is printed in two colours, so unlike the first one the
 * artwork's own RGB has to survive — flattening everything to a single ink
 * turned the red hearts and the red hours blue. Colour is therefore kept
 * wherever there is coverage, and only the empty ground is filled with a
 * constant. That still leaves roughly two thirds of every tile as one flat
 * value, which is where the encoding saving came from in the first place.
 */
const VOID_RGB = [45, 85, 153]

/**
 * Regions in source pixels. The panel bounds were found by locating the
 * fold gutters (sustained bright columns) and the border rules (darkest
 * columns) rather than by eye.
 */
const REGIONS = {
  /* Panels. The fold gutters were located as sustained bright columns and
     the borders as the darkest ones. The two cover flaps are not the same
     width — 517 against 416 — which the layout has to account for rather
     than assume symmetry. */
  'panel-left': { left: 8, top: 0, width: 517, height: 1333 },
  'panel-center': { left: 568, top: 0, width: 977, height: 1333 },
  'panel-right': { left: 1580, top: 0, width: 416, height: 1333 },

  /* Vignettes lifted off the centre map, read from a coordinate grid. */
  'cetatea': { left: 588, top: 85, width: 285, height: 255 },
  'casa-viscri': { left: 1025, top: 488, width: 420, height: 268 },
  'bike-inn': { left: 572, top: 938, width: 302, height: 252 },
  'satul': { left: 1292, top: 1126, width: 242, height: 155 },

  /* The red tandem that closes the map, kept for the page footer. */
  'tandem-rosu': { left: 1146, top: 1196, width: 98, height: 90 },

  /* And off the two cover panels. */
  'tandem': { left: 88, top: 330, width: 372, height: 362 },
  'indicatoare': { left: 1596, top: 978, width: 198, height: 172 },
  'cuplu-inima': { left: 1628, top: 172, width: 305, height: 285 },
}

/** Widths to emit per asset class. */
const WIDTH_SETS = {
  panel: [480, 720, 1000, 1400],
  vignette: [220, 360, 520, 700],
}

const classOf = (name) => (name.startsWith('panel-') ? 'panel' : 'vignette')

/**
 * Turn the tile into an ink stamp: paper keyed out into alpha, the plate's
 * own two colours kept. Done on raw pixels because it is a per-pixel curve,
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

    // Rec. 709 luma. Coverage only — which colour it is stays in RGB.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    let a = (PAPER_LUM - lum) / span
    a = a < 0 ? 0 : a > 1 ? 1 : a

    // Cut the paper grain away, then restretch so real hatching keeps its
    // full range instead of being uniformly thinned by the subtraction.
    a = a <= PAPER_FLOOR ? 0 : (a - PAPER_FLOOR) / (1 - PAPER_FLOOR)
    a = Math.pow(a, ALPHA_GAMMA)

    const q = i * 4
    if (a === 0) {
      // Nothing drawn here. A constant compresses to almost nothing, and
      // the value is invisible anyway at zero alpha — but it must be a
      // constant, since carrying the source's paper noise through was what
      // made the first version of this pipeline cost megabytes a tile.
      out[q] = VOID_RGB[0]
      out[q + 1] = VOID_RGB[1]
      out[q + 2] = VOID_RGB[2]
      out[q + 3] = 0
    } else {
      out[q] = r
      out[q + 1] = g
      out[q + 2] = b
      out[q + 3] = Math.round(a * 255)
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
}

async function main() {
  await mkdir(OUT, { recursive: true })

  // Optional name filter, so re-cropping one region does not mean waiting
  // out an encode of all ten. The manifest is merged, never replaced.
  const only = process.argv[2]
  const manifest = only
    ? JSON.parse(await readFile(join(ROOT, 'src/assets/manifest.json'), 'utf8'))
    : {}

  for (const [name, box] of Object.entries(REGIONS)) {
    if (only && !name.includes(only)) continue
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
