import Phaser from 'phaser'
import { SCENE_02, SCENE_KEYS } from '../data/scene01'
import {
  SUDE_COLOR,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { HorizontalInteractionArrow } from '../systems/HorizontalInteractionArrow'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import { applySharedViewportCamera } from '../systems/GameViewport'

/**
 * Scene 2 — color campus path.
 * Shared fixed viewport; backgrounds placed 1:1 in world, camera zooms to fill height.
 */
export class CampusScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_2)
    this.sude = null
    this.inputManager = null
    this.touchPad = null
    this.cafeArrow = null
    this.cafeZone = null
    this.cafeDoor = null
    this.segmentOrigins = /** @type {Record<string, { x: number, y: number, width: number, height: number }>} */ ({})
    this.worldWidth = 0
    this.worldHeight = 0
    this.flowState = 'FREE'
    this.movementEnabled = false
  }

  preload() {
    for (const seg of SCENE_02.segments) {
      this.load.image(seg.key, seg.path)
    }
    preloadSudeVariant(this, SUDE_COLOR)

    this.load.on('loaderror', (file) => {
      console.error('[CampusScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.flowState = 'FREE'
    this.movementEnabled = false

    this.placeBackgrounds()
    applySudeNearestFilter(this, SUDE_COLOR)
    applySharedViewportCamera(this, this.worldWidth, this.worldHeight)

    const spawn = this.resolveSpawn()
    this.sude = new Sude(this, spawn.x, spawn.y, {
      spritePack: SUDE_COLOR,
      speed: SCENE_02.movementSpeed,
      direction: 'right',
      path: {
        mode: 'box',
        xMin: 40,
        xMax: this.worldWidth - 40,
        yMin: SCENE_02.path.yMin,
        yMax: SCENE_02.path.yMax,
      },
      perspective: {
        yNear: SCENE_02.perspective.yNear,
        yFar: SCENE_02.perspective.yFar,
        scaleNear: SCENE_02.perspective.scaleNear,
        scaleFar: SCENE_02.perspective.scaleFar,
      },
    })

    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)

    this.cameras.main.startFollow(this.sude.sprite, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(120, 80)

    this.createCafeInteraction()

    this.touchPad = createTouchDPad(this)

    this.game.registry.set('campusScene', this)
    if (typeof window !== 'undefined') {
      window.__SUDE_CAMPUS__ = this
    }

    const fade = new FadeTransition(this)
    void fade.fadeIn(700).then(() => {
      this.movementEnabled = true
      this.inputManager.setEnabled(true)
      this.sude.setLocked(false)
      this.touchPad?.setVisible(true)
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this)
  }

  placeBackgrounds() {
    let cursorX = 0
    let maxH = 0

    const order = SCENE_02.worldOrder
    const byKey = Object.fromEntries(SCENE_02.segments.map((s) => [s.key, s]))

    for (const key of order) {
      const tex = this.textures.get(key)
      const src = tex?.getSourceImage?.()
      const width = src?.width ?? byKey[key]?.width ?? 0
      const height = src?.height ?? byKey[key]?.height ?? 0
      maxH = Math.max(maxH, height)
      this.segmentOrigins[key] = { x: cursorX, y: 0, width, height }
      cursorX += width
    }

    this.worldWidth = cursorX
    this.worldHeight = maxH

    for (const key of order) {
      const origin = this.segmentOrigins[key]
      const img = this.add.image(origin.x, origin.y, key)
      img.setOrigin(0, 0)
      img.setDepth(0)
    }
  }

  resolveSpawn() {
    const c01 = this.segmentOrigins['campus-01']
    return {
      x: c01.x + SCENE_02.spawn.localXOnCampus01,
      y: SCENE_02.spawn.localY,
    }
  }

  createCafeInteraction() {
    const door = this.getCafeDoorWorld()
    const cafe = SCENE_02.cafeInteraction

    this.cafeDoor = door
    this.cafeZone = this.add.zone(
      door.x,
      door.y,
      cafe.zoneWidth,
      cafe.zoneHeight,
    )
    this.physics.add.existing(this.cafeZone, true)

    this.cafeArrow = new HorizontalInteractionArrow(this, {
      x: door.x + cafe.arrowOffsetX,
      y: door.y + cafe.arrowOffsetY,
      direction: cafe.arrowDirection,
      onActivate: () => {
        void this.onCafeActivated()
      },
    })
  }

  getCafeDoorWorld() {
    const c02 = this.segmentOrigins['campus-02']
    const cafe = SCENE_02.cafeInteraction
    return {
      x: c02.x + cafe.doorLocalX,
      y: cafe.doorLocalY,
    }
  }

  isInCafeZone() {
    if (!this.sude || !this.cafeDoor) return false
    const dx = this.sude.x - this.cafeDoor.x
    const dy = this.sude.y - this.cafeDoor.y
    return Math.hypot(dx, dy) <= SCENE_02.cafeInteraction.radius
  }

  async onCafeActivated() {
    if (this.flowState !== 'FREE') return
    if (!this.cafeArrow?.visible && !this.isInCafeZone()) return

    this.flowState = 'TRANSITIONING'
    this.cafeArrow.disable()
    this.movementEnabled = false
    this.inputManager.setEnabled(false)
    this.touchPad?.setVisible(false)
    this.sude.setLocked(true)

    const { enterStepX, enterDurationMs } = SCENE_02.cafeInteraction
    await this.sude.stepToward({
      deltaX: enterStepX,
      direction: 'right',
      durationMs: enterDurationMs,
    })
    await fadeToScene(this, SCENE_KEYS.SCENE_3, {}, 800)
  }

  /**
   * @param {number} _time
   * @param {number} delta
   */
  update(_time, delta) {
    if (!this.sude || !this.inputManager) return

    if (this.movementEnabled && this.flowState === 'FREE') {
      const { x, y } = this.inputManager.getMoveVector()
      this.sude.setMoveInput(x, y)
    } else {
      this.sude.setMoveInput(0, 0)
    }

    this.sude.update(delta)

    const showArrow = this.flowState === 'FREE' && this.isInCafeZone()
    this.cafeArrow?.setInZone(showArrow)
  }

  shutdownScene() {
    this.touchPad?.destroy()
    this.touchPad = null
    this.cafeArrow?.destroy()
    this.cafeArrow = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
    this.cafeZone = null
    this.cafeDoor = null
  }
}
