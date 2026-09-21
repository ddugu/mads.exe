/**
 * Shared standing-character visual size standard.
 *
 * TARGET_VISIBLE_HEIGHT is the on-screen height of the opaque character
 * (alpha bounding box), NOT the raw PNG canvas height.
 *
 * scale = TARGET_VISIBLE_HEIGHT / visibleAlphaHeight
 *
 * Measured once from idle-down textures (do not rewrite PNGs):
 *   Sude color/bw  vis ≈ 735–737 px in 1024 canvas
 *   Soobin holding vis ≈ 486 px in 507 canvas
 *   Soobin normal  vis ≈ 508 px in 508 canvas
 *   Yeonjun        vis ≈ 731 px in 887 canvas
 */

export const TARGET_VISIBLE_HEIGHT = 220

/** Visible (non-transparent) character heights in source PNGs. */
export const VISIBLE_ALPHA_HEIGHT = {
  sude: 736,
  soobinHolding: 486,
  soobinNormal: 508,
  yeonjun: 731,
  yeonbinHug: 1407,
  familyDuygu: 1491,
  familyYurin: 1449,
  familyBurce: 1473,
  familyDilara: 1444,
  familyZera: 1275,
  familySevde: 1270,
  familyIrem: 1165,
  familyBeomgyu: 1398,
  familyTyunning: 1283,
  chestClose: 557,
  chestOpen: 740,
}

/**
 * @param {number} visibleAlphaHeight
 * @param {number} [targetPx]
 */
export function scaleForVisibleHeight(
  visibleAlphaHeight,
  targetPx = TARGET_VISIBLE_HEIGHT,
) {
  if (!visibleAlphaHeight || visibleAlphaHeight <= 0) return 1
  return targetPx / visibleAlphaHeight
}

export const CHAR_SCALE = {
  sude: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.sude),
  soobin: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.soobinHolding),
  soobinNormal: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.soobinNormal),
  yeonjun: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.yeonjun),
  yeonbinHug: scaleForVisibleHeight(VISIBLE_ALPHA_HEIGHT.yeonbinHug),
}

/** Feet as fraction of canvas height (from alpha bbox bottom). */
export const CHAR_ORIGIN_Y = {
  sude: 0.88,
  soobin: 0.96,
  yeonjun: 0.96,
  /** Feet near alpha bottom of yeonbin-hug.png (maxY≈1406 / 1443). */
  yeonbinHug: 0.975,
}
