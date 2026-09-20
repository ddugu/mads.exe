import { chromium } from 'playwright'

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const logs = []
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' })

  // Boot: click to start sequence
  await page.mouse.click(400, 300)
  // Wait through boot texts (~5s) + fade + tutorial1
  await sleep(7000)

  // Dismiss tutorial popups if present (click center-ish TAMAM area)
  for (let i = 0; i < 4; i++) {
    await page.mouse.click(836, 520)
    await sleep(400)
  }

  // Force free movement + sample walk frames
  const result = await page.evaluate(async () => {
    const scene = window.__SUDE_SCENE__
    if (!scene) return { error: 'no scene hook' }
    scene.forceFreeMovementForTest()

    const sude = scene.sude
    if (!sude) return { error: 'no sude' }

    // Check texture exists
    const walkTex = scene.textures.get('sude-walk-bw')
    const frameTotal = walkTex?.frameTotal ?? -1

    sude.setMoveInput(0, -1) // up

    const samples = []
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100))
      samples.push(sude.getDebugState())
    }

    sude.setMoveInput(0, 0)
    await new Promise((r) => setTimeout(r, 200))
    const idle = sude.getDebugState()

    // Also sample down/left/right briefly
    const dirs = [
      { x: 0, y: 1, name: 'down' },
      { x: -1, y: 0, name: 'left' },
      { x: 1, y: 0, name: 'right' },
    ]
    const dirFrames = {}
    for (const d of dirs) {
      sude.setMoveInput(d.x, d.y)
      const frames = new Set()
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 100))
        frames.add(String(sude.getDebugState().frame))
      }
      dirFrames[d.name] = [...frames]
      sude.setMoveInput(0, 0)
      await new Promise((r) => setTimeout(r, 150))
    }

    return {
      frameTotal,
      animExists: {
        down: scene.anims.exists('sude-walk-down'),
        up: scene.anims.exists('sude-walk-up'),
        left: scene.anims.exists('sude-walk-left'),
        right: scene.anims.exists('sude-walk-right'),
      },
      upSamples: samples,
      uniqueUpFrames: [...new Set(samples.map((s) => String(s.frame)))],
      uniqueUpAnims: [...new Set(samples.map((s) => s.anim))],
      uniqueUpTextures: [...new Set(samples.map((s) => s.texture))],
      movingFlags: [...new Set(samples.map((s) => s.isMoving))],
      idle,
      dirFrames,
    }
  })

  console.log(JSON.stringify(result, null, 2))
  if (logs.length) {
    console.log('--- console ---')
    console.log(logs.slice(-30).join('\n'))
  }

  await browser.close()
  const framesChanged = (result.uniqueUpFrames || []).length > 1
  process.exit(framesChanged ? 0 : 2)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
