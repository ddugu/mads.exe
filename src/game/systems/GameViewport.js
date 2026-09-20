import { SCENE_01 } from '../data/scene01'

/** Fixed logical game viewport — every scene uses this size. */
export const VIEWPORT_WIDTH = SCENE_01.width
export const VIEWPORT_HEIGHT = SCENE_01.height

/**
 * Browser frame: fill width first; keep a thin top/bottom star letterbox.
 * Only shrinks width if the frame would exceed the available height.
 */
export const FRAME_MAX_WIDTH_RATIO = 0.998
/** Minimum total vertical letterbox (top+bottom) as a fraction of window height. */
export const FRAME_MIN_VERTICAL_LETTERBOX = 0.06

/**
 * Size `#phaser-frame` so it matches the game aspect and sits centered
 * with top/bottom (and minimal side) letterbox for the star field.
 */
export function layoutGameFrame(frameEl, parentEl = frameEl?.parentElement) {
  if (!frameEl || !parentEl) return

  const parentW = parentEl.clientWidth || window.innerWidth
  const parentH = parentEl.clientHeight || window.innerHeight
  const gw = VIEWPORT_WIDTH
  const gh = VIEWPORT_HEIGHT

  // Prefer filling width…
  let scale = (parentW * FRAME_MAX_WIDTH_RATIO) / gw
  // …but keep a guaranteed top/bottom band for sparkles.
  const maxH = parentH * (1 - FRAME_MIN_VERTICAL_LETTERBOX)
  if (gh * scale > maxH) {
    scale = maxH / gh
  }

  const w = Math.max(1, Math.floor(gw * scale))
  const h = Math.max(1, Math.floor(gh * scale))

  frameEl.style.width = `${w}px`
  frameEl.style.height = `${h}px`
}

/**
 * Lock camera so `contentHeight` fills the shared viewport height
 * (uniform zoom — no stretch). Used by horizontal-scroll worlds.
 *
 * @param {Phaser.Scene} scene
 * @param {number} worldWidth
 * @param {number} contentHeight native background height in world px
 * @returns {number} zoom applied
 */
export function applySharedViewportCamera(scene, worldWidth, contentHeight) {
  const cam = scene.cameras.main
  const height = Math.max(1, contentHeight)
  const zoom = VIEWPORT_HEIGHT / height

  cam.setBackgroundColor('#000000')
  cam.setBounds(0, 0, worldWidth, height)
  cam.setZoom(zoom)
  cam.setScroll(0, 0)

  return zoom
}

/**
 * Full-viewport camera for Boot / Scene1 / Scene3 (1:1 with logical size).
 * @param {Phaser.Scene} scene
 */
export function applyFullscreenViewportCamera(scene) {
  const cam = scene.cameras.main
  cam.setBackgroundColor('#000000')
  cam.setBounds(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
  cam.setZoom(1)
  cam.setScroll(0, 0)
}
