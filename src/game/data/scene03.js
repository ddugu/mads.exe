import { CHAR_SCALE, CHAR_ORIGIN_Y } from './characterScale'

/**
 * Scene 3 — Vegan Cafe layout (native vegan-cafe.png = 1536×1024).
 */
export const SCENE_03 = {
  key: 'CafeScene',
  textureKey: 'vegan-cafe-bg',
  texturePath: 'assets/backgrounds/scene-03/vegan-cafe.png',
  width: 1536,
  height: 1024,

  /**
   * Hug plate — user asset as-is (no crop / redraw).
   * Scale from alpha bbox height → TARGET_VISIBLE_HEIGHT (~220px).
   * Anchored at Soobin→Yeonjun meet floor point.
   */
  hug: {
    textureKey: 'yeonbin-hug',
    texturePath: 'assets/characters/soobin/yeonbin-hug.png',
    /** Midpoint between yeonjunMeet and Yeonjun feet. */
    x: 795,
    y: 475,
    scale: CHAR_SCALE.yeonbinHug,
    /** Alpha center-x ≈ ((107+951)/2)/1090 */
    originX: 0.485,
    originY: CHAR_ORIGIN_Y.yeonbinHug,
  },

  /** Small heart above hug heads (not screen-filling). */
  hugHeart: {
    padAboveHeads: 40,
    durationMs: 1800,
    startScale: 0.55,
    endScale: 0.85,
    holdFullMs: 450,
  },

  firedText: 'OLAMAZ SOOBİN KAFEDEN KOVULDU',

  /**
   * Sude enters through Welcome door onto the doormat center.
   * Mat ≈ (200–380, 325–460); center ≈ (290, 390).
   */
  sude: {
    doorX: 290,
    doorY: 320,
    x: 290,
    y: 390,
    direction: 'down',
    scale: CHAR_SCALE.sude,
    originY: CHAR_ORIGIN_Y.sude,
    entryDurationMs: 700,
  },

  soobin: {
    spawn: { x: 720, y: 450, direction: 'down' },
    pathToLeft: [
      { x: 500, y: 450 },
      { x: 500, y: 770 },
      { x: 200, y: 760 },
    ],
    pathToRight: [
      { x: 600, y: 760 },
      { x: 1120, y: 750 },
    ],
    pathToYeonjun: [{ x: 760, y: 475 }],
    leftTable: { x: 200, y: 760 },
    rightTable: { x: 1120, y: 750 },
    yeonjunMeet: { x: 760, y: 475 },
    speed: 100,
    /** ~220px visible (holding alpha height 486). */
    scale: CHAR_SCALE.soobin,
    originY: CHAR_ORIGIN_Y.soobin,
    arriveThreshold: 14,
  },

  obstacles: [
    { x: 280, y: 500, w: 145, h: 235 },
    { x: 55, y: 520, w: 235, h: 220 },
    { x: 1140, y: 500, w: 240, h: 250 },
    { x: 640, y: 270, w: 420, h: 145 },
    { x: 40, y: 800, w: 220, h: 120 },
    { x: 70, y: 470, w: 90, h: 80 },
  ],

  leftCustomers: [
    { headX: 95, headTopY: 535 },
    { headX: 255, headTopY: 555 },
  ],
  rightCustomers: [
    { headX: 1210, headTopY: 500 },
    { headX: 1280, headTopY: 620 },
  ],
  bubblePad: 18,

  emotion: {
    sadKey: 'fx-sad-face',
    sadPath: 'assets/effects/sad/sad-face.png',
    cryKey: 'fx-cry-face',
    cryPath: 'assets/effects/sad/cry-face.png',
    scale: 0.85,
    headPad: 5,
  },

  yeonjun: {
    x: 830,
    y: 470,
    /** ~220px visible (alpha height 731). */
    scale: CHAR_SCALE.yeonjun,
    originY: CHAR_ORIGIN_Y.yeonjun,
    textureKey: 'yeonjun-noona-down',
    texturePath: 'assets/characters/yeonjun/yeonjun-noona-down.png',
  },

  timing: {
    settleAfterArriveMs: 4000,
    bubbleVisibleMs: 2800,
    gapBetweenBubblesMs: 1500,
    afterTalksBeforeNextMs: 1200,
    afterSadBeforeWalkMs: 1200,
    afterCryBeforeYeonjunMs: 350,
    afterYeonjunBeforeDropMs: 700,
    afterDropBeforeWalkMs: 600,
    /** Brief beat so Yeonjun is visible before narration box. */
    afterYeonjunVisibleMs: 450,
  },

  /**
   * Story narration — exact copy, do not rewrite.
   * Bracket wrappers in the design doc are not part of the spoken text.
   */
  story: {
    intro:
      "kafeden içeriye girip soobinin ilk iş gününe görmelisin ! bugün soobin'in kafede ilk günü! başlangıçta müşterilere yanlış siparişleri götürebilir, müşterilerden yediği azar onun modunu düşürecek! ama endişe etme, ona her şeyin doğrusunu öğretecek ve onu neşelendirecek birisi var. kendi yarattığın evreni gözlerinle görmek ister misin ?",
    yeonjunReveal:
      "soobinin yeonjunuyla tanış! yolculuğu boyunca soobin'e yardım edecek, onunla etkileşime girmek soobin'in üzgün modunu değiştirip siparişleri götürmeye devam etmesini sağlar. Sana tanıdık geldi mi onlar ?",
  },
}

export const CAFE_SEQUENCE = {
  START: 'START',
  SUDE_ENTER: 'SUDE_ENTER',
  GO_LEFT_TABLE: 'GO_LEFT_TABLE',
  WAIT_LEFT_TABLE: 'WAIT_LEFT_TABLE',
  LEFT_CUSTOMER_1_TALK: 'LEFT_CUSTOMER_1_TALK',
  LEFT_CUSTOMER_2_TALK: 'LEFT_CUSTOMER_2_TALK',
  SOOBIN_SAD: 'SOOBIN_SAD',
  GO_RIGHT_TABLE: 'GO_RIGHT_TABLE',
  WAIT_RIGHT_TABLE: 'WAIT_RIGHT_TABLE',
  RIGHT_CUSTOMER_1_TALK: 'RIGHT_CUSTOMER_1_TALK',
  RIGHT_CUSTOMER_2_TALK: 'RIGHT_CUSTOMER_2_TALK',
  SOOBIN_CRYING: 'SOOBIN_CRYING',
  YEONJUN_APPEARS: 'YEONJUN_APPEARS',
  STORY_YEONJUN: 'STORY_YEONJUN',
  DROP_ITEMS: 'DROP_ITEMS',
  GO_TO_YEONJUN: 'GO_TO_YEONJUN',
  HUG_SCENE: 'HUG_SCENE',
  HEART: 'HEART',
  FIRED: 'FIRED',
  TO_SCENE_4: 'TO_SCENE_4',
  END: 'END',
}
