import { assetUrl } from './assetUrl'

export const GAME_MUSIC_KEY = 'bgm-atlantis'
export const GAME_MUSIC_PATH = 'assets/audio/music/Seafret - Atlantis.mp3'

/**
 * @param {Phaser.Scene} scene
 */
export function preloadGameMusic(scene) {
  if (scene.cache.audio.exists(GAME_MUSIC_KEY)) return
  scene.load.audio(GAME_MUSIC_KEY, assetUrl(GAME_MUSIC_PATH))
}

/**
 * Looping BGM from Scene 1 onward. Uses the game Sound Manager so
 * it keeps playing across scene changes.
 * @param {Phaser.Scene} scene
 */
export function playGameMusic(scene) {
  const snd = scene.sound
  if (!snd) return
  snd.unlock()
  snd.pauseOnBlur = false

  const existing = snd.get(GAME_MUSIC_KEY)
  if (existing) {
    if (!existing.isPlaying) {
      existing.play({ loop: true, volume: 0.42 })
    }
    return
  }

  if (!scene.cache.audio.exists(GAME_MUSIC_KEY)) return
  snd.play(GAME_MUSIC_KEY, { loop: true, volume: 0.42 })
}
