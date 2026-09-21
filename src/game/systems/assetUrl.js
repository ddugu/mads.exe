/**
 * Prefix public asset paths with Vite BASE_URL so GitHub Pages
 * (`/mads.exe/`) and local (`/`) both resolve correctly.
 *
 * @param {string} path relative path like `assets/foo.png` or `/assets/foo.png`
 * @returns {string}
 */
export function assetUrl(path) {
  const clean = String(path ?? '').replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${encodeURI(clean)}`
}

/**
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {string} path
 */
export function loadGameImage(scene, key, path) {
  scene.load.image(key, assetUrl(path))
}
