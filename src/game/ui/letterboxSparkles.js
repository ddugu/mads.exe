/**
 * Static pixel-art gold sparkles on black letterbox (behind game frame).
 * Style: tiny sharp retro pixels — no glow, blur, or big stars.
 */

/** Warm gold palette — opaque, no glow. */
const COLORS = ['#f0c84a', '#e8b83a', '#f5d56a', '#d4a52e', '#ffcc44']

/**
 * @param {number} seed
 */
function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} color
 */
function drawDot(ctx, x, y, color) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} color
 */
function drawPlus(ctx, x, y, color) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
  ctx.fillRect(x - 1, y, 1, 1)
  ctx.fillRect(x + 1, y, 1, 1)
  ctx.fillRect(x, y - 1, 1, 1)
  ctx.fillRect(x, y + 1, 1, 1)
}

/**
 * Tiny diamond (5 pixels).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} color
 */
function drawDiamond(ctx, x, y, color) {
  ctx.fillStyle = color
  ctx.fillRect(x, y - 1, 1, 1)
  ctx.fillRect(x - 1, y, 1, 1)
  ctx.fillRect(x, y, 1, 1)
  ctx.fillRect(x + 1, y, 1, 1)
  ctx.fillRect(x, y + 1, 1, 1)
}

/**
 * Small 4-point sparkle (~5–7 px) — rare, still tiny.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} core
 * @param {string} tip
 */
function drawSparkle(ctx, x, y, core, tip) {
  ctx.fillStyle = tip
  ctx.fillRect(x, y - 2, 1, 1)
  ctx.fillRect(x, y + 2, 1, 1)
  ctx.fillRect(x - 2, y, 1, 1)
  ctx.fillRect(x + 2, y, 1, 1)
  ctx.fillStyle = core
  ctx.fillRect(x, y - 1, 1, 1)
  ctx.fillRect(x, y + 1, 1, 1)
  ctx.fillRect(x - 1, y, 1, 1)
  ctx.fillRect(x + 1, y, 1, 1)
  ctx.fillRect(x, y, 1, 1)
}

/**
 * 2-pixel blob / tiny cluster.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {number} roll
 */
function drawBlob(ctx, x, y, color, roll) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
  if (roll < 0.5) ctx.fillRect(x + 1, y, 1, 1)
  else if (roll < 0.75) ctx.fillRect(x, y + 1, 1, 1)
  else {
    ctx.fillRect(x + 1, y, 1, 1)
    ctx.fillRect(x, y + 1, 1, 1)
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} cssW
 * @param {number} cssH
 */
export function paintLetterboxSparkles(canvas, cssW, cssH) {
  // 1 CSS px = 1 canvas px → sharp pixel art (no DPR blur)
  const w = Math.max(1, Math.floor(cssW))
  const h = Math.max(1, Math.floor(cssH))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  canvas.style.imageRendering = 'pixelated'

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.imageSmoothingEnabled = false
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  const rand = mulberry32(0x51de42)
  // Sparse: black stays dominant (~1 sparkle per ~14k px)
  const count = Math.max(28, Math.floor((w * h) / 14000))

  for (let i = 0; i < count; i += 1) {
    const x = 2 + Math.floor(rand() * Math.max(1, w - 4))
    const y = 2 + Math.floor(rand() * Math.max(1, h - 4))
    const color = COLORS[Math.floor(rand() * COLORS.length)]
    const tip = COLORS[Math.floor(rand() * COLORS.length)]
    const roll = rand()

    if (roll < 0.52) {
      drawDot(ctx, x, y, color)
    } else if (roll < 0.72) {
      drawBlob(ctx, x, y, color, rand())
    } else if (roll < 0.88) {
      drawPlus(ctx, x, y, color)
    } else if (roll < 0.96) {
      drawDiamond(ctx, x, y, color)
    } else {
      drawSparkle(ctx, x, y, color, tip)
    }
  }
}
