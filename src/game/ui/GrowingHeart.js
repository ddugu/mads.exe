/**
 * Pixel heart overlay (DOM + CSS mask).
 *
 * Phaser Graphics/masks vanish under CafeScene camera zoom + pixelArt.
 * Browser CSS mask fills bottom→top like liquid, matching the reference.
 */

const HEART_CSS_PX = 56

/** Filled 12×10 pixel heart (1 = opaque). */
const HEART_FILL_GRID = [
  '001110011100',
  '011111111110',
  '111111111111',
  '111111111111',
  '111111111111',
  '011111111110',
  '001111111100',
  '000111111000',
  '000011110000',
  '000001100000',
]

let cachedUrls = null

function gridToDataUrl(grid, { outlineOnly, fillRgb, outlineRgb, scale = 4 }) {
  const rows = grid.length
  const cols = grid[0].length
  const canvas = document.createElement('canvas')
  canvas.width = cols * scale
  canvas.height = rows * scale
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  const isOn = (x, y) =>
    y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === '1'

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (grid[y][x] !== '1') continue
      const edge =
        !isOn(x - 1, y) ||
        !isOn(x + 1, y) ||
        !isOn(x, y - 1) ||
        !isOn(x, y + 1)
      if (outlineOnly && !edge) continue
      const [r, g, b] = outlineOnly ? outlineRgb : fillRgb
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  return canvas.toDataURL('image/png')
}

function heartUrls() {
  if (cachedUrls) return cachedUrls
  cachedUrls = {
    mask: gridToDataUrl(HEART_FILL_GRID, {
      outlineOnly: false,
      fillRgb: [255, 255, 255],
    }),
    outline: gridToDataUrl(HEART_FILL_GRID, {
      outlineOnly: true,
      outlineRgb: [255, 120, 150],
    }),
  }
  return cachedUrls
}

function worldToCanvasCss(cam, canvasRect, parentRect, wx, wy) {
  const vx = ((wx - cam.worldView.x) / cam.worldView.width) * cam.width
  const vy = ((wy - cam.worldView.y) / cam.worldView.height) * cam.height
  return {
    x: canvasRect.left - parentRect.left + (vx / cam.width) * canvasRect.width,
    y: canvasRect.top - parentRect.top + (vy / cam.height) * canvasRect.height,
  }
}

function waitMs(scene, ms) {
  return new Promise((resolve) => {
    scene.time.delayedCall(ms, () => resolve())
  })
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} worldX
 * @param {number} worldY
 * @param {{
 *   growMs?: number,
 *   fillMs?: number,
 *   startScale?: number,
 *   endScale?: number,
 *   fillWhileGrow?: number,
 * }} [opts]
 */
export class GrowingHeart {
  constructor(scene, worldX, worldY, opts = {}) {
    this.scene = scene
    this.worldX = worldX
    this.worldY = worldY
    this.growMs = opts.growMs ?? 1600
    this.fillMs = opts.fillMs ?? 1400
    this.startScale = opts.startScale ?? 0.32
    this.endScale = opts.endScale ?? 1
    this.fillWhileGrow = opts.fillWhileGrow ?? 0.28
    this.progress = 0
    this.root = { depth: 100000 }

    const canvas = scene.game?.canvas
    const parent = canvas?.parentElement ?? document.getElementById('phaser-frame')
    this.canvas = canvas
    this.parent = parent

    const urls = heartUrls()
    const el = document.createElement('div')
    el.className = 'sude-pixel-heart sude-pixel-heart--visible'
    el.style.width = `${HEART_CSS_PX}px`
    el.style.height = `${HEART_CSS_PX}px`
    el.style.transform = `translate(-50%, -50%) scale(${this.startScale})`
    el.style.setProperty('--heart-fill', '0%')

    const outline = document.createElement('div')
    outline.className = 'sude-pixel-heart__outline'
    outline.style.backgroundImage = `url(${urls.outline})`

    const fillClip = document.createElement('div')
    fillClip.className = 'sude-pixel-heart__fill-clip'
    const fill = document.createElement('div')
    fill.className = 'sude-pixel-heart__fill'
    fill.style.height = `${HEART_CSS_PX}px`
    fill.style.backgroundColor = '#ff4d6d'
    fill.style.webkitMaskImage = `url(${urls.mask})`
    fill.style.maskImage = `url(${urls.mask})`
    fill.style.webkitMaskSize = 'contain'
    fill.style.maskSize = 'contain'
    fill.style.webkitMaskRepeat = 'no-repeat'
    fill.style.maskRepeat = 'no-repeat'
    fill.style.webkitMaskPosition = 'center bottom'
    fill.style.maskPosition = 'center bottom'
    fillClip.appendChild(fill)
    el.append(outline, fillClip)
    if (!parent) {
      console.error('[HEART] no parent to mount overlay')
      this.el = null
      return
    }
    parent.appendChild(el)

    this.el = el
    this.fillEl = fill

    this.sync = this.sync.bind(this)
    window.addEventListener('resize', this.sync)
    scene.scale?.on?.('resize', this.sync)
    this.sync()
    requestAnimationFrame(() => this.sync())

    console.log('[HEART] heart created', { worldX, worldY })
  }

  setDepth() {
    // DOM overlay sits above the canvas; Phaser depth unused.
  }

  sync() {
    const { canvas, parent, el, scene } = this
    if (!el?.isConnected || !canvas?.isConnected) return
    const parentRect = parent.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const p = worldToCanvasCss(
      scene.cameras.main,
      canvasRect,
      parentRect,
      this.worldX,
      this.worldY,
    )
    el.style.left = `${p.x}px`
    el.style.top = `${p.y}px`
  }

  /**
   * @param {number} scale
   * @param {number} fill01
   */
  applyVisual(scale, fill01) {
    if (!this.el) return
    this.el.style.transform = `translate(-50%, -50%) scale(${scale})`
    this.el.style.setProperty('--heart-fill', `${Math.round(fill01 * 1000) / 10}%`)
    this.el.classList.add('sude-pixel-heart--visible')
  }

  /**
   * Grow to final size (slight fill), then liquid fill to 100%.
   * @returns {Promise<void>}
   */
  async play() {
    console.log('[HEART] heart animation started')
    this.applyVisual(this.startScale, 0)
    await waitMs(this.scene, 80)

    await this.tween(this.growMs, (t) => {
      this.applyVisual(
        lerp(this.startScale, this.endScale, easeOut(t)),
        lerp(0, this.fillWhileGrow, t),
      )
    })

    await this.tween(this.fillMs, (t) => {
      this.applyVisual(this.endScale, lerp(this.fillWhileGrow, 1, easeInOut(t)))
    })

    this.applyVisual(this.endScale, 1)
    console.log('[HEART] heart fill complete')
  }

  /**
   * @param {number} duration
   * @param {(t: number) => void} onTick
   */
  tween(duration, onTick) {
    return new Promise((resolve) => {
      const state = { t: 0 }
      this.scene.tweens.add({
        targets: state,
        t: 1,
        duration,
        ease: 'Linear',
        onUpdate: () => onTick(state.t),
        onComplete: () => {
          onTick(1)
          resolve()
        },
      })
    })
  }

  destroy() {
    window.removeEventListener('resize', this.sync)
    this.scene?.scale?.off?.('resize', this.sync)
    this.el?.remove()
    this.el = null
    this.fillEl = null
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeOut(t) {
  return 1 - (1 - t) * (1 - t)
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}
