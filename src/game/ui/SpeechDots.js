import { UI_FONT } from './uiFont'

/**
 * Tiny "..." speech bubble anchored to a baked-in customer head.
 * Position = (headX, headTopY - pad)
 */
export class SpeechDots {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ headX: number, headTopY: number }} customer
   * @param {number} [pad]
   */
  constructor(scene, customer, pad = 22) {
    this.scene = scene
    this.customer = customer
    this.pad = pad

    const { bx, by } = this.bubblePos()
    this.root = scene.add.container(bx, by)
    this.root.setDepth(5000)
    this.root.setVisible(false)
    this.root.setAlpha(0)

    const g = scene.add.graphics()
    g.fillStyle(0xf7f7f7, 0.96)
    g.lineStyle(2, 0x222222, 0.9)
    g.fillRoundedRect(-22, -18, 44, 28, 6)
    g.strokeRoundedRect(-22, -18, 44, 28, 6)
    g.fillTriangle(-4, 10, 4, 10, 0, 18)
    g.lineBetween(-4, 10, 0, 18)
    g.lineBetween(4, 10, 0, 18)

    const dots = scene.add
      .text(0, -4, '...', {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#222222',
      })
      .setOrigin(0.5)

    this.root.add([g, dots])
  }

  bubblePos() {
    const c = this.customer
    return {
      bx: c.headX,
      by: c.headTopY - this.pad,
    }
  }

  syncToCustomer() {
    const { bx, by } = this.bubblePos()
    this.root.setPosition(bx, by)
  }

  show() {
    this.syncToCustomer()
    this.root.setVisible(true)
    this.scene.tweens.killTweensOf(this.root)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 220,
    })
  }

  hide() {
    this.scene.tweens.killTweensOf(this.root)
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.root?.setVisible(false)
      },
    })
  }

  destroy() {
    this.root?.destroy(true)
    this.root = null
  }
}
