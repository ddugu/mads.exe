import {
  CHAR_ORIGIN_Y,
  VISIBLE_ALPHA_HEIGHT,
  scaleForVisibleHeight,
} from './characterScale'

/**
 * Scene 7 only. Per-character opaque height (alpha bbox × uniform scale).
 * Between previous extremes: not 280, not ~130. Faces readable, cafe-sized.
 */
function visScale(alphaH, visiblePx) {
  return scaleForVisibleHeight(alphaH, visiblePx)
}

/**
 * Scene 7 — reunion cafe. Native scene-07.png = 1536×1024.
 * Existing PNG textures only. Oval around chest (768, 612).
 */
export const SCENE_07 = {
  key: 'ReunionScene',
  textureKey: 'scene-07-bg',
  texturePath: 'assets/backgrounds/scene-07/scene-07.png',
  width: 1536,
  height: 1024,

  floorY: 518,

  sude: {
    id: 'sude',
    displayName: 'Sude',
    textureKey: 'sude-color-down',
    texturePath: 'assets/characters/sude/sude-color-down.png',
    x: 545,
    y: 728,
    visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.sude,
    visibleHeight: 182,
    scale: visScale(VISIBLE_ALPHA_HEIGHT.sude, 182),
    originY: CHAR_ORIGIN_Y.sude,
  },

  lineup: [
    {
      id: 'yurin',
      displayName: 'Yurin',
      letterName: 'YURİN MEKTUP',
      textureKey: 'family-yurin',
      texturePath: 'assets/characters/family/yurin.png',
      x: 410,
      y: 615,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyYurin,
      visibleHeight: 194,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyYurin, 194),
      originY: 0.983,
    },
    {
      id: 'burce',
      displayName: 'Burçe',
      letterName: 'BURÇE MEKTUP',
      textureKey: 'family-burce',
      texturePath: 'assets/characters/family/burce.png',
      x: 500,
      y: 548,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyBurce,
      visibleHeight: 196,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyBurce, 196),
      originY: 0.984,
    },
    {
      id: 'dilara',
      displayName: 'Dilara',
      letterName: 'DİLARA MEKTUP',
      textureKey: 'family-dilara',
      texturePath: 'assets/characters/family/dilara.png',
      x: 625,
      y: 508,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyDilara,
      visibleHeight: 206,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyDilara, 206),
      originY: 0.98,
    },
    {
      id: 'zera',
      displayName: 'Zera',
      letterName: 'ZERA MEKTUP',
      textureKey: 'family-zera',
      texturePath: 'assets/characters/family/zera.png',
      x: 915,
      y: 508,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyZera,
      visibleHeight: 188,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyZera, 188),
      originY: 0.951,
    },
    {
      id: 'sevde',
      displayName: 'Sevde',
      letterName: 'SEVDE MEKTUP',
      textureKey: 'family-sevde',
      texturePath: 'assets/characters/family/sevde.png',
      x: 1035,
      y: 548,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familySevde,
      visibleHeight: 190,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familySevde, 190),
      originY: 0.965,
    },
    {
      id: 'irem',
      displayName: 'İrem',
      letterName: 'İREM MEKTUP',
      textureKey: 'family-irem',
      texturePath: 'assets/characters/family/irem.png',
      x: 1120,
      y: 615,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyIrem,
      visibleHeight: 184,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyIrem, 184),
      originY: 0.941,
    },
    {
      id: 'duygu',
      displayName: 'Duygu',
      letterName: 'DUYGU MEKTUP',
      textureKey: 'family-duygu',
      texturePath: 'assets/characters/family/duygu.png',
      x: 455,
      y: 680,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyDuygu,
      visibleHeight: 196,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyDuygu, 196),
      originY: 0.992,
    },
    {
      id: 'yeonjun',
      displayName: 'Yeonjun',
      letterName: null,
      textureKey: 'yeonjun-noona-down',
      texturePath: 'assets/characters/yeonjun/yeonjun-noona-down.png',
      x: 630,
      y: 728,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.yeonjun,
      visibleHeight: 192,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.yeonjun, 192),
      originY: 0.959,
    },
    {
      id: 'tyunning',
      displayName: 'Tyunning',
      letterName: null,
      textureKey: 'family-tyunning',
      texturePath: 'assets/characters/family/tyunning.png',
      x: 905,
      y: 728,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyTyunning,
      visibleHeight: 191,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyTyunning, 191),
      originY: 0.984,
    },
    {
      id: 'soobin',
      displayName: 'Soobin',
      letterName: null,
      textureKey: 'soobin-down',
      texturePath: 'assets/characters/soobin/soobin-down.png',
      x: 725,
      y: 728,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.soobinNormal,
      visibleHeight: 186,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.soobinNormal, 186),
      originY: 0.999,
    },
    {
      id: 'beomgyu',
      displayName: 'Beomgyu',
      letterName: null,
      textureKey: 'family-beomgyu',
      texturePath: 'assets/characters/family/beomgyu.png',
      x: 1040,
      y: 680,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyBeomgyu,
      visibleHeight: 198,
      scale: visScale(VISIBLE_ALPHA_HEIGHT.familyBeomgyu, 198),
      originY: 0.991,
    },
  ],

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

export const SCENE_07_LETTERS = SCENE_07.lineup
  .filter((c) => c.letterName)
  .map((c) => ({ id: c.id, title: c.letterName }))
