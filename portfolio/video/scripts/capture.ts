import { cp, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Page } from 'playwright'
import { projects } from '../../src/data/projects'

const SITE_URL = process.env.SITE_URL ?? 'https://swarajjj.vercel.app/'
const VIDEO_PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')
const SITE_PUBLIC = path.resolve(VIDEO_PUBLIC, '../../public')
const OUT_DIR = path.join(VIDEO_PUBLIC, 'captures')
const SITE_ASSETS = ['projects', 'companies', 'avatar.jpeg']
const SECTION_IDS = ['about', 'activity', 'experience', 'work', 'articles', 'contact']

type Target = {
  name: 'desktop' | 'mobile'
  width: number
  height: number
  dpr: number
  isMobile: boolean
}

const TARGETS: Target[] = [
  { name: 'desktop', width: 1440, height: 900, dpr: 2, isMobile: false },
  { name: 'mobile', width: 390, height: 844, dpr: 3, isMobile: true },
]

// Fixed/sticky chrome is captured separately and re-composited in the video,
// otherwise it would be baked into the full-page image at the wrong scroll position.
const HIDE_CHROME_CSS = `
  header, #root div.fixed, #root button.fixed { visibility: hidden !important; }
`

async function settlePage(page: Page) {
  await page.evaluate(() => document.fonts.ready)

  // Scroll through once so lazy images and in-view effects resolve.
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(120)
  }

  await page
    .locator('#activity', { hasText: 'Loading…' })
    .waitFor({ state: 'detached', timeout: 20_000 })
    .catch(() => console.warn('  activity graph did not finish loading'))

  await page.waitForLoadState('networkidle')
  // Hidden lazy images (e.g. light-mode icon variants) never load, so only wait on visible ones.
  await page
    .waitForFunction(
      () =>
        Array.from(document.images)
          .filter((img) => img.checkVisibility())
          .every((img) => img.complete),
      undefined,
      { timeout: 20_000 },
    )
    .catch(() => console.warn('  some visible images did not finish loading'))

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(800)
}

async function captureTarget(target: Target) {
  console.log(`Capturing ${target.name} (${target.width}x${target.height} @${target.dpr}x)`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: target.width, height: target.height },
    deviceScaleFactor: target.dpr,
    isMobile: target.isMobile,
    hasTouch: target.isMobile,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  await context.addInitScript(() => localStorage.setItem('theme', 'dark'))

  const page = await context.newPage()
  await page.goto(SITE_URL, { waitUntil: 'networkidle' })
  await settlePage(page)

  const prefix = path.join(OUT_DIR, target.name)
  await page.locator('header').first().screenshot({ path: `${prefix}-header.png` })

  const bottomNavLocator = page.locator('div.fixed:has([aria-label="Toggle menu"])')
  let bottomNav: { width: number; height: number; bottom: number } | null = null
  if (target.isMobile && (await bottomNavLocator.isVisible())) {
    await bottomNavLocator.screenshot({ path: `${prefix}-bottom-nav.png`, omitBackground: true })
    const box = await bottomNavLocator.boundingBox()
    if (box) {
      bottomNav = {
        width: box.width,
        height: box.height,
        bottom: target.height - (box.y + box.height),
      }
    }
  }

  await page.addStyleTag({ content: HIDE_CHROME_CSS })
  await page.waitForTimeout(200)

  const layout = await page.evaluate((ids) => {
    const header = document.querySelector('header')
    const sections: Record<string, number> = {}
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) sections[id] = el.getBoundingClientRect().top + window.scrollY
    }
    return {
      pageHeight: document.documentElement.scrollHeight,
      headerHeight: header?.getBoundingClientRect().height ?? 0,
      sections,
    }
  }, SECTION_IDS)

  await page.screenshot({
    path: `${prefix}-page.jpg`,
    fullPage: true,
    type: 'jpeg',
    quality: 92,
  })

  await browser.close()

  return {
    viewport: { width: target.width, height: target.height },
    dpr: target.dpr,
    bottomNav,
    ...layout,
  }
}

async function copySiteAssets() {
  for (const asset of SITE_ASSETS) {
    await cp(path.join(SITE_PUBLIC, asset), path.join(VIDEO_PUBLIC, 'site', asset), {
      recursive: true,
    })
  }
}

async function downloadTechIcons() {
  const dir = path.join(VIDEO_PUBLIC, 'icons')
  await mkdir(dir, { recursive: true })
  const skills = new Map(projects.flatMap((p) => p.tech).map((t) => [t.slug, t]))
  for (const skill of skills.values()) {
    const color = skill.invert ? '/ffffff' : ''
    const res = await fetch(`https://cdn.simpleicons.org/${skill.slug}${color}`)
    if (!res.ok) throw new Error(`Icon ${skill.slug} failed: ${res.status}`)
    await writeFile(path.join(dir, `${skill.slug}.svg`), await res.text())
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await copySiteAssets()
  await downloadTechIcons()
  const meta: Record<string, unknown> = { siteUrl: SITE_URL, capturedAt: new Date().toISOString() }
  for (const target of TARGETS) {
    meta[target.name] = await captureTarget(target)
  }
  await writeFile(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2))
  console.log(`Saved captures to ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
