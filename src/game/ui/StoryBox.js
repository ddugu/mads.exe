import { mountDialogueDomText } from './dialogueDomText'
import { DIALOGUE_FONT, smoothDialogueText, uiTextResolution } from './uiFont'

/**
 * Colorful story / narration box — Phaser chrome, DOM body text (clean AA).
 * Button label stays Phaser (same coords as button) so it cannot drift.
 */
export class StoryBox {
  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   message: string,
   *   buttonLabel?: string,
   * }} options
   * @returns {Promise<void>}
   */
  static show(scene, options) {
    return new Promise((resolve) => {
      const box = new StoryBox(scene, {
        ...options,
        onConfirm: () => resolve(),
      })
      return box
    })
  }

  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   message: string,
   *   buttonLabel?: string,
   *   onConfirm: () => void,
   * }} options
   */
  constructor(scene, options) {
    this.scene = scene
    this.onConfirm = options.onConfirm
    this.closed = false
    this.domMessage = null
    this.decor = []

    const { width, height } = scene.scale.gameSize
    const panelW = Math.min(780, Math.floor(width * 0.88))
    const panelH = Math.min(360, Math.floor(height * 0.48))
    const cx = width / 2
    const cy = height * 0.62
    const resolution = uiTextResolution(scene)

    this.root = scene.add.container(cx, cy)
    this.root.setDepth(30000)
    this.root.setScrollFactor(0)

    const dim = scene.add
      .rectangle(0, -cy + height / 2, width * 2, height * 2, 0x1a1020, 0.35)
      .setInteractive()

    const panel = scene.add
      .rectangle(0, 0, panelW, panelH, 0xfff6e8, 1)
      .setStrokeStyle(4, 0xc45c7a, 1)

    const inner = scene.add
      .rectangle(0, 0, panelW - 14, panelH - 14, 0xfffaf2, 1)
      .setStrokeStyle(2, 0xf0c4a8, 1)

    const accent = scene.add
      .rectangle(0, -panelH / 2 + 10, panelW - 28, 6, 0xffb4c8, 1)

    const btnW = 168
    const btnH = 46
    const btnY = panelH / 2 - 42

    const btnBg = scene.add
      .rectangle(0, btnY, btnW, btnH, 0xff7a9a, 1)
      .setStrokeStyle(3, 0x8a3048, 1)
      .setInteractive({ useHandCursor: true })

    const btnLabel = scene.add
      .text(0, btnY, options.buttonLabel ?? 'TAMAM', {
        fontFamily: DIALOGUE_FONT,
        fontSize: '16px',
        color: '#ffffff',
        resolution,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    smoothDialogueText(btnLabel)

    this.addHearts(panelW, panelH)
    this.addSparkles(panelW, panelH)

    const confirm = () => {
      if (this.closed) return
      this.closed = true
      btnBg.disableInteractive()
      btnLabel.disableInteractive()
      if (this._fallbackPointer) {
        this.scene.input.off('pointerdown', this._fallbackPointer)
        this._fallbackPointer = null
      }
      this.scene.tweens.killTweensOf(this.decor)
      this.onConfirm?.()
      this.destroy()
    }

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xff94ae, 1))
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xff7a9a, 1))
    btnBg.on('pointerdown', confirm)
    btnLabel.on('pointerdown', confirm)

    this._fallbackPointer = (pointer) => {
      if (this.closed) return
      const bx = cx
      const by = cy + btnY
      if (
        Math.abs(pointer.x - bx) <= btnW / 2 + 8 &&
        Math.abs(pointer.y - by) <= btnH / 2 + 8
      ) {
        confirm()
      }
    }
    scene.input.on('pointerdown', this._fallbackPointer)

    const textPadX = 40
    const textTop = cy - panelH / 2 + 32
    const textH = panelH - 32 - (panelH / 2 - btnY) - btnH / 2 - 18
    const fontSize = panelW < 520 ? 17 : panelW < 680 ? 18 : 19

    this.domMessage = mountDialogueDomText(scene, {
      text: options.message,
      color: '#3a2a32',
      fontSize,
      gameX: cx - (panelW - textPadX * 2) / 2,
      gameY: textTop,
      gameW: panelW - textPadX * 2,
      gameH: Math.max(48, textH),
      className: 'sude-dialogue-text',
    })

    this.root.add([dim, panel, inner, accent, btnBg, btnLabel, ...this.decor])
    this.root.bringToTop(btnBg)
    this.root.bringToTop(btnLabel)

    this.root.setAlpha(0)
    scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 220,
      ease: 'Quad.easeOut',
    })
  }

  /**
   * @param {number} panelW
   * @param {number} panelH
   */
  addHearts(panelW, panelH) {
    const spots = [
      { x: -panelW / 2 + 28, y: -panelH / 2 + 28 },
      { x: panelW / 2 - 28, y: -panelH / 2 + 32 },
      { x: -panelW / 2 + 36, y: panelH / 2 - 56 },
      { x: panelW / 2 - 36, y: panelH / 2 - 52 },
    ]
    for (const s of spots) {
      const heart = this.scene.add
        .text(s.x, s.y, '♥', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          color: '#ff7a9a',
        })
        .setOrigin(0.5)
        .setAlpha(0.85)
      this.decor.push(heart)
      this.scene.tweens.add({
        targets: heart,
        y: s.y - 5,
        alpha: 0.55,
        duration: 900 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  /**
   * @param {number} panelW
   * @param {number} panelH
   */
  addSparkles(panelW, panelH) {
    const spots = [
      { x: -panelW / 2 + 70, y: -panelH / 2 + 18 },
      { x: panelW / 2 - 70, y: -panelH / 2 + 22 },
      { x: 0, y: -panelH / 2 + 16 },
      { x: -panelW / 2 + 22, y: 0 },
      { x: panelW / 2 - 22, y: 8 },
    ]
    for (const s of spots) {
      const spark = this.scene.add
        .text(s.x, s.y, '✦', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#f0c050',
        })
        .setOrigin(0.5)
        .setAlpha(0.7)
      this.decor.push(spark)
      this.scene.tweens.add({
        targets: spark,
        alpha: 0.25,
        scale: 0.7,
        duration: 700 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }
  }

  destroy() {
    if (this._fallbackPointer && this.scene) {
      this.scene.input.off('pointerdown', this._fallbackPointer)
      this._fallbackPointer = null
    }
    this.domMessage?.destroy()
    this.domMessage = null
    this.root?.destroy(true)
    this.root = null
    this.decor = []
  }
}
