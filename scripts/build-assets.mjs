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
/** Regions may name their own source; this is the default. */
const SOURCES = {
  invitation: SRC,
  'cuplu-camp': join(ROOT, 'assets/source/cuplu-camp.png'),
}
const OUT = join(ROOT, 'public/art')

/**
 * The ink point. The paper point is not a constant — see `paperLevelOf`.
 */
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
const PAPER_FLOOR = 0.07

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
  /* Taken fully inside the innermost printed rules. Those sit at columns
     51-53 and 514-517 on the left panel, 1581-1583 and 1945-1947 on the
     right, and at rows 49-52 and 1279-1282 on both.

     Getting this wrong is what made one cover look worse than the other.
     The first crop began on column 53 — half of the left panel's own rule —
     so that cover carried a line down each side; the right crop happened to
     clear its columns, so only one of the two was affected. Correcting the
     columns alone then left something stranger: the crop cleared the top
     rule but still contained the bottom one, so both covers showed an inner
     frame with a horizontal at the foot, none at the head and none at the
     sides — a broken rectangle, which reads worse than either a full frame
     or none at all.

     Both are then padded to a common box, so they sit at the same scale
     inside identical frames. */
  'cover-left': { left: 56, top: 55, width: 456, height: 1222, padTo: 493, padToH: 1340 },
  'cover-right': { left: 1585, top: 55, width: 359, height: 1222, padTo: 493, padToH: 1340 },

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

  /* And off the two cover panels. */
  /* The whole Casa Tanase emblem — heart, both towers with their flags,
     the tandem and the ribbon with both curled tails. The first crop began
     at row 300, which is halfway up the castle wall, and ran past the
     ribbon into the rosette below it. */
  'tandem': { left: 60, top: 100, width: 426, height: 630 },
  'indicatoare': { left: 1596, top: 978, width: 198, height: 172 },

  /* A separate drawing, not part of the plate: the couple in a dandelion
     field. Same blue on the same cream, so it goes through the same keying
     and composites over the page paper like everything else. Taken whole —
     there is nothing to crop away. */
  'cuplu-camp': { src: 'cuplu-camp', left: 0, top: 0, width: 1086, height: 1448 },
}

/** Widths to emit per asset class. */
const WIDTH_SETS = {
  panel: [480, 720, 1000, 1400],
  vignette: [220, 360, 520, 700],
}

const classOf = (name) =>
  name.startsWith('cover-') || name === 'map' ? 'panel' : 'vignette'

/**
 * The luminance of this tile's own paper, as the most common bright value
 * in it.
 *
 * A single paper level for the whole plate does not hold. The map is washed
 * unevenly, so a region lifted from a lightly toned part of it reads as ink
 * against a global threshold and comes out as a faintly tinted rectangle —
 * which is exactly what the vignettes were doing, most visibly around the
 * Viscri house, whose corners were sitting at alpha 30 instead of nothing.
 * Measuring per tile keys each one against the paper it was actually
 * printed on.
 */
function paperLevelOf(data, channels, px) {
  const hist = new Uint32Array(256)
  for (let i = 0; i < px; i++) {
    const o = i * channels
    const lum =
      0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]
    hist[Math.round(lum)] += 1
  }
  // Paper is always the bright end; ink never is. Searching from 150 up
  // keeps a dense drawing from voting for its own hatching.
  let best = 150
  for (let v = 150; v < 256; v++) if (hist[v] > hist[best]) best = v
  return best
}

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
  const paperLum = paperLevelOf(data, info.channels, px)
  const span = paperLum - INK_LUM

  for (let i = 0; i < px; i++) {
    const o = i * info.channels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]

    // Rec. 709 luma. Coverage only — which colour it is stays in RGB.
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

    let a = (paperLum - lum) / span
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

  return {
    stamp: sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }),
    paperLum,
  }
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
    const { padTo, padToH, src, ...crop } = box
    const keyed = await toInkStamp(sharp(SOURCES[src ?? 'invitation']).extract(crop))
    let stamp = keyed.stamp

    if (padTo || padToH) {
      const dx = (padTo ?? crop.width) - crop.width
      const dy = (padToH ?? crop.height) - crop.height
      const l = Math.floor(dx / 2)
      const t = Math.floor(dy / 2)
      stamp = sharp(
        await stamp
          .extend({
            left: l,
            right: dx - l,
            top: t,
            bottom: dy - t,
            background: { r: VOID_RGB[0], g: VOID_RGB[1], b: VOID_RGB[2], alpha: 0 },
          })
          .png()
          .toBuffer(),
      )
    }
    const cls = classOf(name)
    const srcW = padTo ?? crop.width
    const srcH = padToH ?? crop.height
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
    console.log(
      `  ${name.padEnd(14)} ${srcW}x${srcH}  hartie ${keyed.paperLum}  ->  ${emitted.join(', ')}`,
    )
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
