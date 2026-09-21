import Phaser from 'phaser'
import { SCENE_01 } from './data/scene01'
import { BootScene } from './scenes/BootScene'
import { Scene1 } from './scenes/Scene1'
import { CampusScene } from './scenes/CampusScene'
import { CafeScene } from './scenes/CafeScene'
import { AutumnScene } from './scenes/AutumnScene'
import { GateScene } from './scenes/GateScene'
import { DormScene } from './scenes/DormScene'
import { ReunionScene } from './scenes/ReunionScene'

/** Logical size matches Scene 1 background native pixels. */
export const GAME_WIDTH = SCENE_01.width
export const GAME_HEIGHT = SCENE_01.height

/**
 * @param {HTMLElement} parent  #phaser-frame (letterboxed game frame)
 */
export function createGameConfig(parent) {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#000000',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      expandParent: false,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
      powerPreference: 'high-performance',
      transparent: false,
    },
    scene: [
      BootScene,
      Scene1,
      CampusScene,
      CafeScene,
      AutumnScene,
      GateScene,
      DormScene,
      ReunionScene,
    ],
    audio: {
      disableWebAudio: false,
    },
    input: {
      keyboard: true,
      activePointers: 3,
    },
  }
}
