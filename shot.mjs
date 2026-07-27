import { chromium } from 'playwright'
const [url, outBase, w=1440, h=900] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
// Freeze the timeline at fixed points so frames are comparable run to run.
await p.goto(url, { waitUntil: 'domcontentloaded' })
const marks = [250, 700, 1200, 1700, 2400]
let prev = 0
for (const m of marks) {
  await p.waitForTimeout(m - prev); prev = m
  await p.screenshot({ path: `${outBase}-${m}.png` })
}
await b.close()
