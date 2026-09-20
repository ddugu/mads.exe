import Phaser from 'phaser'
import { SCENE_05, SCENE_KEYS } from '../data/scene01'
import {
  SUDE_BW,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { HorizontalInteractionArrow } from '../systems/HorizontalInteractionArrow'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import { applyFullscreenViewportCamera } from '../systems/GameViewport'
import { loadGameImage } from '../systems/assetUrl'

/**
 * Scene 5 — grayscale unlabeled gate (scene-05.png, no SUDE.EXE).
 * Walk from the road toward the door; arrow click → Scene 6.
 */
export class GateScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_5)
    this.sude = null
    this.inputManager = null
    this.touchPad = null
    this.doorArrow = null
    this.flowState = 'FREE'
    this.movementEnabled = false
    this.lockedInDoor = false
  }

  preload() {
    loadGameImage(this, SCENE_05.textureKey, SCENE_05.texturePath)
    preloadSudeVariant(this, SUDE_BW)
    this.load.on('loaderror', (file) => {
      console.error('[GateScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.flowState = 'FREE'
    this.movementEnabled = false
    this.lockedInDoor = false

    const bg = this.add.image(0, 0, SCENE_05.textureKey)
    bg.setOrigin(0, 0)
    bg.setDepth(0)

    applySudeNearestFilter(this, SUDE_BW)
    applyFullscreenViewportCamera(this)
    this.physics.world.setBounds(0, 0, SCENE_05.width, SCENE_05.height)

    this.sude = new Sude(this, SCENE_05.spawn.x, SCENE_05.spawn.y, {
      spritePack: SUDE_BW,
      speed: SCENE_05.movementSpeed,
      direction: 'up',
      path: { ...SCENE_05.path, mode: 'tapered' },
      perspective: { ...SCENE_05.perspective },
    })
    this.sude.setLocked(true)

    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)

    this.doorArrow = new HorizontalInteractionArrow(this, {
      x: SCENE_05.doorInteraction.arrowX,
      y: SCENE_05.doorInteraction.arrowY,
      direction: 'up',
      onActivate: () => {
        void this.onDoorActivated()
      },
    })

    this.touchPad = createTouchDPad(this)
    this.touchPad?.setVisible(false)

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

  isInDoorZone() {
    if (!this.sude) return false
    const d = SCENE_05.doorInteraction
    const dx = this.sude.x - d.x
    const dy = this.sude.y - d.y
    return Math.hypot(dx, dy) <= (d.radius ?? 95)
  }

  async onDoorActivated() {
    if (this.flowState !== 'FREE') return
    if (!this.doorArrow?.visible && !this.isInDoorZone()) return

    this.flowState = 'TRANSITIONING'
    this.doorArrow.disable()
    this.movementEnabled = false
    this.inputManager.setEnabled(false)
    this.touchPad?.setVisible(false)
    this.sude.setLocked(true)

    const { enterStepY, enterDurationMs } = SCENE_05.doorInteraction
    await this.sude.stepTowardDoor(enterStepY, enterDurationMs)
    await fadeToScene(this, SCENE_KEYS.SCENE_6, {}, 800)
  }

  /**
   * @param {number} _time
   * @param {number} delta
   */
  update(_time, delta) {
    if (!this.sude || !this.inputManager) return

    if (this.flowState === 'FREE' && this.isInDoorZone()) {
      if (!this.lockedInDoor) {
        this.lockedInDoor = true
        this.movementEnabled = false
        this.sude.setLocked(true)
        this.sude.setMoveInput(0, 0)
        this.touchPad?.setVisible(false)
      }
      this.doorArrow?.setInZone(true)
    } else if (this.flowState === 'FREE') {
      this.doorArrow?.setInZone(false)
    }

    if (this.movementEnabled && this.flowState === 'FREE' && !this.lockedInDoor) {
      const { x, y } = this.inputManager.getMoveVector()
      this.sude.setMoveInput(x, y)
    } else {
      this.sude.setMoveInput(0, 0)
    }

    this.sude.update(delta)
  }

  shutdownScene() {
    this.touchPad?.destroy()
    this.touchPad = null
    this.doorArrow?.destroy()
    this.doorArrow = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
  }
}
