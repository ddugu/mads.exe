import Phaser from 'phaser'
import {
  ensureSoobinWalkAnims,
  SOOBIN_HOLDING,
  SOOBIN_NORMAL,
} from '../data/soobinSprites'
import { SCENE_03 } from '../data/scene03'
import { CHAR_SCALE, CHAR_ORIGIN_Y } from '../data/characterScale'

/**
 * NPC Soobin — automatic moveTo / waypoint paths (no player input).
 * Optional invisible AABB obstacles block feet.
 */
export class SoobinNpc {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {{
   *   scale?: number,
   *   speed?: number,
   *   direction?: 'down'|'up'|'left'|'right',
   *   holding?: boolean,
   *   originY?: number,
   *   obstacles?: Array<{ x: number, y: number, w: number, h: number }>,
   * }} [opts]
   */
  constructor(scene, x, y, opts = {}) {
    this.scene = scene
    this.speed = opts.speed ?? 110
    this.scale = opts.scale ?? CHAR_SCALE.soobin
    this.originY = opts.originY ?? CHAR_ORIGIN_Y.soobin
    /** @type {'down'|'up'|'left'|'right'} */
    this.direction = opts.direction ?? 'down'
    this.holding = opts.holding !== false
    this.spritePack = this.holding ? SOOBIN_HOLDING : SOOBIN_NORMAL
    /** @type {Array<{ x: number, y: number, w: number, h: number }>} */
    this.obstacles = opts.obstacles ?? []

    this.feetX = x
    this.feetY = y
    this.targetX = x
    this.targetY = y
    this.moving = false
    this.arriveThreshold = 10
    this._arriveResolve = null

    ensureSoobinWalkAnims(scene, SOOBIN_HOLDING)
    ensureSoobinWalkAnims(scene, SOOBIN_NORMAL)

    this.sprite = scene.add.sprite(x, y, this.spritePack.idle[this.direction].key)
    this.sprite.setOrigin(0.5, this.originY)
    this.sprite.setScale(this.scale)
    this.syncDepth()

    /** @type {Phaser.GameObjects.Image | null} */
    this.emotion = null
    /** @type {'sad' | 'cry' | null} */
    this.emotionKind = null
  }

  /** World Y of visible hair/head top (feet − displayHeight × originY). */
  headY() {
    return this.feetY - this.sprite.displayHeight * this.sprite.originY
  }

  syncEmotionPosition() {
    if (!this.emotion) return
    const pad = SCENE_03.emotion.headPad
    // Origin (0.5, 1): bottom of face sits just above hair.
    this.emotion.setPosition(this.feetX, this.headY() - pad)
    this.emotion.setDepth(40 + this.feetY)
  }

  syncDepth() {
    this.sprite.setDepth(20 + this.feetY)
    this.syncEmotionPosition()
  }

  setHolding(holding) {
    if (this.holding === holding) return
    this.holding = holding
    this.spritePack = holding ? SOOBIN_HOLDING : SOOBIN_NORMAL
    ensureSoobinWalkAnims(this.scene, this.spritePack)
    if (this.moving) {
      this.playWalk()
    } else {
      this.showIdle()
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {{ threshold?: number }} [opts]
   * @returns {Promise<void>}
   */
  moveTo(x, y, opts = {}) {
    const threshold = opts.threshold ?? this.arriveThreshold
    this.targetX = x
    this.targetY = y
    this.arriveThreshold = threshold
    this.moving = true
    return new Promise((resolve) => {
      this._arriveResolve = resolve
    })
  }

  /**
   * Walk waypoints in order; each must complete before the next starts.
   * @param {Array<{ x: number, y: number }>} points
   * @returns {Promise<void>}
   */
  async movePath(points) {
    for (const p of points) {
      await this.moveTo(p.x, p.y)
    }
  }

  showIdle() {
    if (this.sprite.anims.isPlaying) this.sprite.anims.stop()
    this.sprite.setTexture(this.spritePack.idle[this.direction].key)
    this.sprite.setOrigin(0.5, this.originY)
    this.sprite.setScale(this.scale)
  }

  playWalk() {
    const key = this.spritePack.animKeys[this.direction]
    if (!this.scene.anims.exists(key)) {
      ensureSoobinWalkAnims(this.scene, this.spritePack)
    }
    if (this.sprite.anims.currentAnim?.key === key && this.sprite.anims.isPlaying) {
      return
    }
    this.sprite.setOrigin(0.5, this.originY)
    this.sprite.anims.play(key, true)
    this.sprite.setScale(this.scale)
  }

  updateDirectionToward(dx, dy) {
    if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left'
    } else {
      this.direction = dy > 0 ? 'down' : 'up'
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  hitsObstacle(x, y) {
    for (const o of this.obstacles) {
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
        return true
      }
    }
    return false
  }

  /**
   * Push a feet point out of any overlapping AABB (nearest edge).
   * @param {number} x
   * @param {number} y
   */
  resolveObstacles(x, y) {
    let nx = x
    let ny = y
    for (const o of this.obstacles) {
      if (nx < o.x || nx > o.x + o.w || ny < o.y || ny > o.y + o.h) continue
      const left = nx - o.x
      const right = o.x + o.w - nx
      const top = ny - o.y
      const bottom = o.y + o.h - ny
      const m = Math.min(left, right, top, bottom)
      if (m === left) nx = o.x - 1
      else if (m === right) nx = o.x + o.w + 1
      else if (m === top) ny = o.y - 1
      else ny = o.y + o.h + 1
    }
    return { x: nx, y: ny }
  }

  /**
   * @param {number} delta
   */
  update(delta) {
    if (!this.moving) {
      this.sprite.setPosition(this.feetX, this.feetY)
      this.syncDepth()
      return
    }

    const dx = this.targetX - this.feetX
    const dy = this.targetY - this.feetY
    const dist = Math.hypot(dx, dy)

    if (dist <= this.arriveThreshold) {
      this.feetX = this.targetX
      this.feetY = this.targetY
      this.moving = false
      this.showIdle()
      this.sprite.setPosition(this.feetX, this.feetY)
      this.syncDepth()
      const resolve = this._arriveResolve
      this._arriveResolve = null
      resolve?.()
      return
    }

    const dt = delta / 1000
    const step = Math.min(this.speed * dt, dist)
    const nx = dx / dist
    const ny = dy / dist
    let nextX = this.feetX + nx * step
    let nextY = this.feetY + ny * step

    if (this.hitsObstacle(nextX, nextY)) {
      const slideX = this.feetX + nx * step
      const slideY = this.feetY
      const slideYOnly = this.feetY + ny * step
      const slideXOnly = this.feetX
      if (!this.hitsObstacle(slideX, slideY)) {
        nextX = slideX
        nextY = slideY
      } else if (!this.hitsObstacle(slideXOnly, slideYOnly)) {
        nextX = slideXOnly
        nextY = slideYOnly
      } else {
        const fixed = this.resolveObstacles(nextX, nextY)
        nextX = fixed.x
        nextY = fixed.y
      }
    }

    this.feetX = nextX
    this.feetY = nextY
    this.updateDirectionToward(dx, dy)
    this.playWalk()
    this.sprite.setPosition(this.feetX, this.feetY)
    this.syncDepth()
  }

  /**
   * Attach user PNG sad/cry face above head (follows Soobin).
   * @param {'sad' | 'cry' | null} kind
   */
  setEmotion(kind) {
    if (!kind) {
      this.clearEmotion()
      return
    }
    const texKey =
      kind === 'cry' ? SCENE_03.emotion.cryKey : SCENE_03.emotion.sadKey

    if (this.emotion && this.emotionKind === kind) {
      this.syncEmotionPosition()
      return
    }

    this.clearEmotion()
    this.emotionKind = kind
    this.emotion = this.scene.add.image(this.feetX, this.headY(), texKey)
    this.emotion.setOrigin(0.5, 1)
    this.emotion.setScale(SCENE_03.emotion.scale)
    if (this.emotion.texture) {
      this.emotion.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
    }
    this.syncEmotionPosition()
  }

  clearEmotion() {
    this.emotion?.destroy()
    this.emotion = null
    this.emotionKind = null
  }

  destroy() {
    this.clearEmotion()
    this.sprite?.destroy()
  }
}
