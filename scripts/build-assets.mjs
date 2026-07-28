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
const INK_LUM = 50
/**
 * <1 lifts mid-density ink. This plate is set in fine hairline type and
 * the card is shown at roughly a quarter of the source width, so every
 * stroke is fighting the downscale; at 0.78 the result read visibly
 * lighter than the printed original.
 */
const ALPHA_GAMMA = 0.6

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
  /* The two cover panels, cropped to the inside of their printed borders.
     The borders themselves are left behind and redrawn in the markup: the
     printed frames are 530 and 436 wide against a common height, so any
     attempt to show them as two equal rectangles either letterboxes one or
     stretches the other — and stretching turns the corner rosettes, which
     are circles, into ellipses. Drawn frames are identical by construction
     and stay circular whatever the panel is scaled to.

     Bounds found by scanning for the columns and rows carrying a full
     height of ink, which is what a border rule is and body copy is not. */
  'cover-left': { left: 53, top: 51, width: 461, height: 1260 },
  /* Padded out to the left panel's width with transparent margin, so the
     two covers share one aspect ratio and seat identically inside identical
     frames. The margin reads as paper because the stamp composites over it. */
  'cover-right': { left: 1584, top: 51, width: 360, height: 1260, padTo: 461 },

  /* The map, taken between its own border rules — full-height columns of
     ink at 569 and 1527, distinct from the fold rule at 545. Cropping to
     547 pulled that rule into the picture, which then showed up as a stray
     line down the left edge of the map and of every vignette lifted from
     it. There are no matching rules top or bottom; the drawing bleeds. */
  'map': { left: 571, top: 18, width: 956, height: 1298 },

  /* Vignettes lifted off the map. Every one of these was cropped too
     tight on the first pass — the fortress lost its right wall, the house
     its left gable, the halt everything below the sign. Each is now taken
     to the edge of its own drawing with a little paper left around it,
     because these are shown whole on the page rather than as thumbnails
     that can be trimmed. */
  'cetatea': { left: 573, top: 52, width: 327, height: 300 },
  'casa-viscri': { left: 1004, top: 468, width: 458, height: 324 },
  'bike-inn': { left: 573, top: 880, width: 327, height: 436 },
  'satul': { left: 1298, top: 1126, width: 236, height: 158 },

  /* The red tandem that closes the map, kept for the page footer. */
  'tandem-rosu': { left: 1146, top: 1196, width: 98, height: 90 },

  /* And off the two cover panels. */
  'tandem': { left: 74, top: 300, width: 400, height: 462 },
  'indicatoare': { left: 1596, top: 978, width: 198, height: 172 },
  'cuplu-inima': { left: 1628, top: 172, width: 305, height: 285 },
}

/** Widths to emit per asset class. */
const WIDTH_SETS = {
  panel: [480, 720, 1000, 1400],
  vignette: [220, 360, 520, 700],
}

const classOf = (name) =>
  name.startsWith('cover-') || name === 'map' ? 'panel' : 'vignette'

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
    const { padTo, ...crop } = box
    let stamp = await toInkStamp(sharp(SRC).extract(crop))

    if (padTo) {
      const total = padTo - crop.width
      const leftPad = Math.floor(total / 2)
      stamp = sharp(
        await stamp
          .extend({
            left: leftPad,
            right: total - leftPad,
            background: { r: VOID_RGB[0], g: VOID_RGB[1], b: VOID_RGB[2], alpha: 0 },
          })
          .png()
          .toBuffer(),
      )
    }
    const cls = classOf(name)
    const srcW = padTo ?? crop.width
    const srcH = crop.height
    const widths = WIDTH_SETS[cls].filter((w) => w <= srcW * 2)
    if (widths.length === 0) widths.push(srcW)

    const emitted = []
    for (const w of widths) {
      const h = Math.round((w / srcW) * srcH)
      // A light sharpen after the resize. Reducing a hairline engraving to
      // a quarter of its size softens every stroke, and on ink whose weight
      // lives entirely in the alpha channel that reads as faded printing
      // rather than as a small image.
      const base = stamp
        .clone()
        .resize(w, h, { kernel: 'lanczos3' })
        .sharpen({ sigma: 0.7, m1: 0.4, m2: 0.9 })

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
      width: srcW,
      height: srcH,
      aspect: +(srcW / srcH).toFixed(4),
      widths: emitted,
    }
    console.log(`  ${name.padEnd(14)} ${srcW}x${srcH}  ->  ${emitted.join(', ')}`)
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
