import { isChestPassphrase } from '../data/chestPass'

/**
 * DOM passphrase prompt (boot gate or Scene 7 chest).
 */
export class ChestLock {
  /**
   * @param {Phaser.Scene} scene
   * @param {{
   *   onUnlock?: () => void,
   *   onClose?: () => void,
   *   check?: (input: string) => Promise<boolean>,
   *   title?: string,
   *   hint?: string,
   *   ariaLabel?: string,
   *   allowCancel?: boolean,
   * }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene
    this.onUnlock = options.onUnlock
    this.onClose = options.onClose
    this.check = options.check ?? isChestPassphrase
    this.allowCancel = options.allowCancel !== false
    this.el = null
    this.busy = false

    const parent =
      scene.game?.canvas?.parentElement ?? document.getElementById('phaser-frame')
    if (!parent || typeof document === 'undefined') return

    const el = document.createElement('div')
    el.className = 'sude-letter-board'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', options.ariaLabel ?? 'Sandık şifresi')

    const paper = document.createElement('div')
    paper.className = 'sude-letter-board__paper sude-chest-lock'

    const heading = document.createElement('div')
    heading.className = 'sude-letter-board__heading'
    heading.textContent = options.title ?? '♡ SANDIK KİLİTLİ ♡'
    paper.appendChild(heading)

    const hint = document.createElement('p')
    hint.className = 'sude-chest-lock__hint'
    hint.textContent = options.hint ?? 'Mektupları okumak için şifreyi yaz.'
    paper.appendChild(hint)

    const form = document.createElement('form')
    form.className = 'sude-chest-lock__form'
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      void this.submit()
    })

    this.input = document.createElement('input')
    this.input.type = 'password'
    this.input.autocomplete = 'off'
    this.input.spellcheck = false
    this.input.className = 'sude-chest-lock__input'
    this.input.placeholder = 'şifre'
    form.appendChild(this.input)

    this.error = document.createElement('p')
    this.error.className = 'sude-letter-page__error'
    this.error.hidden = true
    form.appendChild(this.error)

    const actions = document.createElement('div')
    actions.className = 'sude-letter-page__actions'

    const unlockBtn = document.createElement('button')
    unlockBtn.type = 'submit'
    unlockBtn.className = 'sude-letter-page__btn sude-letter-page__btn--save'
    unlockBtn.textContent = 'AÇ'
    actions.appendChild(unlockBtn)

    if (this.allowCancel) {
      const cancelBtn = document.createElement('button')
      cancelBtn.type = 'button'
      cancelBtn.className = 'sude-letter-board__close'
      cancelBtn.textContent = 'KAPAT'
      cancelBtn.addEventListener('click', () => this.close())
      actions.appendChild(cancelBtn)
    }

    form.appendChild(actions)
    paper.appendChild(form)
    el.appendChild(paper)
    parent.appendChild(el)

    this.el = el
    requestAnimationFrame(() => {
      el.classList.add('sude-letter-board--visible')
      this.input?.focus()
    })
  }

  async submit() {
    if (this.busy) return
    this.busy = true
    this.error.hidden = true
    const ok = await this.check(this.input?.value ?? '')
    this.busy = false
    if (!ok) {
      this.error.hidden = false
      this.error.textContent = 'şifre yanlış'
      this.input.value = ''
      this.input.focus()
      return
    }
    this.unlock()
  }

  unlock() {
    this.el?.classList.remove('sude-letter-board--visible')
    this.destroy()
    this.onUnlock?.()
  }

  close() {
    this.el?.classList.remove('sude-letter-board--visible')
    this.destroy()
    this.onClose?.()
  }

  destroy() {
    this.el?.remove()
    this.el = null
    this.input = null
    this.error = null
  }
}
