import Phaser from 'phaser'
import { SCENE_07, SCENE7_VISIBLE_HEIGHT } from '../data/scene07'
import { scaleForVisibleHeight } from '../data/characterScale'
import { SCENE_KEYS } from '../data/scene01'
import {
  SUDE_COLOR,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { LetterBoard } from '../ui/LetterBoard'
import { FadeTransition } from '../systems/FadeTransition'
import {
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
} from '../systems/GameViewport'
import { loadGameImage } from '../systems/assetUrl'

/**
 * Scene 7 — reunion cafe: walkable Sude + family + Soobin/Yeonjun/Beomgyu/Tyunning.
 */
export class ReunionScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_7)
    this.sude = null
    this.inputManager = null
    this.touchPad = null
    this.chestClose = null
    this.chestOpen = null
    this.letterBoard = null
    this.chestOpened = false
    this.movementEnabled = false
  }

  preload() {
    loadGameImage(this, SCENE_07.textureKey, SCENE_07.texturePath)
    loadGameImage(this, SCENE_07.chest.closeKey, SCENE_07.chest.closePath)
    loadGameImage(this, SCENE_07.chest.openKey, SCENE_07.chest.openPath)
    preloadSudeVariant(this, SUDE_COLOR)
    for (const ch of SCENE_07.lineup) {
      loadGameImage(this, ch.textureKey, ch.texturePath)
    }
    this.load.on('loaderror', (file) => {
      console.error('[ReunionScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.chestOpened = false
    this.letterBoard = null
    this.movementEnabled = false

    const bg = this.add.image(0, 0, SCENE_07.textureKey)
    bg.setOrigin(0, 0)
    bg.setDepth(0)

    this.setupCamera()
    this.physics.world.setBounds(0, 0, SCENE_07.width, SCENE_07.height)

    this.placeLineup()
    this.placeChest()
    this.placeSude()

    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)
    this.touchPad = createTouchDPad(this)
    this.touchPad?.setVisible(false)

    const fade = new FadeTransition(this)
    void fade.fadeIn(650).then(() => {
      this.movementEnabled = true
      this.inputManager.setEnabled(true)
      this.sude.setLocked(false)
      this.touchPad?.setVisible(true)
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this)
  }

  setupCamera() {
    const cam = this.cameras.main
    cam.setBackgroundColor('#000000')
    const zoom = Math.min(
      VIEWPORT_WIDTH / SCENE_07.width,
      VIEWPORT_HEIGHT / SCENE_07.height,
    )
    cam.setZoom(zoom)
    const viewW = VIEWPORT_WIDTH / zoom
    const viewH = VIEWPORT_HEIGHT / zoom
    const padX = Math.max(0, (viewW - SCENE_07.width) / 2)
    const padY = Math.max(0, (viewH - SCENE_07.height) / 2)
    cam.setBounds(
      -padX,
      -padY,
      SCENE_07.width + padX * 2,
      SCENE_07.height + padY * 2,
    )
    cam.centerOn(SCENE_07.width / 2, SCENE_07.height / 2)
  }

  placeSude() {
    const s = SCENE_07.sude
    applySudeNearestFilter(this, SUDE_COLOR)
    const scale = scaleForVisibleHeight(
      s.visibleAlphaHeight,
      SCENE7_VISIBLE_HEIGHT,
    )
    this.logCharacterTexture('sude', s.textureKey, s.texturePath, s.visibleAlphaHeight, scale)
    this.sude = new Sude(this, s.x, s.y, {
      spritePack: SUDE_COLOR,
      speed: SCENE_07.sudeMove.speed,
      direction: 'down',
      path: { ...SCENE_07.sudeMove.path },
      perspective: {
        yNear: s.y,
        yFar: s.y,
        scaleNear: scale,
        scaleFar: scale,
      },
    })
    this.sude.setLocked(true)
  }

  /**
   * @param {string} id
   * @param {string} textureKey
   * @param {string} texturePath
   * @param {number} visibleAlphaHeight
   * @param {number} scale
   */
  logCharacterTexture(id, textureKey, texturePath, visibleAlphaHeight, scale) {
    const tex = this.textures.exists(textureKey)
      ? this.textures.get(textureKey)
      : null
    const src = tex?.getSourceImage?.()
    const url =
      (src && 'src' in src && typeof src.src === 'string' && src.src) ||
      texturePath
    console.info(
      `[Scene7] ${id} png=${texturePath} key=${textureKey} url=${url} alphaBBoxH=${visibleAlphaHeight} scale=${scale.toFixed(5)} visibleH=${SCENE7_VISIBLE_HEIGHT}`,
    )
  }

  placeLineup() {
    const { lineup } = SCENE_07
    lineup.forEach((ch, i) => {
      if (this.textures.exists(ch.textureKey)) {
        this.textures.get(ch.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST)
      }
      const scale = scaleForVisibleHeight(
        ch.visibleAlphaHeight,
        SCENE7_VISIBLE_HEIGHT,
      )
      this.logCharacterTexture(
        ch.id,
        ch.textureKey,
        ch.texturePath,
        ch.visibleAlphaHeight,
        scale,
      )
      const spr = this.add.image(ch.x, ch.y, ch.textureKey)
      spr.setOrigin(0.5, ch.originY)
      spr.setScale(scale)
      spr.setDepth(20 + ch.y + i * 0.01)
    })
  }

  placeChest() {
    const c = SCENE_07.chest
    for (const key of [c.closeKey, c.openKey]) {
      if (this.textures.exists(key)) {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
      }
    }

    this.chestClose = this.add.image(c.x, c.y, c.closeKey)
    this.chestClose.setOrigin(0.5, c.originY)
    this.chestClose.setScale(c.closeScale)
    this.chestClose.setDepth(40 + c.y)
    this.chestClose.setInteractive({ useHandCursor: true })
    this.chestClose.on('pointerdown', () => this.openChest())

    this.chestOpen = this.add.image(c.x, c.y, c.openKey)
    this.chestOpen.setOrigin(0.5, c.originY)
    this.chestOpen.setScale(c.openScale)
    this.chestOpen.setDepth(40 + c.y)
    this.chestOpen.setVisible(false)
    this.chestOpen.on('pointerdown', () => this.showLetters())
  }

  setWalkEnabled(on) {
    this.movementEnabled = on
    this.inputManager?.setEnabled(on)
    this.sude?.setLocked(!on)
    this.touchPad?.setVisible(on)
  }

  openChest() {
    if (this.chestOpened) return
    this.chestOpened = true
    this.chestClose.disableInteractive()
    this.chestClose.setVisible(false)
    this.chestOpen.setVisible(true)
    this.chestOpen.setInteractive({ useHandCursor: true })
    this.showLetters()
  }

  showLetters() {
    if (this.letterBoard) return
    this.setWalkEnabled(false)
    this.letterBoard = new LetterBoard(this, {
      onClose: () => {
        this.letterBoard = null
        this.setWalkEnabled(true)
      },
    })
  }

  /**
   * @param {number} _time
   * @param {number} delta
   */
  update(_time, delta) {
    if (!this.sude || !this.inputManager) return
    if (this.movementEnabled && !this.letterBoard) {
      const { x, y } = this.inputManager.getMoveVector()
      this.sude.setMoveInput(x, y)
    } else {
      this.sude.setMoveInput(0, 0)
    }
    this.sude.update(delta)
  }

  shutdownScene() {
    this.letterBoard?.destroy()
    this.letterBoard = null
    this.touchPad?.destroy()
    this.touchPad = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
    this.chestClose = null
    this.chestOpen = null
  }
}
