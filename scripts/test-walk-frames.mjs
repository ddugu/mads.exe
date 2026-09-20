import { chromium } from 'playwright'

const BASE = 'http://localhost:5173/'

async function canvasClick(page, nx, ny) {
  const box = await page.locator('#phaser-game canvas').boundingBox()
  if (!box) throw new Error('no canvas')
  await page.mouse.click(box.x + box.width * nx, box.y + box.height * ny)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('#phaser-game canvas')

  // Boot
  await page.waitForTimeout(1200)
  await canvasClick(page, 0.5, 0.5)
  await page.waitForTimeout(5500)

  // Wait for Scene1 hook
  await page.waitForFunction(() => !!window.__SUDE_SCENE__?.sude, null, {
    timeout: 15000,
  })

  // Skip tutorials; unlock movement
  await page.evaluate(() => {
    window.__SUDE_SCENE__.forceFreeMovementForTest()
  })
  await page.waitForTimeout(200)

  // Drive movement via shared pipeline (same as keyboard → setMoveInput)
  await page.evaluate(() => {
    window.__SUDE_SCENE__.sude.setMoveInput(0, -1) // up
  })

  const samples = []
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(50)
    samples.push(
      await page.evaluate(() =>
        typeof globalThis.__sudeDebug === 'function' ? globalThis.__sudeDebug() : null,
      ),
    )
  }

  await page.evaluate(() => {
    window.__SUDE_SCENE__.sude.setMoveInput(0, 0)
  })
  await page.waitForTimeout(100)
  const idleAfter = await page.evaluate(() =>
    typeof globalThis.__sudeDebug === 'function' ? globalThis.__sudeDebug() : null,
  )

  // Sample other directions briefly
  const dirSamples = {}
  for (const [dir, vec] of [
    ['down', [0, 1]],
    ['left', [-1, 0]],
    ['right', [1, 0]],
  ]) {
    await page.evaluate(([x, y]) => {
      window.__SUDE_SCENE__.sude.setMoveInput(x, y)
    }, vec)
    await page.waitForTimeout(300)
    dirSamples[dir] = await page.evaluate(() => globalThis.__sudeDebug())
  }
  await page.evaluate(() => window.__SUDE_SCENE__.sude.setMoveInput(0, 0))

  const valid = samples.filter(Boolean)
  const moving = valid.filter((s) => s.isMoving)
  const frames = moving.map((s) => s.frame)
  const unique = [...new Set(frames)]

  // Check walk texture frame totals
  const texInfo = await page.evaluate(() => {
    const scene = window.__SUDE_SCENE__
    const tex = scene.textures.get('sude-walk-bw')
    return {
      exists: !!tex,
      frameTotal: tex?.frameTotal,
      has0: !!tex?.has?.(0) || !!tex?.frames?.['0'],
      has15: !!tex?.has?.(15) || !!tex?.frames?.['15'],
      animDown: scene.anims.exists('sude-walk-down'),
      animFrames: scene.anims.get('sude-walk-down')?.frames?.map((f) => f.frame.name),
    }
  })

  const report = {
    texInfo,
    validSamples: valid.length,
    movingSamples: moving.length,
    yChanged: valid.some((s) => s.y !== 860),
    movingFrames: frames,
    uniqueMovingFrames: unique,
    frameChangesWhileMoving: unique.length > 1,
    animsWhileMoving: [...new Set(moving.map((s) => s.anim))],
    texturesWhileMoving: [...new Set(moving.map((s) => s.texture))],
    idleAfter,
    dirSamples,
    firstMoving: moving[0] ?? null,
    lastMoving: moving[moving.length - 1] ?? null,
  }

  console.log(JSON.stringify(report, null, 2))
  await browser.close()

  if (moving.length === 0) {
    console.error('FAIL: never isMoving')
    process.exit(2)
  }
  if (!report.frameChangesWhileMoving) {
    console.error('FAIL: frame did not change while moving')
    process.exit(3)
  }
  if (!report.texturesWhileMoving.includes('sude-walk-bw')) {
    console.error('FAIL: walk texture not used')
    process.exit(4)
  }
  console.log('PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
