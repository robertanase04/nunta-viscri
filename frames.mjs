import { chromium } from 'playwright'
const [out, w = 1440, h = 900] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 })
// 'load', not 'networkidle': the dev server holds an HMR websocket open.
await p.goto('http://localhost:5173/', { waitUntil: 'load' })
await p.waitForFunction(() => !!window.__intro, null, { timeout: 15000 })
// Braces matter: gsap's pause()/seek() return the timeline, and handing a
// deeply circular GSAP object back to Playwright to serialise hangs the call.
await p.evaluate(() => { window.__intro.pause() })
const times = [0, 0.35, 0.7, 1.05, 1.4, 1.8, 2.3]
for (const t of times) {
  await p.evaluate((tt) => { window.__intro.seek(tt, false) }, t)
  await p.waitForTimeout(140)
  await p.screenshot({ path: `${out}-${String(t).replace('.', '_')}.png` })
}
console.log('cadre capturate:', times.length)
await b.close()
