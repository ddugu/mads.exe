import Phaser from 'phaser'
import { SCENE_KEYS } from '../data/scene01'
import { SCENE_03, CAFE_SEQUENCE } from '../data/scene03'
import {
  SUDE_COLOR,
  preloadSudeVariant,
  applySudeNearestFilter,
} from '../data/sudeSprites'
import {
  SOOBIN_HOLDING,
  SOOBIN_NORMAL,
  preloadSoobinVariant,
  applySoobinNearestFilter,
} from '../data/soobinSprites'
import { SoobinNpc } from '../entities/SoobinNpc'
import { SpeechDots } from '../ui/SpeechDots'
import { StoryBox } from '../ui/StoryBox'
import { GrowingHeart } from '../ui/GrowingHeart'
import { FadeTransition, fadeToScene } from '../systems/FadeTransition'
import {
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
} from '../systems/GameViewport'

/**
 * Scene 3 — Vegan Cafe automatic first sequence.
 * Sude watches. Soobin follows waypoint paths around furniture.
 */
export class CafeScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.SCENE_3)
    this.soobin = null
    this.sudeSprite = null
    this.yeonjun = null
    /** @type {SpeechDots[]} */
    this.leftBubbles = []
    /** @type {SpeechDots[]} */
    this.rightBubbles = []
    this.state = CAFE_SEQUENCE.START
    this.running = false
    this.cafeBg = null
    this.hugSprite = null
    this.heartFx = null
  }

  preload() {
    this.load.image(SCENE_03.textureKey, SCENE_03.texturePath)
    this.load.image(SCENE_03.hug.textureKey, SCENE_03.hug.texturePath)
    this.load.image(SCENE_03.yeonjun.textureKey, SCENE_03.yeonjun.texturePath)
    this.load.image(SCENE_03.emotion.sadKey, SCENE_03.emotion.sadPath)
    this.load.image(SCENE_03.emotion.cryKey, SCENE_03.emotion.cryPath)
    preloadSudeVariant(this, SUDE_COLOR)
    preloadSoobinVariant(this, SOOBIN_HOLDING)
    preloadSoobinVariant(this, SOOBIN_NORMAL)

    this.load.on('loaderror', (file) => {
      console.error('[CafeScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    this.state = CAFE_SEQUENCE.START
    this.running = false

    this.placeBackground()
    applySudeNearestFilter(this, SUDE_COLOR)
    applySoobinNearestFilter(this, SOOBIN_HOLDING)
    applySoobinNearestFilter(this, SOOBIN_NORMAL)
    this.applyEmotionNearestFilter()
    this.setupCamera()

    this.createSudeWatcher()
    this.createSoobin()
    this.createCustomerBubbles()

    if (typeof window !== 'undefined') {
      window.__SUDE_CAFE__ = this
    }

    const fade = new FadeTransition(this)
    void fade.fadeIn(600).then(async () => {
      this.state = CAFE_SEQUENCE.START
      await StoryBox.show(this, {
        message: SCENE_03.story.intro,
        buttonLabel: 'TAMAM',
      })
      this.state = CAFE_SEQUENCE.SUDE_ENTER
      await this.enterSudeOnMat()
      void this.runSequence()
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownScene, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdownScene, this)
  }

  applyEmotionNearestFilter() {
    for (const key of [SCENE_03.emotion.sadKey, SCENE_03.emotion.cryKey]) {
      if (!this.textures.exists(key)) continue
      // Opaque black matte + huge padding → trim to face, ~48px canvas.
      this.prepareEmotionTexture(key)
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
    }
  }

  /**
   * Knock out black matte, crop to content, resize to 48×48 (in-memory only).
   * @param {string} key
   */
  prepareEmotionTexture(key) {
    const tex = this.textures.get(key)
    const src = tex.getSourceImage()
    if (!src) return

    const w = src.width
    const h = src.height
    const full = document.createElement('canvas')
    full.width = w
    full.height = h
    const fctx = full.getContext('2d')
    if (!fctx) return
    fctx.drawImage(src, 0, 0)
    const imageData = fctx.getImageData(0, 0, w, h)
    const d = imageData.data

    let minX = w
    let minY = h
    let maxX = 0
    let maxY = 0
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = (y * w + x) * 4
        if (d[i] < 18 && d[i + 1] < 18 && d[i + 2] < 18) {
          d[i + 3] = 0
          continue
        }
        if (d[i + 3] < 10) continue
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
    fctx.putImageData(imageData, 0, 0)

    if (maxX <= minX || maxY <= minY) {
      this.textures.remove(key)
      this.textures.addCanvas(key, full)
      return
    }

    const pad = 4
    minX = Math.max(0, minX - pad)
    minY = Math.max(0, minY - pad)
    maxX = Math.min(w - 1, maxX + pad)
    maxY = Math.min(h - 1, maxY + pad)
    const cw = maxX - minX + 1
    const ch = maxY - minY + 1

    const cropped = document.createElement('canvas')
    cropped.width = cw
    cropped.height = ch
    const cctx = cropped.getContext('2d')
    if (!cctx) return
    cctx.drawImage(full, minX, minY, cw, ch, 0, 0, cw, ch)

    const out = document.createElement('canvas')
    out.width = 48
    out.height = 48
    const octx = out.getContext('2d')
    if (!octx) return
    octx.imageSmoothingEnabled = false
    const side = Math.max(cw, ch)
    const dx = Math.floor((48 - (cw / side) * 48) / 2)
    const dy = Math.floor((48 - (ch / side) * 48) / 2)
    const dw = Math.round((cw / side) * 48)
    const dh = Math.round((ch / side) * 48)
    octx.drawImage(cropped, 0, 0, cw, ch, dx, dy, dw, dh)

    this.textures.remove(key)
    this.textures.addCanvas(key, out)
  }

  placeBackground() {
    this.cafeBg = this.add.image(0, 0, SCENE_03.textureKey)
    this.cafeBg.setOrigin(0, 0)
    this.cafeBg.setDepth(0)
  }

  setupCamera() {
    const cam = this.cameras.main
    cam.setBackgroundColor('#000000')

    // Fit cafe inside shared viewport (letterbox inside canvas if needed).
    const zoom = Math.min(
      VIEWPORT_WIDTH / SCENE_03.width,
      VIEWPORT_HEIGHT / SCENE_03.height,
    )
    cam.setZoom(zoom)

    // When zoom is height-limited, visible world is WIDER than the cafe.
    // Expand bounds with equal padding so centerOn can actually center the cafe
    // (tight bounds were clamping scroll → cafe looked off-center).
    const viewW = VIEWPORT_WIDTH / zoom
    const viewH = VIEWPORT_HEIGHT / zoom
    const padX = Math.max(0, (viewW - SCENE_03.width) / 2)
    const padY = Math.max(0, (viewH - SCENE_03.height) / 2)
    cam.setBounds(
      -padX,
      -padY,
      SCENE_03.width + padX * 2,
      SCENE_03.height + padY * 2,
    )
    cam.centerOn(SCENE_03.width / 2, SCENE_03.height / 2)
  }

  createSudeWatcher() {
    const s = SCENE_03.sude
    const key = SUDE_COLOR.idle[s.direction].key
    this.sudeSprite = this.add.sprite(s.doorX, s.doorY, key)
    this.sudeSprite.setOrigin(0.5, s.originY ?? 0.88)
    this.sudeSprite.setScale(s.scale)
    this.sudeSprite.setDepth(20 + s.doorY)
  }

  /** Short walk from door onto doormat center, then freeze. */
  enterSudeOnMat() {
    const s = SCENE_03.sude
    return new Promise((resolve) => {
      this.tweens.add({
        targets: this.sudeSprite,
        x: s.x,
        y: s.y,
        duration: s.entryDurationMs,
        ease: 'Sine.easeOut',
        onUpdate: () => {
          if (this.sudeSprite) {
            this.sudeSprite.setDepth(20 + this.sudeSprite.y)
          }
        },
        onComplete: () => {
          this.sudeSprite?.setPosition(s.x, s.y)
          this.sudeSprite?.setDepth(20 + s.y)
          resolve()
        },
      })
    })
  }

  createSoobin() {
    const { spawn, speed, scale, originY } = SCENE_03.soobin
    this.soobin = new SoobinNpc(this, spawn.x, spawn.y, {
      direction: spawn.direction,
      speed,
      scale,
      originY,
      holding: true,
      obstacles: SCENE_03.obstacles,
    })
  }

  createCustomerBubbles() {
    const pad = SCENE_03.bubblePad
    this.leftBubbles = SCENE_03.leftCustomers.map(
      (c) => new SpeechDots(this, c, pad),
    )
    this.rightBubbles = SCENE_03.rightCustomers.map(
      (c) => new SpeechDots(this, c, pad),
    )
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => resolve())
    })
  }

  /**
   * @param {SpeechDots[]} bubbles
   * @param {string} waitState
   * @param {string} talk1
   * @param {string} talk2
   */
  async playTableTalk(bubbles, waitState, talk1, talk2) {
    const t = SCENE_03.timing

    this.state = waitState
    await this.wait(t.settleAfterArriveMs)

    this.state = talk1
    bubbles[0]?.show()
    await this.wait(t.bubbleVisibleMs)
    bubbles[0]?.hide()

    await this.wait(t.gapBetweenBubblesMs)

    this.state = talk2
    bubbles[1]?.show()
    await this.wait(t.bubbleVisibleMs)
    bubbles[1]?.hide()

    await this.wait(t.afterTalksBeforeNextMs)
  }

  async runSequence() {
    if (this.running) return
    this.running = true
    const t = SCENE_03.timing
    const sb = SCENE_03.soobin

    try {
      this.state = CAFE_SEQUENCE.GO_LEFT_TABLE
      await this.soobin.movePath(sb.pathToLeft)

      this.soobin.direction = 'up'
      this.soobin.showIdle()

      await this.playTableTalk(
        this.leftBubbles,
        CAFE_SEQUENCE.WAIT_LEFT_TABLE,
        CAFE_SEQUENCE.LEFT_CUSTOMER_1_TALK,
        CAFE_SEQUENCE.LEFT_CUSTOMER_2_TALK,
      )

      this.state = CAFE_SEQUENCE.SOOBIN_SAD
      this.soobin.setEmotion('sad')
      await this.wait(t.afterSadBeforeWalkMs)

      this.state = CAFE_SEQUENCE.GO_RIGHT_TABLE
      await this.soobin.movePath(sb.pathToRight)

      this.soobin.direction = 'right'
      this.soobin.showIdle()

      await this.playTableTalk(
        this.rightBubbles,
        CAFE_SEQUENCE.WAIT_RIGHT_TABLE,
        CAFE_SEQUENCE.RIGHT_CUSTOMER_1_TALK,
        CAFE_SEQUENCE.RIGHT_CUSTOMER_2_TALK,
      )

      this.state = CAFE_SEQUENCE.SOOBIN_CRYING
      this.soobin.setEmotion('cry')
      await this.wait(t.afterCryBeforeYeonjunMs)

      this.state = CAFE_SEQUENCE.YEONJUN_APPEARS
      this.spawnYeonjun()
      await this.wait(t.afterYeonjunVisibleMs)

      // Pause NPC sequence while player reads; cry face stays on Soobin.
      this.state = CAFE_SEQUENCE.STORY_YEONJUN
      await StoryBox.show(this, {
        message: SCENE_03.story.yeonjunReveal,
        buttonLabel: 'TAMAM',
      })

      this.state = CAFE_SEQUENCE.DROP_ITEMS
      this.soobin.setHolding(false)
      await this.wait(t.afterDropBeforeWalkMs)

      this.state = CAFE_SEQUENCE.GO_TO_YEONJUN
      await this.soobin.movePath(sb.pathToYeonjun)

      this.soobin.direction = 'right'
      this.soobin.showIdle()

      // Arrive at Yeonjun → cry face gone → hug PNG → heart → fired → Scene 4
      this.soobin.clearEmotion()
      await this.playHugFinale()
      this.state = CAFE_SEQUENCE.END
    } catch (err) {
      console.error('[CafeScene] sequence error', err)
    }
  }

  /**
   * Same cafe BG. Hide Soobin/Yeonjun sprites, show yeonbin-hug.png (~220px),
   * grow/fill heart above heads, fired StoryBox, then Scene 4.
   */
  async playHugFinale() {
    this.state = CAFE_SEQUENCE.HUG_SCENE
    console.log('[HEART] hug started')

    this.soobin?.clearEmotion()
    this.soobin?.sprite?.setVisible(false)
    this.yeonjun?.setVisible(false)
    for (const b of this.leftBubbles) b.hide()
    for (const b of this.rightBubbles) b.hide()

    this.showHugSprite()
    console.log('[HEART] hug sprite visible', {
      x: this.hugSprite?.x,
      y: this.hugSprite?.y,
      depth: this.hugSprite?.depth,
      visible: this.hugSprite?.visible,
    })

    this.state = CAFE_SEQUENCE.HEART
    const hh = SCENE_03.hugHeart
    const { x: hx, y: hy } = this.getHugHeartPosition()
    console.log('[HEART] creating heart', { hx, hy, hugDepth: this.hugSprite?.depth })

    try {
      this.heartFx = new GrowingHeart(this, hx, hy, {
        durationMs: hh.durationMs ?? 1800,
        startScale: hh.startScale ?? 0.55,
        endScale: hh.endScale ?? 0.85,
      })
      const above = (this.hugSprite?.depth ?? 500) + 2000
      this.heartFx.setDepth(above)
      console.log('[HEART] heart visible:', {
        depth: above,
        pos: { x: hx, y: hy },
        hugDepth: this.hugSprite?.depth,
      })

      await this.heartFx.play()
      await this.wait(hh.holdFullMs ?? 450)
    } catch (err) {
      console.error('[HEART] heart sequence failed', err)
    }

    this.state = CAFE_SEQUENCE.FIRED
    console.log('[HEART] dismissal popup shown')
    await StoryBox.show(this, {
      message: SCENE_03.firedText,
      buttonLabel: 'TAMAM',
    })

    this.state = CAFE_SEQUENCE.TO_SCENE_4
    console.log('[HEART] transitioning to Scene 4')
    this.heartFx?.destroy()
    this.heartFx = null
    this.hugSprite?.destroy()
    this.hugSprite = null
    await fadeToScene(this, SCENE_KEYS.SCENE_4)
  }

  /**
   * Shared head-center above hug PNG (world space).
   * @returns {{ x: number, y: number }}
   */
  getHugHeartPosition() {
    const hugCfg = SCENE_03.hug
    const pad = SCENE_03.hugHeart?.padAboveHeads ?? 40
    const spr = this.hugSprite
    if (spr) {
      const top = spr.y - spr.displayHeight * spr.originY
      // Heads sit near the top of the hug art; place heart just above.
      const x = spr.x
      const y = top - pad
      console.log('[HEART] heart position:', { x, y, top, pad, displayH: spr.displayHeight })
      return { x, y }
    }
    return { x: hugCfg.x, y: hugCfg.y - 260 }
  }

  /** Place user yeonbin-hug.png at meet floor; NEAREST; ~220px visible. */
  showHugSprite() {
    if (this.hugSprite) {
      this.hugSprite.setVisible(true)
      return
    }
    const h = SCENE_03.hug
    if (this.textures.exists(h.textureKey)) {
      this.textures.get(h.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST)
    }
    this.hugSprite = this.add.image(h.x, h.y, h.textureKey)
    this.hugSprite.setOrigin(h.originX ?? 0.5, h.originY ?? 0.96)
    this.hugSprite.setScale(h.scale)
    this.hugSprite.setDepth(20 + h.y)
  }

  spawnYeonjun() {
    if (this.yeonjun) return
    const yj = SCENE_03.yeonjun
    this.yeonjun = this.add.sprite(yj.x, yj.y, yj.textureKey)
    this.yeonjun.setOrigin(0.5, yj.originY ?? 0.96)
    this.yeonjun.setScale(yj.scale)
    this.yeonjun.setDepth(20 + yj.y)
    this.yeonjun.setAlpha(0)
    this.tweens.add({
      targets: this.yeonjun,
      alpha: 1,
      duration: 180,
    })
  }

  /**
   * @param {number} _time
   * @param {number} delta
   */
  update(_time, delta) {
    this.soobin?.update(delta)
  }

  shutdownScene() {
    this.heartFx?.destroy()
    this.heartFx = null
    for (const b of this.leftBubbles) b.destroy()
    for (const b of this.rightBubbles) b.destroy()
    this.leftBubbles = []
    this.rightBubbles = []
    this.soobin?.destroy()
    this.soobin = null
    this.sudeSprite?.destroy()
    this.sudeSprite = null
    this.yeonjun?.destroy()
    this.yeonjun = null
    this.hugSprite?.destroy()
    this.hugSprite = null
    this.cafeBg = null
    if (typeof window !== 'undefined' && window.__SUDE_CAFE__ === this) {
      window.__SUDE_CAFE__ = null
    }
  }
}
