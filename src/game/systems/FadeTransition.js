/**
 * Reusable full-screen fade for scene transitions.
 */
export class FadeTransition {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} [depth=10000]
   */
  constructor(scene, depth = 10000) {
    this.scene = scene
    this.depth = depth
    this.rect = null
  }

  ensureRect() {
    if (this.rect) return this.rect
    const { width, height } = this.scene.scale.gameSize
    this.rect = this.scene.add
      .rectangle(0, 0, width * 2, height * 2, 0x000000, 1)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(this.depth)
      .setPosition(width / 2, height / 2)
      .setAlpha(0)
    return this.rect
  }

  /**
   * @param {number} durationMs
   * @returns {Promise<void>}
   */
  fadeOut(durationMs = 700) {
    const rect = this.ensureRect()
    rect.setAlpha(0)
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: rect,
        alpha: 1,
        duration: durationMs,
        ease: 'Sine.easeInOut',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * @param {number} durationMs
   * @returns {Promise<void>}
   */
  fadeIn(durationMs = 600) {
    const rect = this.ensureRect()
    rect.setAlpha(1)
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: rect,
        alpha: 0,
        duration: durationMs,
        ease: 'Sine.easeInOut',
        onComplete: () => resolve(),
      })
    })
  }

  destroy() {
    this.rect?.destroy()
    this.rect = null
  }
}

/**
 * Helper: fade out current scene, then start the next.
 * @param {Phaser.Scene} scene
 * @param {string} nextKey
 * @param {object} [data]
 * @param {number} [durationMs]
 */
export async function fadeToScene(scene, nextKey, data = {}, durationMs = 700) {
  const fade = new FadeTransition(scene)
  await fade.fadeOut(durationMs)
  scene.scene.start(nextKey, data)
}
