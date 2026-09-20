import Phaser from 'phaser'
import { SCENE_04, SCENE_KEYS } from '../data/scene01'
import {
  SUDE_COLOR,
  SUDE_BW,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import { Sude } from '../entities/Sude'
import { InputManager } from '../input/InputManager'
import { createTouchDPad } from '../input/TouchDPad'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import {
  VIEWPORT_HEIGHT,
  applySharedViewportCamera,
} from '../systems/GameViewport'
import { loadGameImage } from '../systems/assetUrl'

/**
 * Scene 4 — autumn cafe exit → grayscale pit.
 * Color fade follows world X; pit fall uses perspective shrink then fade.
 */
export class AutumnScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_4)
    this.sude = null
    this.inputManager = null
    this.touchPad = null
    this.segmentOrigins = /** @type {Record<string, { x: number, y: number, width: number, height: number }>} */ ({})
    this.worldWidth = 0
    this.worldHeight = 0
    this.rightPad = 0
    this.colorFullX = 0
    this.colorNoneX = 0
    this.flowState = 'FREE'
    this.movementEnabled = false
  }

  preload() {
    for (const seg of SCENE_04.segments) {
      loadGameImage(this, seg.key, seg.path)
    }
    preloadSudeVariant(this, SUDE_COLOR)
    preloadSudeVariant(this, SUDE_BW)

    this.load.on('loaderror', (file) => {
      console.error('[AutumnScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.flowState = 'FREE'
    this.movementEnabled = false

    this.placeBackgrounds()
    applySudeNearestFilter(this, SUDE_COLOR)
    applySudeNearestFilter(this, SUDE_BW)
    applySharedViewportCamera(this, this.worldWidth, this.worldHeight)

    const seg01 = this.segmentOrigins['scene04-01']
    const seg02 = this.segmentOrigins['scene04-02']
    this.colorFullX = seg02.x + SCENE_04.colorFade.fullColorLocalXOn02
    this.colorNoneX = seg01.x + SCENE_04.colorFade.fullBwLocalXOn01

    const spawn = this.resolveSpawn()

    this.sude = new Sude(this, spawn.x, spawn.y, {
      spritePack: SUDE_COLOR,
      speed: SCENE_04.movementSpeed,
      direction: 'left',
      path: {
        mode: 'box',
        xMin: 24,
        xMax: seg02.x + seg02.width - 24,
        yMin: SCENE_04.path.yMin,
        yMax: SCENE_04.path.yMax,
      },
      perspective: {
        yNear: SCENE_04.perspective.yNear,
        yFar: SCENE_04.perspective.yFar,
        scaleNear: SCENE_04.perspective.scaleNear,
        scaleFar: SCENE_04.perspective.scaleFar,
      },
    })
    this.sude.setDesaturation(this.getDesaturationAt(spawn.x))

    this.inputManager = new InputManager(this)
    this.inputManager.setEnabled(false)

    this.cameras.main.startFollow(this.sude.sprite, true, 0.12, 0.12)
    this.cameras.main.setDeadzone(100, 70)

    this.snapCameraToCafeSide()

    this.touchPad = createTouchDPad(this)

    this.game.registry.set('autumnScene', this)
    if (typeof window !== 'undefined') {
      window.__SUDE_AUTUMN__ = this
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

    const order = SCENE_04.worldOrder
    const byKey = Object.fromEntries(SCENE_04.segments.map((s) => [s.key, s]))

    for (const key of order) {
      const tex = this.textures.get(key)
      const src = tex?.getSourceImage?.()
      const width = src?.width ?? byKey[key]?.width ?? 0
      const height = src?.height ?? byKey[key]?.height ?? 0
      maxH = Math.max(maxH, height)
      this.segmentOrigins[key] = { x: cursorX, y: 0, width, height }
      cursorX += width
    }

    this.worldHeight = maxH
    const fitZoom = maxH > 0 ? VIEWPORT_HEIGHT / maxH : 1
    const viewWorldW = this.scale.gameSize.width / fitZoom

    const seg02 = this.segmentOrigins['scene04-02']
    const needWorld = seg02.x + viewWorldW
    this.rightPad = Math.max(SCENE_04.rightPadMin, needWorld - cursorX)
    this.worldWidth = cursorX + this.rightPad

    for (const key of order) {
      const origin = this.segmentOrigins[key]
      const img = this.add.image(origin.x, origin.y, key)
      img.setOrigin(0, 0)
      img.setDepth(0)
    }
  }

  resolveSpawn() {
    const c02 = this.segmentOrigins['scene04-02']
    return {
      x: c02.x + SCENE_04.spawn.localXOn02,
      y: SCENE_04.spawn.localY,
    }
  }

  snapCameraToCafeSide() {
    const seg02 = this.segmentOrigins['scene04-02']
    const cam = this.cameras.main
    const viewW = cam.width / cam.zoom
    let scrollX = seg02.x
    const maxScroll = Math.max(0, this.worldWidth - viewW)
    scrollX = Phaser.Math.Clamp(scrollX, 0, maxScroll)

    const desired = this.sude.x - viewW * 0.55
    scrollX = Phaser.Math.Clamp(Math.max(scrollX, desired), 0, maxScroll)

    cam.scrollX = scrollX
    cam.scrollY = 0
  }

  /**
   * World-X color amount: 1 at cafe / autumn, 0 at winter pit approach.
   * @param {number} worldX
   */
  getColorAmountAt(worldX) {
    const span = this.colorFullX - this.colorNoneX
    if (span <= 1) return worldX >= this.colorFullX ? 1 : 0
    return Phaser.Math.Clamp((worldX - this.colorNoneX) / span, 0, 1)
  }

  /**
   * @param {number} worldX
   */
  getDesaturationAt(worldX) {
    return 1 - this.getColorAmountAt(worldX)
  }

  updateSudeColorFromPosition() {
    if (!this.sude || this.flowState !== 'FREE') return
    this.sude.setDesaturation(this.getDesaturationAt(this.sude.x))
  }

  getPitWorldPos() {
    const seg01 = this.segmentOrigins['scene04-01']
    return {
      x: seg01.x + SCENE_04.pit.localX,
      y: SCENE_04.pit.localY,
    }
  }

  isOverPit() {
    if (!this.sude) return false
    const pit = this.getPitWorldPos()
    const dx = this.sude.x - pit.x
    const dy = this.sude.y - pit.y
    return Math.hypot(dx, dy) <= SCENE_04.pit.radius
  }

  async triggerPitFall() {
    if (this.flowState !== 'FREE') return
    this.flowState = 'FALLING'

    this.movementEnabled = false
    this.inputManager.setEnabled(false)
    this.touchPad?.setVisible(false)

    // Freeze camera on the pit area — no follow during shrink.
    const cam = this.cameras.main
    cam.stopFollow()
    const freezeX = cam.scrollX
    const freezeY = cam.scrollY

    this.sude.setLocked(true)
    this.sude.setDesaturation(1)
    this.sude.direction = 'down'
    this.sude.showIdle()

    const pit = this.getPitWorldPos()
    const {
      alignDurationMs,
      fallDurationMs,
      fallDeltaY,
      fadeDurationMs,
    } = SCENE_04.pit

    // 1) Snap toward pit mouth / center
    await new Promise((resolve) => {
      this.tweens.add({
        targets: this.sude,
        feetX: pit.x,
        feetY: pit.y - 6,
        duration: alignDurationMs,
        ease: 'Sine.easeOut',
        onUpdate: () => {
          cam.scrollX = freezeX
          cam.scrollY = freezeY
          this.sude.applyPerspectiveScale()
          this.sude.syncVisual()
        },
        onComplete: () => resolve(),
      })
    })

    // 2) Perspective fall: Y down + scale → 0 (fast ease-in)
    const startScale = this.sude.sprite.scaleX
    const startY = this.sude.feetY
    const endY = pit.y + fallDeltaY
    const fallProxy = { t: 0 }

    await new Promise((resolve) => {
      this.tweens.add({
        targets: fallProxy,
        t: 1,
        duration: fallDurationMs,
        ease: 'Cubic.easeIn',
        onUpdate: () => {
          cam.scrollX = freezeX
          cam.scrollY = freezeY
          const t = fallProxy.t
          // Ease scale harder near the end so she vanishes into the hole.
          const scaleT = t * t
          this.sude.feetY = Phaser.Math.Linear(startY, endY, t)
          this.sude.feetX = pit.x
          this.sude.scaleOverride = startScale * (1 - scaleT)
          this.sude.sprite.setAlpha(1 - scaleT * 0.15)
          this.sude.applyPerspectiveScale()
          this.sude.syncVisual()
        },
        onComplete: () => {
          this.sude.scaleOverride = 0
          this.sude.sprite.setVisible(false)
          this.sude.applyPerspectiveScale()
          resolve()
        },
      })
    })

    // 3) Fade to black after she has disappeared, then Scene 5.
    this.flowState = 'BLACK'
    await fadeToScene(this, SCENE_KEYS.SCENE_5, {}, fadeDurationMs)
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

    if (this.flowState === 'FREE') {
      this.updateSudeColorFromPosition()
      if (this.isOverPit()) {
        void this.triggerPitFall()
      }
    }
  }

  shutdownScene() {
    this.touchPad?.destroy()
    this.touchPad = null
    this.inputManager?.destroy()
    this.inputManager = null
    this.sude?.destroy()
    this.sude = null
    if (typeof window !== 'undefined' && window.__SUDE_AUTUMN__ === this) {
      window.__SUDE_AUTUMN__ = null
    }
  }
}
