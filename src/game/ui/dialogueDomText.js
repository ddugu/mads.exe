/**
 * Dialogue body/button labels as HTML overlay.
 *
 * Why: Phaser canvas uses pixelArt + CSS image-rendering:pixelated, so even
 * Arial drawn via Phaser.Text looks crunchy. DOM text is real browser AA.
 *
 * Box / border / hearts / button hit-areas stay in Phaser.
 */

/**
 * @param {Phaser.Scene} scene
 * @param {{
 *   text: string,
 *   color: string,
 *   fontSize: number,
 *   gameX: number,
 *   gameY: number,
 *   gameW: number,
 *   gameH: number,
 *   fontWeight?: string,
 *   className?: string,
 *   follow?: Phaser.GameObjects.GameObject,
 * }} opts
 */
export function mountDialogueDomText(scene, opts) {
  const canvas = scene.game?.canvas
  const parent = canvas?.parentElement
  if (!parent || typeof document === 'undefined') {
    return { sync() {}, destroy() {}, el: null }
  }

  const el = document.createElement('div')
  el.className = opts.className ?? 'sude-dialogue-text'
  el.setAttribute('aria-live', 'polite')
  el.style.color = opts.color
  el.style.fontWeight = opts.fontWeight ?? '400'

  const inner = document.createElement('span')
  inner.className = 'sude-dialogue-text__inner'
  inner.textContent = opts.text
  el.appendChild(inner)
  parent.appendChild(el)

  const sync = () => {
    if (!el.isConnected || !canvas?.isConnected) return
    const gw = scene.scale.gameSize.width
    const gh = scene.scale.gameSize.height
    const parentRect = parent.getBoundingClientRect()
    const canvasRect = canvas.getBoundingClientRect()
    const sx = canvasRect.width / gw
    const sy = canvasRect.height / gh

    let left
    let top
    let width
    let height

    if (opts.follow && opts.follow.active !== false && opts.follow.getBounds) {
      // Map Phaser display bounds → CSS inside #phaser-frame via canvas quad.
      const b = opts.follow.getBounds()
      const cam = scene.cameras.main
      // getBounds is world-space; convert corners through camera → canvas CSS.
      const tl = worldToCanvasCss(cam, canvasRect, parentRect, b.x, b.y)
      const br = worldToCanvasCss(
        cam,
        canvasRect,
        parentRect,
        b.right ?? b.x + b.width,
        b.bottom ?? b.y + b.height,
      )
      left = Math.min(tl.x, br.x)
      top = Math.min(tl.y, br.y)
      width = Math.abs(br.x - tl.x)
      height = Math.abs(br.y - tl.y)
    } else {
      left = canvasRect.left - parentRect.left + opts.gameX * sx
      top = canvasRect.top - parentRect.top + opts.gameY * sy
      width = opts.gameW * sx
      height = opts.gameH * sy
    }

    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.width = `${Math.max(1, width)}px`
    el.style.height = `${Math.max(1, height)}px`

    // Keep label inside the button/box — never taller than ~55% of the rect.
    const base = opts.fontSize * sx
    const capped = height > 0 ? Math.min(base, height * 0.55) : base
    el.style.fontSize = `${capped}px`
  }

  const onResize = () => sync()
  window.addEventListener('resize', onResize)
  scene.scale?.on?.('resize', onResize)
  scene.events?.once?.('postupdate', sync)
  requestAnimationFrame(() => {
    sync()
    el.classList.add('sude-dialogue-text--visible')
  })

  const timer = scene.time?.addEvent?.({
    delay: 100,
    loop: true,
    callback: sync,
  })

  return {
    el,
    sync,
    destroy() {
      window.removeEventListener('resize', onResize)
      scene.scale?.off?.('resize', onResize)
      timer?.remove?.(false)
      el.remove()
    },
  }
}

/**
 * World point → CSS px relative to #phaser-frame.
 * @param {Phaser.Cameras.Scene2D.Camera} cam
 * @param {DOMRect} canvasRect
 * @param {DOMRect} parentRect
 * @param {number} wx
 * @param {number} wy
 */
function worldToCanvasCss(cam, canvasRect, parentRect, wx, wy) {
  // Camera viewport pixels (logical game view)
  const vx = (wx - cam.worldView.x) / cam.worldView.width * cam.width
  const vy = (wy - cam.worldView.y) / cam.worldView.height * cam.height
  const x = canvasRect.left - parentRect.left + (vx / cam.width) * canvasRect.width
  const y = canvasRect.top - parentRect.top + (vy / cam.height) * canvasRect.height
  return { x, y }
}
