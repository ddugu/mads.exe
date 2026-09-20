/**
 * Horizontal interaction arrow (Scene 2 cafe).
 * Distinct from Scene 1's vertical door chevron.
 * Phaser GameObject — mouse + touch via pointerdown.
 */
export class HorizontalInteractionArrow {
  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   x: number,
   *   y: number,
   *   direction?: 'left' | 'right',
   *   onActivate: () => void,
   * }} options
   */
  constructor(scene, options) {
    this.scene = scene
    this.onActivate = options.onActivate
    this.direction = options.direction === 'left' ? 'left' : 'right'
    this.visible = false
    this.enabled = true

    this.container = scene.add.container(options.x, options.y)
    this.container.setDepth(8000)
    this.container.setVisible(false)

    const arrow = scene.add.graphics()
    this.drawArrow(arrow, this.direction)

    // Explicit hit rect (more reliable than Zone inside Container + camera scroll)
    const hit = scene.add
      .rectangle(0, 0, 72, 56, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })

    hit.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.()
      if (!this.visible || !this.enabled) return
      this.onActivate?.()
    })

    this.container.add([arrow, hit])
    this.hit = hit
    this.baseX = options.x
    this.baseY = options.y

    const bobDelta = this.direction === 'right' ? 8 : -8
    this.bobTween = scene.tweens.add({
      targets: this.container,
      x: options.x + bobDelta,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    })
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    this.baseX = x
    this.baseY = y
    this.container.setPosition(x, y)
    const bobDelta = this.direction === 'right' ? 8 : -8
    this.bobTween.stop()
    this.bobTween = this.scene.tweens.add({
      targets: this.container,
      x: x + bobDelta,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: !this.visible,
    })
  }

  /**
   * @param {Phaser.GameObjects.Graphics} g
   * @param {'left' | 'right'} direction
   */
  drawArrow(g, direction) {
    g.clear()
    g.fillStyle(0xf2f2f2, 0.95)
    g.lineStyle(2, 0x222222, 0.85)

    const s = direction === 'right' ? 1 : -1
    g.beginPath()
    g.moveTo(18 * s, 0)
    g.lineTo(-4 * s, -14)
    g.lineTo(-4 * s, -6)
    g.lineTo(-18 * s, -6)
    g.lineTo(-18 * s, 6)
    g.lineTo(-4 * s, 6)
    g.lineTo(-4 * s, 14)
    g.closePath()
    g.fillPath()
    g.strokePath()
  }

  /**
   * @param {boolean} inZone
   */
  setInZone(inZone) {
    if (!this.enabled) {
      this.hide()
      return
    }
    if (inZone) this.show()
    else this.hide()
  }

  show() {
    if (this.visible) return
    this.visible = true
    this.container.setVisible(true)
    this.container.setAlpha(0)
    this.hit.setInteractive({ useHandCursor: true })
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 180,
    })
    this.bobTween.resume()
  }

  hide() {
    if (!this.visible) return
    this.visible = false
    this.bobTween.pause()
    this.container.setVisible(false)
    this.container.setAlpha(0)
    this.container.x = this.baseX
    this.container.y = this.baseY
  }

  disable() {
    this.enabled = false
    this.hide()
    this.hit.disableInteractive()
  }

  destroy() {
    this.bobTween?.stop()
    this.container?.destroy(true)
    this.container = null
    this.hit = null
  }
}
