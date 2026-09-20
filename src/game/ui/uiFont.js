import Phaser from 'phaser'

/** Boot / terminal lines — keep retro mono. */
export const UI_FONT = '"Share Tech Mono", "Courier New", monospace'

/** Dialogue / story / tutorial boxes — clean, thin, elegant. */
export const DIALOGUE_FONT = 'Arial, Helvetica, sans-serif'

/**
 * @param {Phaser.Scene} scene
 */
export function uiTextResolution(scene) {
  const sx = scene.scale?.displayScale?.x ?? 1
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.min(2, Math.max(1, sx * Math.min(dpr, 2)))
}

/**
 * Soft antialiased text for elegant dialogue fonts.
 * @param {Phaser.GameObjects.Text} text
 */
export function smoothDialogueText(text) {
  try {
    text?.setScale(1)
    text?.texture?.setFilter?.(Phaser.Textures.FilterMode.LINEAR)
  } catch {
    // ignore
  }
}
