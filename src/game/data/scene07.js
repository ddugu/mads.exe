import {
  CHAR_ORIGIN_Y,
  VISIBLE_ALPHA_HEIGHT,
  scaleForVisibleHeight,
} from './characterScale'

/**
 * Scene 7 only. Opaque character height after uniform sprite scale.
 * Not 168 — large enough that faces/hands/clothes stay readable.
 */
export const SCENE7_VISIBLE_HEIGHT = 280

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
   * Color Sude. Uniform scale from alpha bbox → SCENE7_VISIBLE_HEIGHT.
   */
  sude: {
    id: 'sude',
    displayName: 'Sude',
    textureKey: 'sude-color-down',
    texturePath: 'assets/characters/sude/sude-color-down.png',
    x: 500,
    y: 800,
    visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.sude,
    scale: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.sude, SCENE7_VISIBLE_HEIGHT),
    originY: CHAR_ORIGIN_Y.sude,
  },

  lineup: [
    {
      id: 'yurin',
      displayName: 'Yurin',
      letterName: 'YURİN MEKTUP',
      textureKey: 'family-yurin',
      texturePath: 'assets/characters/family/yurin.png',
      x: 340,
      y: 640,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyYurin,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyYurin),
      originY: 0.983,
    },
    {
      id: 'burce',
      displayName: 'Burçe',
      letterName: 'BURÇE MEKTUP',
      textureKey: 'family-burce',
      texturePath: 'assets/characters/family/burce.png',
      x: 455,
      y: 530,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyBurce,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyBurce),
      originY: 0.984,
    },
    {
      id: 'dilara',
      displayName: 'Dilara',
      letterName: 'DİLARA MEKTUP',
      textureKey: 'family-dilara',
      texturePath: 'assets/characters/family/dilara.png',
      x: 610,
      y: 485,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyDilara,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyDilara),
      originY: 0.98,
    },
    {
      id: 'zera',
      displayName: 'Zera',
      letterName: 'ZERA MEKTUP',
      textureKey: 'family-zera',
      texturePath: 'assets/characters/family/zera.png',
      x: 930,
      y: 485,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyZera,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyZera),
      originY: 0.951,
    },
    {
      id: 'sevde',
      displayName: 'Sevde',
      letterName: 'SEVDE MEKTUP',
      textureKey: 'family-sevde',
      texturePath: 'assets/characters/family/sevde.png',
      x: 1085,
      y: 530,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familySevde,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familySevde),
      originY: 0.965,
    },
    {
      id: 'irem',
      displayName: 'İrem',
      letterName: 'İREM MEKTUP',
      textureKey: 'family-irem',
      texturePath: 'assets/characters/family/irem.png',
      x: 1195,
      y: 640,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyIrem,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyIrem),
      originY: 0.941,
    },
    {
      id: 'duygu',
      displayName: 'Duygu',
      letterName: 'DUYGU MEKTUP',
      textureKey: 'family-duygu',
      texturePath: 'assets/characters/family/duygu.png',
      x: 400,
      y: 735,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyDuygu,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyDuygu),
      originY: 0.992,
    },
    {
      id: 'yeonjun',
      displayName: 'Yeonjun',
      letterName: null,
      textureKey: 'yeonjun-noona-down',
      texturePath: 'assets/characters/yeonjun/yeonjun-noona-down.png',
      x: 590,
      y: 800,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.yeonjun,
      scale: sc(VISIBLE_ALPHA_HEIGHT.yeonjun),
      originY: 0.959,
    },
    {
      id: 'tyunning',
      displayName: 'Tyunning',
      letterName: null,
      textureKey: 'family-tyunning',
      texturePath: 'assets/characters/family/tyunning.png',
      x: 900,
      y: 800,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyTyunning,
      scale: sc(VISIBLE_ALPHA_HEIGHT.familyTyunning),
      originY: 0.984,
    },
    {
      id: 'soobin',
      displayName: 'Soobin',
      letterName: null,
      textureKey: 'soobin-down',
      texturePath: 'assets/characters/soobin/soobin-down.png',
      x: 1020,
      y: 735,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.soobinNormal,
      scale: sc(VISIBLE_ALPHA_HEIGHT.soobinNormal),
      originY: 0.999,
    },
    {
      id: 'beomgyu',
      displayName: 'Beomgyu',
      letterName: null,
      textureKey: 'family-beomgyu',
      texturePath: 'assets/characters/family/beomgyu.png',
      x: 1165,
      y: 700,
      visibleAlphaHeight: VISIBLE_ALPHA_HEIGHT.familyBeomgyu,
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
