import Phaser from 'phaser'

/**
 * Heart above hug — circles + triangle Graphics only (no textures / masks / bezier).
 * Guaranteed visible under CafeScene zoom + pixelArt.
 */
export class GrowingHeart {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {{
   *   durationMs?: number,
   *   startScale?: number,
   *   endScale?: number,
   * }} [opts]
   */
  constructor(scene, x, y, opts = {}) {
    this.scene = scene
    this.x = x
    this.y = y
    this.durationMs = opts.durationMs ?? 1800
    this.startScale = opts.startScale ?? 0.55
    this.endScale = opts.endScale ?? 0.85
    this.progress = 0

    this.g = scene.add.graphics()
    this.g.setPosition(x, y)
    this.g.setDepth(100000)
    this.g.setVisible(true)
    this.g.setAlpha(1)

    // Fallback text heart — if Graphics somehow blank, this still shows
    this.fallback = scene.add
      .text(x, y, '❤', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        color: '#e01838',
      })
      .setOrigin(0.5)
      .setDepth(100001)
      .setVisible(true)
      .setAlpha(1)

    this.applyVisual(this.startScale, 0.2)

    console.log('[HEART] heart created', {
      x,
      y,
      gDepth: this.g.depth,
      textDepth: this.fallback.depth,
      gVisible: this.g.visible,
      textVisible: this.fallback.visible,
    })
  }

  /** @param {number} depth */
  setDepth(depth) {
    this.g?.setDepth(depth)
    this.fallback?.setDepth(depth + 1)
  }

  /**
   * Chunk heart: two circles + triangle (pixel-UI friendly, always fills).
   * @param {number} scale
   * @param {number} fill01
   */
  applyVisual(scale, fill01) {
    const t = Phaser.Math.Clamp(fill01, 0, 1)
    const s = scale
    const g = this.g
    g.clear()

    const r = 11 * s
    const pale = 0xffe0e8
    const red = 0xe01838

    // Pale shell
    g.fillStyle(pale, 1)
    g.fillCircle(-r * 0.85, -r * 0.35, r)
    g.fillCircle(r * 0.85, -r * 0.35, r)
    g.fillTriangle(-r * 1.7, -r * 0.15, r * 1.7, -r * 0.15, 0, r * 2.1)

    // Red fill via alpha (visible growth of redness)
    g.fillStyle(red, 0.12 + t * 0.88)
    g.fillCircle(-r * 0.85, -r * 0.35, r)
    g.fillCircle(r * 0.85, -r * 0.35, r)
    g.fillTriangle(-r * 1.7, -r * 0.15, r * 1.7, -r * 0.15, 0, r * 2.1)

    // Outline
    g.lineStyle(Math.max(2, Math.round(2 * s)), 0x4a1828, 1)
    g.strokeCircle(-r * 0.85, -r * 0.35, r)
    g.strokeCircle(r * 0.85, -r * 0.35, r)
    g.lineBetween(-r * 1.7, -r * 0.15, 0, r * 2.1)
    g.lineBetween(r * 1.7, -r * 0.15, 0, r * 2.1)

    g.setVisible(true)
    g.setAlpha(1)

    if (this.fallback) {
      this.fallback.setScale(0.85 * s + 0.15)
      this.fallback.setAlpha(0.45 + t * 0.55)
      this.fallback.setColor(t > 0.55 ? '#e01838' : '#ff8aa8')
      this.fallback.setVisible(true)
    }
  }

  /**
   * @returns {Promise<void>}
   */
  play() {
    console.log('[HEART] heart animation started')
    this.applyVisual(this.startScale, 0.2)
    return new Promise((resolve) => {
      this.scene.time.delayedCall(400, () => {
        const state = { t: 0 }
        this.scene.tweens.add({
          targets: state,
          t: 1,
          duration: this.durationMs,
          ease: 'Sine.easeInOut',
          onUpdate: () => {
            this.progress = state.t
            this.applyVisual(
              Phaser.Math.Linear(this.startScale, this.endScale, state.t),
              Phaser.Math.Linear(0.2, 1, state.t),
            )
          },
          onComplete: () => {
            this.progress = 1
            this.applyVisual(this.endScale, 1)
            console.log('[HEART] heart fill complete')
            resolve()
          },
        })
      })
    })
  }

  destroy() {
    this.g?.destroy()
    this.fallback?.destroy()
    this.g = null
    this.fallback = null
  }
}
