import Phaser from 'phaser'
import { SCENE_KEYS } from '../data/scene01'
import { FadeTransition } from '../systems/FadeTransition'
import { applyFullscreenViewportCamera } from '../systems/GameViewport'
import { preloadGameMusic } from '../systems/gameMusic'
import { isBootPassphrase } from '../data/chestPass'
import { ChestLock } from '../ui/ChestLock'
import { UI_FONT } from '../ui/uiFont'

const BOOT_STEPS = [
  { text: 'gerekli programlar denetleniyor...', delayAfter: 1400, typing: true },
  { text: 'sude.exe bulundu', delayAfter: 1100, typing: true },
  { text: 'oyun yükleniyor...', delayAfter: 1200, typing: true },
]

/**
 * Retro terminal-style boot / intro before Scene 1.
 * No character sprites here.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT)
    this.phase = 'idle'
    this.lineText = null
    this.promptHint = null
    this.clickArmed = false
  }

  preload() {
    preloadGameMusic(this)
    this.load.on('loaderror', (file) => {
      console.error('[BootScene] Asset load failed:', file?.key, file?.url)
    })
  }

  create() {
    const { width, height } = this.scale.gameSize

    applyFullscreenViewportCamera(this)

    this.add
      .text(24, 20, 'yeonjun.exe', {
        fontFamily: UI_FONT,
        fontSize: '18px',
        color: '#5a5a5a',
      })
      .setOrigin(0, 0)

    this.lineText = this.add
      .text(width / 2, height / 2 - 20, '', {
        fontFamily: UI_FONT,
        fontSize: '28px',
        color: '#d0d0d0',
        align: 'center',
        wordWrap: { width: width * 0.85 },
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.promptHint = this.add
      .text(width / 2, height / 2 + 48, '[ click ]', {
        fontFamily: UI_FONT,
        fontSize: '16px',
        color: '#6e6e6e',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.cursorBlink = this.add
      .text(width / 2, height / 2 + 90, '_', {
        fontFamily: UI_FONT,
        fontSize: '22px',
        color: '#8a8a8a',
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.tweens.add({
      targets: this.cursorBlink,
      alpha: { from: 0.15, to: 0.9 },
      duration: 550,
      yoyo: true,
      repeat: -1,
    })

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bootLock?.destroy()
      this.bootLock = null
    })

    this.showClickPrompt()
  }

  async showClickPrompt() {
    this.phase = 'await-click'
    const message = "yeonjun.exe'yi çalıştırmak için tıkla"

    await this.fadeInText(this.lineText)
    await this.typeText(this.lineText, message, 28)

    this.promptHint.setAlpha(0)
    this.tweens.add({
      targets: this.promptHint,
      alpha: 1,
      duration: 400,
    })
    this.cursorBlink.setAlpha(0.6)

    this.clickArmed = true
    this.input.once('pointerdown', () => {
      if (!this.clickArmed) return
      this.clickArmed = false
      this.sound?.unlock()
      void this.runBootSequence()
    })
  }

  async runBootSequence() {
    this.phase = 'scanning'
    this.promptHint.setAlpha(0)
    this.cursorBlink.setAlpha(0)

    await this.fadeOutText(this.lineText)

    for (const step of BOOT_STEPS) {
      this.lineText.setText('')
      await this.fadeInText(this.lineText)
      if (step.typing) {
        await this.typeText(this.lineText, step.text, 22)
      } else {
        this.lineText.setText(step.text)
      }
      await this.wait(step.delayAfter)
      await this.fadeOutText(this.lineText)
    }

    await this.askBootPassphrase()

    const fade = new FadeTransition(this)
    await fade.fadeOut(650)
    this.scene.start(SCENE_KEYS.SCENE_1)
  }

  askBootPassphrase() {
    this.phase = 'locked'
    this.lineText.setText('şifre gerekli')
    this.lineText.setAlpha(1)
    return new Promise((resolve) => {
      this.bootLock = new ChestLock(this, {
        allowCancel: false,
        check: isBootPassphrase,
        title: '♡ SUDE.EXE KİLİTLİ ♡',
        hint: 'Oyunu başlatmak için şifreyi yaz.',
        ariaLabel: 'Oyun şifresi',
        onUnlock: () => {
          this.bootLock = null
          resolve()
        },
      })
    })
  }

  /**
   * @param {Phaser.GameObjects.Text} target
   * @param {string} full
   * @param {number} msPerChar
   */
  typeText(target, full, msPerChar = 24) {
    return new Promise((resolve) => {
      let i = 0
      target.setText('')
      const timer = this.time.addEvent({
        delay: msPerChar,
        repeat: Math.max(full.length - 1, 0),
        callback: () => {
          i += 1
          target.setText(full.slice(0, i))
          if (i >= full.length) {
            resolve()
          }
        },
      })
      if (full.length === 0) {
        timer.remove(false)
        resolve()
      }
    })
  }

  fadeInText(target, duration = 350) {
    target.setAlpha(0)
    return new Promise((resolve) => {
      this.tweens.add({
        targets: target,
        alpha: 1,
        duration,
        onComplete: () => resolve(),
      })
    })
  }

  fadeOutText(target, duration = 280) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: target,
        alpha: 0,
        duration,
        onComplete: () => resolve(),
      })
    })
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, () => resolve())
    })
  }
}
