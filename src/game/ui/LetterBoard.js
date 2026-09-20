import { SCENE_07_LETTERS } from '../data/scene07'
import {
  getLetterBody,
  setLetterBody,
  clearLetterBody,
} from '../data/letterStore'

/**
 * Paper letter list + per-letter pages (EKLE / DÜZENLE / SİL).
 */
export class LetterBoard {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ onClose?: () => void }} [options]
   */
  constructor(scene, options = {}) {
    this.scene = scene
    this.onClose = options.onClose
    this.el = null
    this.paper = null
    /** @type {'list' | 'page' | 'edit'} */
    this.view = 'list'
    /** @type {string | null} */
    this.activeId = null
    this.confirmingDelete = false

    const parent =
      scene.game?.canvas?.parentElement ?? document.getElementById('phaser-frame')
    if (!parent || typeof document === 'undefined') return

    const el = document.createElement('div')
    el.className = 'sude-letter-board'
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-label', 'Mektuplar')

    const paper = document.createElement('div')
    paper.className = 'sude-letter-board__paper'
    el.appendChild(paper)
    parent.appendChild(el)

    this.el = el
    this.paper = paper
    this.render()
    requestAnimationFrame(() => el.classList.add('sude-letter-board--visible'))
  }

  render() {
    if (!this.paper) return
    this.paper.replaceChildren()
    if (this.view === 'page') this.renderPage()
    else if (this.view === 'edit') this.renderEdit()
    else this.renderList()
  }

  renderList() {
    this.paper.classList.remove('sude-letter-board__paper--page')
    const heading = document.createElement('div')
    heading.className = 'sude-letter-board__heading'
    heading.textContent = 'MEKTUPLAR'
    this.paper.appendChild(heading)

    for (const letter of SCENE_07_LETTERS) {
      const row = document.createElement('button')
      row.type = 'button'
      row.className = 'sude-letter-board__row'
      row.textContent = letter.title
      row.addEventListener('click', () => {
        this.activeId = letter.id
        this.view = 'page'
        this.confirmingDelete = false
        this.render()
      })
      this.paper.appendChild(row)
    }

    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'sude-letter-board__close'
    closeBtn.textContent = 'KAPAT'
    closeBtn.addEventListener('click', () => this.close())
    this.paper.appendChild(closeBtn)
  }

  currentLetter() {
    return SCENE_07_LETTERS.find((l) => l.id === this.activeId) ?? null
  }

  renderPage() {
    const letter = this.currentLetter()
    if (!letter) {
      this.view = 'list'
      this.render()
      return
    }

    const body = getLetterBody(letter.id)
    this.paper.classList.add('sude-letter-board__paper--page')

    const page = document.createElement('div')
    page.className = 'sude-letter-page'

    const deco = document.createElement('div')
    deco.className = 'sude-letter-page__deco'
    deco.setAttribute('aria-hidden', 'true')
    deco.innerHTML =
      '<span class="sude-px sude-px--heart sude-px--tl"></span>' +
      '<span class="sude-px sude-px--star sude-px--tr"></span>' +
      '<span class="sude-px sude-px--star sude-px--bl"></span>' +
      '<span class="sude-px sude-px--heart sude-px--br"></span>' +
      '<span class="sude-px sude-px--dot sude-px--mt"></span>' +
      '<span class="sude-px sude-px--dot sude-px--mb"></span>'
    page.appendChild(deco)

    const title = document.createElement('div')
    title.className = 'sude-letter-page__title'
    title.textContent = letter.title
    page.appendChild(title)

    const bodyEl = document.createElement('div')
    bodyEl.className = 'sude-letter-page__body'
    if (body.trim()) {
      bodyEl.textContent = body
    } else {
      bodyEl.classList.add('is-empty')
      bodyEl.textContent = 'bu mektup henüz boş'
    }
    page.appendChild(bodyEl)

    const actions = document.createElement('div')
    actions.className = 'sude-letter-page__actions'

    const addBtn = this.makeBtn('EKLE', 'sude-letter-page__btn', () => {
      this.view = 'edit'
      this.confirmingDelete = false
      this.render()
    })
    const editBtn = this.makeBtn('DÜZENLE', 'sude-letter-page__btn', () => {
      this.view = 'edit'
      this.confirmingDelete = false
      this.render()
    })
    const delBtn = this.makeBtn('SİL', 'sude-letter-page__btn sude-letter-page__btn--danger', () => {
      this.confirmingDelete = true
      this.render()
    })
    actions.append(addBtn, editBtn, delBtn)
    page.appendChild(actions)

    if (this.confirmingDelete) {
      const confirm = document.createElement('div')
      confirm.className = 'sude-letter-page__confirm'
      const msg = document.createElement('p')
      msg.textContent = 'Bu mektubun yazısı silinsin mi?'
      const row = document.createElement('div')
      row.className = 'sude-letter-page__actions'
      row.append(
        this.makeBtn('EVET, SİL', 'sude-letter-page__btn sude-letter-page__btn--danger', () => {
          clearLetterBody(letter.id)
          this.confirmingDelete = false
          this.view = 'page'
          this.render()
        }),
        this.makeBtn('VAZGEÇ', 'sude-letter-page__btn', () => {
          this.confirmingDelete = false
          this.render()
        }),
      )
      confirm.append(msg, row)
      page.appendChild(confirm)
    }

    const back = this.makeBtn('GERİ', 'sude-letter-board__close', () => {
      this.paper.classList.remove('sude-letter-board__paper--page')
      this.activeId = null
      this.view = 'list'
      this.confirmingDelete = false
      this.render()
    })
    page.appendChild(back)

    this.paper.appendChild(page)
  }

  renderEdit() {
    const letter = this.currentLetter()
    if (!letter) {
      this.view = 'list'
      this.render()
      return
    }

    this.paper.classList.add('sude-letter-board__paper--page')

    const page = document.createElement('div')
    page.className = 'sude-letter-page'

    const title = document.createElement('div')
    title.className = 'sude-letter-page__title'
    title.textContent = letter.title
    page.appendChild(title)

    const area = document.createElement('textarea')
    area.className = 'sude-letter-page__input'
    area.value = getLetterBody(letter.id)
    area.setAttribute('aria-label', letter.title)
    area.spellcheck = false
    page.appendChild(area)

    const actions = document.createElement('div')
    actions.className = 'sude-letter-page__actions'
    actions.append(
      this.makeBtn('KAYDET', 'sude-letter-page__btn sude-letter-page__btn--save', () => {
        setLetterBody(letter.id, area.value)
        this.view = 'page'
        this.render()
      }),
      this.makeBtn('VAZGEÇ', 'sude-letter-page__btn', () => {
        this.view = 'page'
        this.render()
      }),
    )
    page.appendChild(actions)
    this.paper.appendChild(page)

    requestAnimationFrame(() => area.focus())
  }

  /**
   * @param {string} label
   * @param {string} className
   * @param {() => void} onClick
   */
  makeBtn(label, className, onClick) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = className
    btn.textContent = label
    btn.addEventListener('click', onClick)
    return btn
  }

  close() {
    this.el?.classList.remove('sude-letter-board--visible')
    this.destroy()
    this.onClose?.()
  }

  destroy() {
    this.el?.remove()
    this.el = null
    this.paper = null
  }
}
