import Phaser from 'phaser'
import { SCENE_06, SCENE_KEYS } from '../data/scene01'
import {
  SUDE_COLOR,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import { applyFullscreenViewportCamera } from '../systems/GameViewport'
import { loadGameImage } from '../systems/assetUrl'
import { DIALOGUE_FONT, smoothDialogueText, uiTextResolution } from '../ui/uiFont'

/**
 * Scene 6 — color dorm. No chair. Monitor button is visible immediately.
 */
export class DormScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_6)
    this.sude = null
    this.inputManager = null
    this.touchPad = null
    this.cafeButton = null
    this.cafeHit = null
    this.flowState = 'FREE'
    this.movementEnabled = false
  }

  preload() {
    loadGameImage(this, SCENE_06.textureKey, SCENE_06.texturePath)
    preloadSudeVariant(this, SUDE_COLOR)
    this.load.on('loaderror', (file) => {
      console.error('[DormScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.flowState = 'FREE'
    this.movementEnabled = false

    const bg = this.add.image(0, 0, SCENE_06.textureKey)
    bg.setOrigin(0, 0)
    bg.setDepth(0)

    applySudeNearestFilter(this, SUDE_COLOR)
    applyFullscreenViewportCamera(this)
    this.physics.world.setBounds(0, 0, SCENE_06.width, SCENE_06.height)

    const spawn = SCENE_06.spawn
    this.sude = new Sude(this, spawn.x, spawn.y, {
      spritePack: SUDE_COLOR,
      speed: SCENE_06.movementSpeed,
      direction: spawn.direction ?? 'up',
      path: { ...SCENE_06.path, mode: 'box' },
      perspective: { ...SCENE_06.perspective },
    })
    this.sude.setLocked(true)

    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)

    this.createCafeButton()

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

  createCafeButton() {
    const m = SCENE_06.monitor
    const resolution = uiTextResolution(this)
    this.cafeButton = this.add.container(m.x, m.y)
    this.cafeButton.setDepth(9000)
    this.cafeButton.setVisible(true)

    const bg = this.add
      .rectangle(0, 0, m.buttonWidth, m.buttonHeight, 0x141414, 1)
      .setStrokeStyle(2, 0xd8d8d8, 1)
      .setInteractive({ useHandCursor: true })

    const label = this.add
      .text(0, 0, SCENE_06.cafeButtonLabel, {
        fontFamily: DIALOGUE_FONT,
        fontSize: '13px',
        color: '#f4f4f4',
        resolution,
      })
      .setOrigin(0.5)
    smoothDialogueText(label)

    bg.on('pointerover', () => bg.setFillStyle(0x2a2a2a, 1))
    bg.on('pointerout', () => bg.setFillStyle(0x141414, 1))
    bg.on('pointerdown', () => {
      void this.onCafeButton()
    })

    this.cafeHit = bg
    this.cafeButton.add([bg, label])
  }

  async onCafeButton() {
    if (this.flowState !== 'FREE') return
    this.flowState = 'TO_CAMPUS'
    this.cafeHit?.disableInteractive()
    this.movementEnabled = false
    this.inputManager.setEnabled(false)
    this.touchPad?.setVisible(false)
    this.sude.setLocked(true)
    await fadeToScene(this, SCENE_KEYS.SCENE_2, { fromDorm: true }, 700)
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
  }

  shutdownScene() {
    this.touchPad?.destroy()
    this.touchPad = null
    this.cafeButton?.destroy(true)
    this.cafeButton = null
    this.cafeHit = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
  }
}
