/**
 * Scene 1 world = native background pixels.
 */
export const SCENE_01 = {
  key: 'Scene1',
  textureKey: 'scene-01-bg',
  texturePath: 'assets/backgrounds/scene-01/scene-01-background.png',
  width: 1672,
  height: 941,

  spawn: {
    x: 836,
    y: 860,
  },

  path: {
    centerX: 836,
    yNear: 900,
    halfWidthNear: 300,
    yFar: 400,
    halfWidthFar: 100,
    yMin: 400,
    yMax: 900,
  },

  perspective: {
    yNear: 900,
    yFar: 400,
    /** ~220px visible at near (Sude alpha height ≈736). */
    scaleNear: 0.3,
    scaleFar: 0.115,
  },

  doorInteraction: {
    x: 836,
    y: 430,
    width: 150,
    height: 80,
    arrowX: 836,
    arrowY: 355,
    enterStepY: -14,
    enterDurationMs: 320,
  },

  movementSpeed: 120,
}

/**
 * Scene 2 — horizontal campus world (campus-01 | campus-02).
 * Native segment sizes measured from PNGs (CampusScene also reads texture sizes).
 *
 * Layout (left → right): campus-01 → campus-02
 * campus-02 left = Hankuk National University, right = Vegan Cafe.
 * Sude starts on campus-01 and walks toward the cafe (+X).
 */
export const SCENE_02 = {
  key: 'CampusScene',
  segments: [
    {
      key: 'campus-01',
      path: 'assets/backgrounds/scene-02/campus-01.png',
      width: 1086,
      height: 724,
    },
    {
      key: 'campus-02',
      path: 'assets/backgrounds/scene-02/campus-02.png',
      width: 1086,
      height: 724,
    },
  ],
  worldOrder: ['campus-01', 'campus-02'],

  /** Path band in local campus image Y (0 = top of PNG). */
  path: {
    yMin: 500,
    yMax: 560,
  },

  perspective: {
    yNear: 560,
    yFar: 500,
    scaleNear: 0.18,
    scaleFar: 0.11,
  },

  /** Spawn on campus-01 (local coords; resolved in CampusScene). */
  spawn: {
    localXOnCampus01: 280,
    localY: 530,
  },

  /**
   * Cafe interaction — local to campus-02 (Vegan Cafe door on far right).
   * Measured from campus-02.png (1086×724): door ~x900, sidewalk ~y530.
   */
  cafeInteraction: {
    doorLocalX: 900,
    doorLocalY: 530,
    /** Distance from door for arrow visibility. */
    radius: 110,
    zoneWidth: 200,
    zoneHeight: 120,
    /** Arrow sits just in front of the door, pointing into the entrance. */
    arrowOffsetX: -55,
    arrowOffsetY: -20,
    arrowDirection: 'right',
    enterStepX: 36,
    enterDurationMs: 380,
  },

  movementSpeed: 120,
}

/**
 * Scene 4 — autumn → pit path.
 * World left→right: transition-01 (pit) | transition-02 (cafe).
 * Sude starts on 02 cafe side and walks LEFT into 01 toward the pit.
 */
export const SCENE_04 = {
  key: 'AutumnScene',
  segments: [
    {
      key: 'scene04-01',
      path: 'assets/backgrounds/scene-04/scene04-autumn-transition-01.png',
      width: 1086,
      height: 724,
    },
    {
      key: 'scene04-02',
      path: 'assets/backgrounds/scene-04/scene04-autumn-transition-02.png',
      width: 1086,
      height: 724,
    },
  ],
  /** Left = pit (01), Right = cafe (02). */
  worldOrder: ['scene04-01', 'scene04-02'],

  path: {
    yMin: 470,
    yMax: 580,
  },

  perspective: {
    yNear: 580,
    yFar: 470,
    scaleNear: 0.3,
    scaleFar: 0.18,
  },

  /**
   * Spawn on 02 near Vegan Cafe (local to scene04-02).
   * Cafe is on the far-right of the 02 art.
   */
  spawn: {
    localXOn02: 920,
    localY: 530,
  },

  /**
   * Pit trigger — local to scene04-01 (far left).
   * Auto-fall, no interaction arrow.
   */
  pit: {
    localX: 170,
    localY: 520,
    radius: 78,
    /** Align to pit mouth before shrink. */
    alignDurationMs: 180,
    /** Perspective shrink into hole. */
    fallDurationMs: 650,
    fallDeltaY: 70,
    /** Fade starts after Sude is nearly gone. */
    fadeDurationMs: 320,
  },

  /**
   * Color → BW by world X (walking left toward pit).
   * Resolved against segment origins at runtime; these are local fallbacks.
   */
  colorFade: {
    /** Local X on 02 — still fully colored near cafe. */
    fullColorLocalXOn02: 750,
    /** Local X on 01 — fully BW approaching the pit. */
    fullBwLocalXOn01: 320,
  },

  /**
   * Extra world width to the RIGHT of 02 so the camera can sit on the
   * cafe side without revealing 01 at scene start (viewport > segment width).
   */
  rightPadMin: 600,

  movementSpeed: 120,
}

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  SCENE_1: 'Scene1',
  SCENE_2: 'CampusScene',
  SCENE_3: 'CafeScene',
  SCENE_4: 'AutumnScene',
}

export const SCENE1_STATE = {
  TUTORIAL_1: 'TUTORIAL_1',
  WAITING_FIRST_MOVE: 'WAITING_FIRST_MOVE',
  TUTORIAL_2: 'TUTORIAL_2',
  TUTORIAL_3: 'TUTORIAL_3',
  FREE_MOVEMENT: 'FREE_MOVEMENT',
  DOOR_INTERACTION: 'DOOR_INTERACTION',
  TRANSITIONING: 'TRANSITIONING',
}

export const TUTORIAL_COPY = {
  1: '[karakterini hareket ettirmek için yön tuşlarını kullan!]',
  2: '[bu sude! kodundaki bir hata yüzünden bir hafta boyunca aşağı yönde yürüyemedi, çünkü onu yaratan duygu oyun yapmasını bilmiyordu.]',
  3: '[ayrıca şu anda tamamen siyah beyaz görünüyor! ama oyun ilerledikçe değiştiğini göreceksin!]',
  ok: 'TAMAM',
}
