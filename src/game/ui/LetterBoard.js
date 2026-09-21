import { SCENE_07_LETTERS } from '../data/scene07'
import { getLetter } from '../data/letterStore'

const FRAME_DECO = [
  '<span class="sude-px sude-px--heart sude-px--tl"></span>',
  '<span class="sude-px sude-px--star sude-px--tr"></span>',
  '<span class="sude-px sude-px--star sude-px--bl"></span>',
  '<span class="sude-px sude-px--heart sude-px--br"></span>',
  '<span class="sude-px sude-px--heart sude-px--ml"></span>',
  '<span class="sude-px sude-px--heart sude-px--mr"></span>',
  '<span class="sude-px sude-px--star sude-px--mt"></span>',
  '<span class="sude-px sude-px--star sude-px--mb"></span>',
  '<span class="sude-px sude-px--dot sude-px--t1"></span>',
  '<span class="sude-px sude-px--dot sude-px--t2"></span>',
  '<span class="sude-px sude-px--spark sude-px--s1"></span>',
  '<span class="sude-px sude-px--spark sude-px--s2"></span>',
  '<span class="sude-px sude-px--spark sude-px--s3"></span>',
  '<span class="sude-px sude-px--spark sude-px--s4"></span>',
].join('')

/**
 * Letter list + read-only letter pages.
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
    /** @type {'list' | 'page'} */
    this.view = 'list'
    /** @type {string | null} */
    this.activeId = null

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

  addDeco(target) {
    const deco = document.createElement('div')
    deco.className = 'sude-letter-page__deco'
    deco.setAttribute('aria-hidden', 'true')
    deco.innerHTML = FRAME_DECO
    target.appendChild(deco)
  }

  render() {
    if (!this.paper) return
    this.paper.replaceChildren()
    if (this.view === 'page') this.renderPage()
    else this.renderList()
  }

  renderList() {
    this.paper.classList.remove('sude-letter-board__paper--page')
    this.addDeco(this.paper)

    const heading = document.createElement('div')
    heading.className = 'sude-letter-board__heading'
    heading.textContent = '♡ MEKTUPLAR ♡'
    this.paper.appendChild(heading)

    for (const letter of SCENE_07_LETTERS) {
      const row = document.createElement('button')
      row.type = 'button'
      row.className = 'sude-letter-board__row'
      row.textContent = `★ ${letter.title}`
      row.addEventListener('click', () => {
        this.activeId = letter.id
        this.view = 'page'
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

    const rec = getLetter(letter.id)
    this.paper.classList.add('sude-letter-board__paper--page')

    const page = document.createElement('div')
    page.className = 'sude-letter-page'
    this.addDeco(page)

    const title = document.createElement('div')
    title.className = 'sude-letter-page__title'
    title.textContent = `♡ ${letter.title} ♡`
    page.appendChild(title)

    const bodyEl = document.createElement('div')
    bodyEl.className = 'sude-letter-page__body'
    if (rec.body.trim()) {
      bodyEl.textContent = rec.body
    } else {
      bodyEl.classList.add('is-empty')
      bodyEl.textContent = rec.image ? ' ' : 'bu mektup henüz boş'
    }
    page.appendChild(bodyEl)

    if (rec.image) {
      const wrap = document.createElement('div')
      wrap.className = 'sude-letter-page__photo'
      const img = document.createElement('img')
      img.src = rec.image
      img.alt = letter.title
      wrap.appendChild(img)
      page.appendChild(wrap)
    }

    const back = this.makeBtn('GERİ', 'sude-letter-board__close', () => {
      this.paper.classList.remove('sude-letter-board__paper--page')
      this.activeId = null
      this.view = 'list'
      this.render()
    })
    page.appendChild(back)

    this.paper.appendChild(page)
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
