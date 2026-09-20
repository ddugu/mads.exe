import Phaser from 'phaser'
import { SCENE_01 } from '../data/scene01'
import {
  SUDE_BW,
  SUDE_COLOR,
  ensureSudeWalkAnims,
} from '../data/sudeSprites'

/**
 * Default movement/path config (Scene 1 road).
 * CampusScene passes its own worldBounds + perspective + spritePack.
 *
 * @typedef {object} SudePathConfig
 * @property {number} [centerX]
 * @property {number} [yNear]
 * @property {number} [halfWidthNear]
 * @property {number} [yFar]
 * @property {number} [halfWidthFar]
 * @property {number} yMin
 * @property {number} yMax
 * @property {number} [xMin]
 * @property {number} [xMax]
 * @property {'tapered' | 'box'} [mode]
 *
 * @typedef {object} SudePerspectiveConfig
 * @property {number} yNear
 * @property {number} yFar
 * @property {number} scaleNear
 * @property {number} scaleFar
 *
 * @typedef {object} SudeOptions
 * @property {ReturnType<typeof import('../data/sudeSprites').getSudeVariant>} [spritePack]
 * @property {SudePathConfig} [path]
 * @property {SudePerspectiveConfig} [perspective]
 * @property {number} [speed]
 * @property {'down' | 'up' | 'left' | 'right'} [direction]
 */

/**
 * Sude movement pipeline (shared Scene 1 + Scene 2):
 * input → setMoveInput → tryMove X/Y → real move? → direction → walk/idle
 *
 * Walk = generated PNGs (1→2→3→2 @ 10fps). Idle = pack idle texture.
 */
export class Sude {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {SudeOptions} [options]
   */
  constructor(scene, x, y, options = {}) {
    this.scene = scene
    this.spritePack = options.spritePack ?? SUDE_BW
    this.path = options.path ?? { ...SCENE_01.path, mode: 'tapered' }
    this.perspective = options.perspective ?? { ...SCENE_01.perspective }
    this.speed = options.speed ?? SCENE_01.movementSpeed

    /** @type {'down' | 'up' | 'left' | 'right'} */
    this.direction = options.direction ?? 'down'
    this.locked = false
    this.entryMode = false
    this.isMoving = false
    this.usingWalk = false
    this.currentAnimKey = null

    /** 0 = full color, 1 = fully desaturated / BW pack */
    this.desaturation = 0
    /** @type {Phaser.FX.ColorMatrix | null} */
    this.colorMatrixFx = null
    /** When set, overrides perspective scale (pit fall). */
    this.scaleOverride = null

    this.inputX = 0
    this.inputY = 0

    this.feetX = x
    this.feetY = y
    this.baseScale = this.perspective.scaleNear

    ensureSudeWalkAnims(scene, this.spritePack)

    const idleKey = this.spritePack.idle[this.direction].key
    this.sprite = scene.add.sprite(x, y, idleKey)
    this.sprite.setOrigin(0.5, 0.88)

    this.applyPerspectiveScale()
    this.syncVisual()
  }

  get x() {
    return this.feetX
  }

  get y() {
    return this.feetY
  }

  setLocked(locked) {
    this.locked = locked
    if (locked) {
      this.inputX = 0
      this.inputY = 0
      this.isMoving = false
      this.showIdle()
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  setMoveInput(x, y) {
    if (this.locked) {
      this.inputX = 0
      this.inputY = 0
      return
    }
    this.inputX = x
    this.inputY = y
  }

  /**
   * Switch idle/walk texture pack (color ↔ bw) without breaking walk cycle.
   * @param {ReturnType<typeof import('../data/sudeSprites').getSudeVariant>} pack
   */
  setSpritePack(pack) {
    if (!pack || this.spritePack === pack) return
    const wasWalking = this.usingWalk && this.isMoving
    this.spritePack = pack
    ensureSudeWalkAnims(this.scene, pack)
    this.currentAnimKey = null
    if (wasWalking) {
      this.playWalk()
    } else {
      this.showIdle()
    }
  }

  /**
   * Scene 4: 0 = cafe color, 1 = Scene-1 BW look.
   * Uses ColorMatrix on color frames, then swaps to real BW assets near 1.
   * @param {number} amount
   */
  setDesaturation(amount) {
    const next = Phaser.Math.Clamp(amount, 0, 1)
    this.desaturation = next

    if (next >= 0.97) {
      this.clearColorMatrixFx()
      this.setSpritePack(SUDE_BW)
      return
    }

    this.setSpritePack(SUDE_COLOR)
    const fx = this.ensureColorMatrixFx()
    if (fx) {
      fx.grayscale(next)
    }
  }

  ensureColorMatrixFx() {
    if (this.colorMatrixFx) return this.colorMatrixFx
    if (!this.sprite?.preFX) return null
    try {
      this.sprite.preFX.setPadding(4)
      this.colorMatrixFx = this.sprite.preFX.addColorMatrix()
      return this.colorMatrixFx
    } catch {
      return null
    }
  }

  clearColorMatrixFx() {
    if (this.colorMatrixFx && this.sprite?.preFX) {
      this.sprite.preFX.remove(this.colorMatrixFx)
    }
    this.colorMatrixFx = null
  }

  updateDirectionFromInput() {
    if (this.inputX === 0 && this.inputY === 0) return

    if (Math.abs(this.inputX) > Math.abs(this.inputY)) {
      this.direction = this.inputX > 0 ? 'right' : 'left'
    } else {
      this.direction = this.inputY > 0 ? 'down' : 'up'
    }
  }

  /**
   * @param {number} y
   */
  getPathBoundsAtY(y) {
    const path = this.path
    if (path.mode === 'box') {
      return {
        left: path.xMin ?? 0,
        right: path.xMax ?? Number.POSITIVE_INFINITY,
      }
    }

    const t = Phaser.Math.Clamp(
      (path.yNear - y) / (path.yNear - path.yFar),
      0,
      1,
    )
    const halfWidth = Phaser.Math.Linear(path.halfWidthNear, path.halfWidthFar, t)
    return {
      left: path.centerX - halfWidth,
      right: path.centerX + halfWidth,
    }
  }

  /**
   * @param {number} deltaX
   * @param {number} deltaY
   */
  tryMove(deltaX, deltaY) {
    const path = this.path

    if (deltaX !== 0) {
      const { left, right } = this.getPathBoundsAtY(this.feetY)
      this.feetX = Phaser.Math.Clamp(this.feetX + deltaX, left, right)
    }

    if (deltaY !== 0) {
      const nextY = Phaser.Math.Clamp(this.feetY + deltaY, path.yMin, path.yMax)
      const { left, right } = this.getPathBoundsAtY(nextY)
      this.feetY = nextY
      this.feetX = Phaser.Math.Clamp(this.feetX, left, right)
    }
  }

  playWalk() {
    const animKey = this.spritePack.animKeys[this.direction]

    if (
      this.usingWalk &&
      this.currentAnimKey === animKey &&
      this.sprite.anims.isPlaying
    ) {
      return
    }

    if (!this.scene.anims.exists(animKey)) {
      ensureSudeWalkAnims(this.scene, this.spritePack)
    }

    this.usingWalk = true
    this.currentAnimKey = animKey
    this.sprite.setOrigin(0.5, 0.88)
    this.sprite.anims.play(animKey, true)
    this.applyPerspectiveScale()
  }

  showIdle() {
    if (this.sprite.anims.isPlaying) {
      this.sprite.anims.stop()
    }
    this.usingWalk = false
    this.currentAnimKey = null
    this.sprite.setTexture(this.spritePack.idle[this.direction].key)
    this.sprite.setOrigin(0.5, 0.88)
    this.applyPerspectiveScale()
  }

  applyPerspectiveScale() {
    if (this.scaleOverride != null) {
      this.sprite.setScale(this.scaleOverride)
      this.sprite.setDepth(10 + this.feetY)
      return
    }

    const { perspective } = this
    const t = Phaser.Math.Clamp(
      (perspective.yNear - this.feetY) / (perspective.yNear - perspective.yFar),
      0,
      1,
    )
    this.baseScale = Phaser.Math.Linear(perspective.scaleNear, perspective.scaleFar, t)
    this.sprite.setScale(this.baseScale)
    this.sprite.setDepth(10 + this.feetY)
  }

  syncVisual() {
    this.sprite.setPosition(this.feetX, this.feetY)
  }

  /**
   * Short scripted step used by door / cafe transitions.
   * Bypasses path collision (entryMode) so cafe/door entry is not blocked.
   * @param {{ deltaX?: number, deltaY?: number, direction?: 'down'|'up'|'left'|'right', durationMs: number }} opts
   * @returns {Promise<void>}
   */
  stepToward(opts) {
    const deltaX = opts.deltaX ?? 0
    const deltaY = opts.deltaY ?? 0
    const durationMs = opts.durationMs

    this.locked = true
    this.entryMode = true
    this.inputX = 0
    this.inputY = 0
    if (opts.direction) {
      this.direction = opts.direction
    } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.direction = deltaX > 0 ? 'right' : 'left'
    } else if (deltaY !== 0) {
      this.direction = deltaY > 0 ? 'down' : 'up'
    }
    this.isMoving = true
    this.playWalk()

    const targetX = this.feetX + deltaX
    const targetY = this.feetY + deltaY
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        feetX: targetX,
        feetY: targetY,
        duration: durationMs,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          this.applyPerspectiveScale()
          this.syncVisual()
        },
        onComplete: () => {
          this.isMoving = false
          this.entryMode = false
          this.showIdle()
          this.syncVisual()
          resolve()
        },
      })
    })
  }

  /**
   * @param {number} deltaY
   * @param {number} durationMs
   * @returns {Promise<void>}
   */
  stepTowardDoor(deltaY, durationMs) {
    return this.stepToward({ deltaY, direction: 'up', durationMs })
  }

  /**
   * @param {number} delta ms
   */
  update(delta) {
    if (this.locked) {
      this.syncVisual()
      return
    }

    const beforeX = this.feetX
    const beforeY = this.feetY
    const dt = delta / 1000
    const dx = this.inputX * this.speed * dt
    const dy = this.inputY * this.speed * dt

    if (this.inputX !== 0 || this.inputY !== 0) {
      this.updateDirectionFromInput()
    }

    if (dx !== 0) this.tryMove(dx, 0)
    if (dy !== 0) this.tryMove(0, dy)

    const wasMoving = this.isMoving
    this.isMoving =
      Math.abs(this.feetX - beforeX) > 0.001 ||
      Math.abs(this.feetY - beforeY) > 0.001

    if (this.isMoving) {
      this.playWalk()
    } else if (wasMoving || this.usingWalk) {
      this.showIdle()
    } else {
      const idleKey = this.spritePack.idle[this.direction].key
      if (this.sprite.texture.key !== idleKey) {
        this.sprite.setTexture(idleKey)
      }
    }

    this.applyPerspectiveScale()
    this.syncVisual()
  }

  destroy() {
    this.clearColorMatrixFx()
    this.sprite?.destroy()
  }
}
