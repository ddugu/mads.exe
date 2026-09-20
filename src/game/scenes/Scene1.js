import Phaser from 'phaser'
import {
  SCENE_01,
  SCENE_KEYS,
  SCENE1_STATE,
  TUTORIAL_COPY,
} from '../data/scene01'
import {
  preloadSudeTextures,
  applySudeNearestFilter,
  SUDE_BW,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { DoorInteraction } from '../systems/DoorInteraction'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import { PixelPopup } from '../ui/PixelPopup'
import { applyFullscreenViewportCamera } from '../systems/GameViewport'
import { loadGameImage } from '../systems/assetUrl'

/**
 * Scene 1 — grayscale road toward SUDE.EXE gate.
 * Tutorial state machine → free movement → door click → CampusScene.
 */
export class Scene1 extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_1)
    this.sude = null
    this.inputManager = null
    this.doorZone = null
    this.doorInteraction = null
    this.touchPad = null
    this.flowState = SCENE1_STATE.TUTORIAL_1
    this.hasMovedOnce = false
    this.movementEnabled = false
    this.activePopup = null
  }

  preload() {
    loadGameImage(this, SCENE_01.textureKey, SCENE_01.texturePath)
    preloadSudeTextures(this)

    this.load.on('loaderror', (file) => {
      console.error('[Scene1] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.flowState = SCENE1_STATE.TUTORIAL_1
    this.hasMovedOnce = false
    this.movementEnabled = false
    this.activePopup = null

    this.createBackground()
    this.applyTextureFilters()

    applyFullscreenViewportCamera(this)

    this.physics.world.setBounds(0, 0, SCENE_01.width, SCENE_01.height)

    this.sude = new Sude(this, SCENE_01.spawn.x, SCENE_01.spawn.y, {
      spritePack: SUDE_BW,
    })
    this.sude.setLocked(true)
    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)

    // Test hook: window.__SUDE_SCENE__ / registry sudeDebug
    this.game.registry.set('scene1', this)
    if (typeof window !== 'undefined') {
      window.__SUDE_SCENE__ = this
    }

    this.createDoorZone()
    this.doorInteraction = new DoorInteraction(this, {
      arrowX: SCENE_01.doorInteraction.arrowX,
      arrowY: SCENE_01.doorInteraction.arrowY,
      onActivate: () => {
        void this.onDoorActivated()
      },
    })

    this.touchPad = createTouchDPad(this)
    this.touchPad?.setVisible(false)

    const fade = new FadeTransition(this)
    void fade.fadeIn(700).then(() => {
      this.openTutorial1()
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this)
  }

  createBackground() {
    const bg = this.add.image(0, 0, SCENE_01.textureKey)
    bg.setOrigin(0, 0)
    bg.setDepth(0)
  }

  applyTextureFilters() {
    applySudeNearestFilter(this, SUDE_BW)
  }

  createDoorZone() {
    const { doorInteraction } = SCENE_01
    this.doorZone = this.add.zone(
      doorInteraction.x,
      doorInteraction.y,
      doorInteraction.width,
      doorInteraction.height,
    )
    this.physics.add.existing(this.doorZone, true)
  }

  setMovementEnabled(enabled) {
    this.movementEnabled = enabled
    this.inputManager.setEnabled(enabled)
    this.sude.setLocked(!enabled)
    this.touchPad?.setVisible(enabled)
  }

  openTutorial1() {
    this.flowState = SCENE1_STATE.TUTORIAL_1
    this.setMovementEnabled(false)
    this.activePopup = new PixelPopup(this, {
      message: TUTORIAL_COPY[1],
      buttonLabel: TUTORIAL_COPY.ok,
      onConfirm: () => {
        this.activePopup = null
        this.flowState = SCENE1_STATE.WAITING_FIRST_MOVE
        this.setMovementEnabled(true)
      },
    })
  }

  openTutorial2() {
    this.flowState = SCENE1_STATE.TUTORIAL_2
    this.setMovementEnabled(false)
    this.sude.setMoveInput(0, 0)
    this.activePopup = new PixelPopup(this, {
      message: TUTORIAL_COPY[2],
      buttonLabel: TUTORIAL_COPY.ok,
      onConfirm: () => {
        this.activePopup = null
        this.openTutorial3()
      },
    })
  }

  openTutorial3() {
    this.flowState = SCENE1_STATE.TUTORIAL_3
    this.setMovementEnabled(false)
    this.activePopup = new PixelPopup(this, {
      message: TUTORIAL_COPY[3],
      buttonLabel: TUTORIAL_COPY.ok,
      onConfirm: () => {
        this.activePopup = null
        this.flowState = SCENE1_STATE.FREE_MOVEMENT
        this.setMovementEnabled(true)
      },
    })
  }

  /**
   * Skip boot tutorials for automated animation tests.
   */
  forceFreeMovementForTest() {
    this.activePopup?.destroy()
    this.activePopup = null
    this.hasMovedOnce = true
    this.flowState = SCENE1_STATE.FREE_MOVEMENT
    this.setMovementEnabled(true)
  }

  isInDoorZone() {
    if (!this.sude || !this.doorZone) return false
    const bounds = this.doorZone.getBounds()
    return bounds.contains(this.sude.x, this.sude.y)
  }

  async onDoorActivated() {
    if (this.flowState !== SCENE1_STATE.FREE_MOVEMENT) return
    if (!this.isInDoorZone()) return

    this.flowState = SCENE1_STATE.TRANSITIONING
    this.doorInteraction.disable()
    this.setMovementEnabled(false)
    this.sude.setLocked(true)

    const { enterStepY, enterDurationMs } = SCENE_01.doorInteraction
    await this.sude.stepTowardDoor(enterStepY, enterDurationMs)
    await fadeToScene(this, SCENE_KEYS.SCENE_2, {}, 800)
  }

  /**
   * @param {number} _time
   * @param {number} delta
   */
  update(_time, delta) {
    if (!this.sude || !this.inputManager) return

    const canMove =
      this.movementEnabled &&
      (this.flowState === SCENE1_STATE.WAITING_FIRST_MOVE ||
        this.flowState === SCENE1_STATE.FREE_MOVEMENT)

    if (canMove) {
      const { x, y } = this.inputManager.getMoveVector()

      if (
        this.flowState === SCENE1_STATE.WAITING_FIRST_MOVE &&
        !this.hasMovedOnce &&
        (x !== 0 || y !== 0)
      ) {
        this.hasMovedOnce = true
        this.sude.setMoveInput(0, 0)
        this.openTutorial2()
        this.sude.update(delta)
        return
      }

      this.sude.setMoveInput(x, y)
    } else {
      this.sude.setMoveInput(0, 0)
    }

    this.sude.update(delta)

    const showDoor =
      this.flowState === SCENE1_STATE.FREE_MOVEMENT && this.isInDoorZone()
    this.doorInteraction?.setInZone(showDoor)
  }

  shutdownScene() {
    this.activePopup?.destroy()
    this.activePopup = null
    this.touchPad?.destroy()
    this.touchPad = null
    this.doorInteraction?.destroy()
    this.doorInteraction = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
    this.doorZone = null
  }
}
