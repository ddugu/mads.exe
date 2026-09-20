/**
 * Door approach indicator — Phaser Graphics only (no new PNG assets).
 * Visible only while Sude is in the door interaction zone.
 * Mouse / touch clickable.
 */
export class DoorInteraction {
  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   arrowX: number,
   *   arrowY: number,
   *   onActivate: () => void,
   * }} options
   */
  constructor(scene, options) {
    this.scene = scene
    this.onActivate = options.onActivate
    this.visible = false
    this.enabled = true

    this.container = scene.add.container(options.arrowX, options.arrowY)
    this.container.setDepth(8000)
    this.container.setVisible(false)

    const arrow = scene.add.graphics()
    arrow.fillStyle(0xf2f2f2, 0.95)
    arrow.lineStyle(2, 0x222222, 0.85)
    // Up-pointing chevron toward the door
    arrow.beginPath()
    arrow.moveTo(0, -16)
    arrow.lineTo(14, 4)
    arrow.lineTo(6, 4)
    arrow.lineTo(6, 16)
    arrow.lineTo(-6, 16)
    arrow.lineTo(-6, 4)
    arrow.lineTo(-14, 4)
    arrow.closePath()
    arrow.fillPath()
    arrow.strokePath()

    const hit = scene.add
      .zone(0, 0, 56, 56)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    hit.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation?.()
      if (!this.visible || !this.enabled) return
      this.onActivate?.()
    })

    this.container.add([arrow, hit])
    this.hit = hit
    this.baseY = options.arrowY

    this.bobTween = scene.tweens.add({
      targets: this.container,
      y: options.arrowY - 8,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    })
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
