import Phaser from 'phaser'

/**
 * Desktop keyboard → normalized movement vector (-1..1).
 * WASD + arrow keys.
 */
export class KeyboardControls {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    this.vector = { x: 0, y: 0 }
    this.enabled = true

    const keyboard = scene.input.keyboard
    if (!keyboard) {
      this.cursors = null
      this.keys = null
      return
    }

    this.cursors = keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      },
      false,
    )
    this.keys = keyboard.addKeys(
      {
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      },
      false,
    )
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) {
      this.resetKeyFlags()
    }
  }

  resetKeyFlags() {
    const keys = [
      this.cursors?.up,
      this.cursors?.down,
      this.cursors?.left,
      this.cursors?.right,
      this.keys?.up,
      this.keys?.down,
      this.keys?.left,
      this.keys?.right,
    ]
    keys.forEach((key) => {
      if (!key) return
      key.isDown = false
      key.isUp = true
    })
    this.vector.x = 0
    this.vector.y = 0
  }

  /**
   * @returns {{ x: number, y: number }}
   */
  getVector() {
    if (!this.enabled || !this.cursors || !this.keys) {
      this.vector.x = 0
      this.vector.y = 0
      return this.vector
    }

    let x = 0
    let y = 0

    if (this.cursors.left.isDown || this.keys.left.isDown) x -= 1
    if (this.cursors.right.isDown || this.keys.right.isDown) x += 1
    if (this.cursors.up.isDown || this.keys.up.isDown) y -= 1
    if (this.cursors.down.isDown || this.keys.down.isDown) y += 1

    if (x !== 0 || y !== 0) {
      const length = Math.hypot(x, y)
      x /= length
      y /= length
    }

    this.vector.x = x
    this.vector.y = y
    return this.vector
  }

  destroy() {
    this.cursors = null
    this.keys = null
  }
}
