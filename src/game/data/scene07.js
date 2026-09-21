import {
  CHAR_ORIGIN_Y,
  VISIBLE_ALPHA_HEIGHT,
  scaleForVisibleHeight,
} from './characterScale'

/** Shared visible height in Scene 7 (cafe floor, not PNG canvas). */
export const SCENE7_VISIBLE_HEIGHT = 176

function sc(alphaH) {
  return scaleForVisibleHeight(alphaH, SCENE7_VISIBLE_HEIGHT)
}

/**
 * Scene 7 — reunion cafe. Native scene-07.png = 1536×1024.
 * 7 family + Soobin + Yeonjun on the counter floor; chest in front.
 *
 * Each `x` is centered from measured alpha width + 22px gaps, then
 * the whole lineup is centered in the 1536px room.
 */
export const SCENE_07 = {
  key: 'ReunionScene',
  textureKey: 'scene-07-bg',
  texturePath: 'assets/backgrounds/scene-07/scene-07.png',
  width: 1536,
  height: 1024,

  /** Shared feet line in front of the counter. */
  floorY: 518,

  /**
   * Color Sude on the horseshoe around the chest (center 768, 612).
   * Ellipse rx≈300, ry≈118; front gap left open so the chest stays visible.
   */
  sude: {
    textureKey: 'sude-color-down',
    texturePath: 'assets/characters/sude/sude-color-down.png',
    x: 560,
    y: 745,
    scale: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.sude, SCENE7_VISIBLE_HEIGHT),
    originY: CHAR_ORIGIN_Y.sude,
  },

  lineup: [
    {
      id: 'duygu',
      letterName: 'DUYGU MEKTUP',
      textureKey: 'family-duygu',
      texturePath: 'assets/characters/family/duygu.png',
      x: 490,
      y: 690,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyDuygu),
      originY: 0.992,
    },
    {
      id: 'yurin',
      letterName: 'YURİN MEKTUP',
      textureKey: 'family-yurin',
      texturePath: 'assets/characters/family/yurin.png',
      x: 430,
      y: 620,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyYurin),
      originY: 0.983,
    },
    {
      id: 'burce',
      letterName: 'BURÇE MEKTUP',
      textureKey: 'family-burce',
      texturePath: 'assets/characters/family/burce.png',
      x: 520,
      y: 560,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyBurce),
      originY: 0.984,
    },
    {
      id: 'dilara',
      letterName: 'DİLARA MEKTUP',
      textureKey: 'family-dilara',
      texturePath: 'assets/characters/family/dilara.png',
      x: 640,
      y: 530,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyDilara),
      originY: 0.98,
    },
    {
      id: 'zera',
      letterName: 'ZERA MEKTUP',
      textureKey: 'family-zera',
      texturePath: 'assets/characters/family/zera.png',
      x: 860,
      y: 530,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyZera),
      originY: 0.951,
    },
    {
      id: 'sevde',
      letterName: 'SEVDE MEKTUP',
      textureKey: 'family-sevde',
      texturePath: 'assets/characters/family/sevde.png',
      x: 980,
      y: 560,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familySevde),
      originY: 0.965,
    },
    {
      id: 'irem',
      letterName: 'İREM MEKTUP',
      textureKey: 'family-irem',
      texturePath: 'assets/characters/family/irem.png',
      x: 1035,
      y: 620,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyIrem),
      originY: 0.941,
    },
    {
      id: 'yeonjun',
      letterName: null,
      textureKey: 'yeonjun-noona-down',
      texturePath: 'assets/characters/yeonjun/yeonjun-noona-down.png',
      x: 720,
      y: 745,
      scale: sc(VISIBLE_ALPHA_HEIGHT.yeonjun),
      originY: 0.959,
    },
    {
      id: 'tyunning',
      letterName: null,
      textureKey: 'family-tyunning',
      texturePath: 'assets/characters/family/tyunning.png',
      x: 850,
      y: 745,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyTyunning),
      originY: 0.984,
    },
    {
      id: 'soobin',
      letterName: null,
      textureKey: 'soobin-down',
      texturePath: 'assets/characters/soobin/soobin-down.png',
      x: 970,
      y: 745,
      scale: sc(VISIBLE_ALPHA_HEIGHT.soobinNormal),
      originY: 0.999,
    },
    {
      id: 'beomgyu',
      letterName: null,
      textureKey: 'family-beomgyu',
      texturePath: 'assets/characters/family/beomgyu.png',
      x: 1065,
      y: 745,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyBeomgyu),
      originY: 0.991,
    },
  ],

  /** Walkable cafe floor for Sude in Scene 7. */
  sudeMove: {
    speed: 120,
    path: {
      mode: 'box',
      xMin: 220,
      xMax: 1320,
      yMin: 455,
      yMax: 900,
    },
  },

  chest: {
    x: 768,
    y: 612,
    closeKey: 'chest-close',
    closePath: 'assets/effects/chest/chest-close.png',
    openKey: 'chest-open',
    openPath: 'assets/effects/chest/chest-open.png',
    closeScale: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.chestClose, 92),
    openScale: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.chestOpen, 118),
    originY: 0.897,
  },
}

/** Letter titles come from family character ids already in the project. */
export const SCENE_07_LETTERS = SCENE_07.lineup
  .filter((c) => c.letterName)
  .map((c) => ({ id: c.id, title: c.letterName }))
