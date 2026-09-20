import { mountDialogueDomText } from './dialogueDomText'
import { DIALOGUE_FONT, smoothDialogueText, uiTextResolution } from './uiFont'

/**
 * Story / tutorial modal — Phaser chrome, DOM body text (clean AA).
 * Button label is Phaser text on the button so it stays centered.
 */
export class PixelPopup {
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

    const { width, height } = scene.scale.gameSize
    const panelW = Math.min(720, width * 0.82)
    const panelH = Math.min(320, height * 0.42)
    const cx = width / 2
    const cy = height / 2
    const resolution = uiTextResolution(scene)

    this.root = scene.add.container(cx, cy)
    this.root.setDepth(20000)
    this.root.setScrollFactor(0)

    const dim = scene.add
      .rectangle(0, 0, width * 2, height * 2, 0x000000, 0.55)
      .setInteractive()

    const panel = scene.add
      .rectangle(0, 0, panelW, panelH, 0x1a1a1a, 1)
      .setStrokeStyle(3, 0xc8c8c8, 1)

    const inner = scene.add
      .rectangle(0, 0, panelW - 10, panelH - 10, 0x0c0c0c, 1)
      .setStrokeStyle(2, 0x555555, 1)

    const btnW = 160
    const btnH = 44
    const btnY = panelH / 2 - 48

    const btnBg = scene.add
      .rectangle(0, btnY, btnW, btnH, 0x2a2a2a, 1)
      .setStrokeStyle(2, 0xffffff, 1)
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

    const confirm = () => {
      if (this.closed) return
      this.closed = true
      btnBg.disableInteractive()
      btnLabel.disableInteractive()
      this.onConfirm?.()
      this.destroy()
    }

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a3a3a, 1))
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2a2a2a, 1))
    btnBg.on('pointerdown', confirm)
    btnLabel.on('pointerdown', confirm)

    const textPadX = 36
    const textTop = cy - panelH / 2 + 28
    const textH = panelH - 28 - (panelH / 2 - btnY) - btnH / 2 - 16
    const fontSize = panelW < 480 ? 17 : 19

    this.domMessage = mountDialogueDomText(scene, {
      text: options.message,
      color: '#f2f2f2',
      fontSize,
      gameX: cx - (panelW - textPadX * 2) / 2,
      gameY: textTop,
      gameW: panelW - textPadX * 2,
      gameH: Math.max(48, textH),
      className: 'sude-dialogue-text',
    })

    this.root.add([dim, panel, inner, btnBg, btnLabel])
    this.root.bringToTop(btnBg)
    this.root.bringToTop(btnLabel)

    this.root.setAlpha(0)
    scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 180,
    })
  }

  destroy() {
    this.domMessage?.destroy()
    this.domMessage = null
    this.root?.destroy(true)
    this.root = null
  }
}
