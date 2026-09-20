import { KeyboardControls } from './KeyboardControls'
import { touchState } from './TouchDPad'

/**
 * Aggregates keyboard + optional touch D-pad into a normalized move vector.
 */
export class InputManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.keyboard = new KeyboardControls(scene)
    this.overrideVector = null
    this.enabled = true
  }

  /**
   * @param {{ x: number, y: number } | null} vector
   */
  setOverride(vector) {
    this.overrideVector = vector
  }

  setEnabled(enabled) {
    this.enabled = enabled
    this.keyboard.setEnabled(enabled)
    if (!enabled) {
      this.overrideVector = null
      touchState.active = false
      touchState.x = 0
      touchState.y = 0
    }
  }

  /**
   * @returns {{ x: number, y: number }}
   */
  getMoveVector() {
    if (!this.enabled) {
      return { x: 0, y: 0 }
    }
    if (this.overrideVector) {
      return this.overrideVector
    }
    if (touchState.active) {
      return { x: touchState.x, y: touchState.y }
    }
    return this.keyboard.getVector()
  }

  destroy() {
    this.keyboard.destroy()
    this.overrideVector = null
  }
}
