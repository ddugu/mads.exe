"""
Generate Sude walk frames from idle direction sheet — same pipeline as
yeonjun-birthday-cafe/scripts/make_walk_frames.py.

Source (FINAL art, never rewritten):
  public/assets/characters/sude/sude-directions-bw.png
  Layout: 1536×1024 — 4 equal frames L→R: FRONT | BACK | LEFT | RIGHT
  Mapped to: down | up | left | right

Outputs:
  sude-{dir}.png           idle crops
  sude-{dir}-{1,2,3}.png   walk plant/lift strides

Only leg/foot pixels are manipulated. Face/hair/dress torso unchanged.
Nearest-neighbor only — no smoothing, no recolor, no redesign.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/assets/characters/sude"

DIRS = ("down", "up", "left", "right")
SHEET_TO_DIR = ("down", "up", "left", "right")

# Variants: bw (Scene 1) and color (Scene 2)
VARIANTS = {
    "bw": {
        "sheet": OUT / "sude-directions-bw.png",
        "prefix": "sude",  # sude-down.png
    },
    "color": {
        "sheet": OUT / "sude-directions.png",
        "prefix": "sude-color",  # sude-color-down.png
    },
}


def opaque_bbox(rgba: np.ndarray):
    ys, xs = np.where(rgba[:, :, 3] > 8)
    if len(xs) == 0:
        h, w = rgba.shape[:2]
        return 0, 0, w - 1, h - 1
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def extract_idle_frames(sheet_path: Path, prefix: str) -> dict[str, np.ndarray]:
    sheet = Image.open(sheet_path).convert("RGBA")
    w, h = sheet.size
    fw = w // 4
    if w != fw * 4:
        raise SystemExit(f"Unexpected sheet width {w}; expected divisible by 4")
    out: dict[str, np.ndarray] = {}
    for i, direction in enumerate(SHEET_TO_DIR):
        crop = sheet.crop((i * fw, 0, (i + 1) * fw, h))
        arr = np.asarray(crop)
        out[direction] = arr
        idle_path = OUT / f"{prefix}-{direction}.png"
        crop.save(idle_path, optimize=True)
        print(f"wrote {idle_path.name} size={crop.size} bbox={opaque_bbox(arr)}")
    return out


def generate_variant(variant_key: str) -> int:
    cfg = VARIANTS[variant_key]
    sheet_path: Path = cfg["sheet"]
    prefix: str = cfg["prefix"]
    if not sheet_path.exists():
        raise SystemExit(f"Missing idle sheet: {sheet_path}")

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"\n=== variant={variant_key} source={sheet_path.name} prefix={prefix} ===")
    idles = extract_idle_frames(sheet_path, prefix)

    count = 0
    for direction in DIRS:
        idle = idles[direction]
        frames = make_frames(idle, direction)
        mid = idle.shape[1] // 2
        for idx, frame in frames.items():
            out = OUT / f"{prefix}-{direction}-{idx}.png"
            assert frame.shape == idle.shape, (frame.shape, idle.shape)
            Image.fromarray(frame, "RGBA").save(out, optimize=True)
            print(
                f"wrote {out.name} "
                f"feetL/R={foot_y(frame, 0, mid)}/{foot_y(frame, mid, frame.shape[1])} "
                f"(idle {foot_y(idle, 0, mid)}/{foot_y(idle, mid, idle.shape[1])}) "
                f"size={frame.shape[1]}x{frame.shape[0]}"
            )
            count += 1
    print(f"done {count} walk frames + {len(DIRS)} idle crops ({variant_key})")
    return count


def legs_and_feet(idle: np.ndarray) -> np.ndarray:
    """
    Dress character: only socks/shoes/calves BELOW the dress hem.
    Detect hem as the last wide (dress) band, then take opaque pixels under it.
    Never includes face/hair/torso.
    """
    h, w = idle.shape[:2]
    x0, y0, x1, y1 = opaque_bbox(idle)
    # Width profile: dress is wide; legs/shoes are narrower.
    hem_y = y0 + int((y1 - y0) * 0.78)
    for y in range(y1, y0, -1):
        xs = np.where(idle[y, :, 3] > 8)[0]
        if len(xs) == 0:
            continue
        width = int(xs.max() - xs.min()) + 1
        if width >= 170:
            hem_y = y + 1
            break

    y_cut = min(max(hem_y, y0 + int((y1 - y0) * 0.72)), y1 - 8)

    legs = np.zeros((h, w), dtype=bool)
    band = idle[y_cut : y1 + 1, :, 3] > 8
    if not band.any():
        return legs
    xs = np.where(band)[1]
    x_lo = max(0, int(xs.min()) - 1)
    x_hi = min(w - 1, int(xs.max()) + 1)

    for y in range(y_cut, h):
        for x in range(x_lo, x_hi + 1):
            if idle[y, x, 3] > 8:
                legs[y, x] = True

    if not legs.any():
        return legs

    img = Image.fromarray((legs.astype(np.uint8) * 255), "L")
    img = img.filter(ImageFilter.MaxFilter(3))
    img = img.filter(ImageFilter.MinFilter(3))
    closed = np.asarray(img) > 127
    closed[: max(0, y_cut), :] = False
    return closed


def leg_split(legs: np.ndarray):
    xs = np.where(legs)[1]
    if len(xs) == 0:
        z = np.zeros_like(legs)
        return z, z
    mid = int(np.median(xs))
    left = legs & (np.arange(legs.shape[1])[None, :] <= mid)
    right = legs & (np.arange(legs.shape[1])[None, :] > mid)
    return left, right


def blit_leg(
    dest: np.ndarray,
    idle: np.ndarray,
    mask: np.ndarray,
    scale_y: float,
    lift_px: int,
    slide_x: int,
) -> None:
    """
    Copy masked leg into dest:
    - hips (top ~30%) stay near original Y
    - shin scaled and moved by lift_px (positive = foot up)
    - slide_x shifts whole leg horizontally
    NEAREST resize only.
    """
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    bh = y1 - y0
    bw = x1 - x0
    if bh < 6 or bw < 2:
        return

    hip_h = max(2, int(bh * 0.28))
    local = mask[y0:y1, x0:x1]
    crop = idle[y0:y1, x0:x1].copy()
    crop[~local] = 0

    hip = crop[:hip_h]
    shin = crop[hip_h:]
    shin_h = shin.shape[0]
    new_shin_h = max(2, int(round(shin_h * scale_y)))

    shin_img = Image.fromarray(shin, "RGBA").resize(
        (bw, new_shin_h), Image.Resampling.NEAREST
    )
    shin_arr = np.asarray(shin_img)

    h, w = dest.shape[:2]

    for y in range(hip_h):
        for x in range(bw):
            if hip[y, x, 3] < 8:
                continue
            ny = y0 + y
            nx = x0 + x + slide_x
            if 0 <= ny < h and 0 <= nx < w:
                dest[ny, nx] = hip[y, x]

    bottom = y1 - lift_px
    paste_y = bottom - new_shin_h
    hip_bottom = y0 + hip_h
    if paste_y > hip_bottom:
        conn_h = paste_y - hip_bottom
        conn = Image.fromarray(shin[: max(1, min(4, shin_h))], "RGBA").resize(
            (bw, conn_h), Image.Resampling.NEAREST
        )
        conn_arr = np.asarray(conn)
        for y in range(conn_h):
            for x in range(bw):
                if conn_arr[y, x, 3] < 8:
                    continue
                ny = hip_bottom + y
                nx = x0 + x + slide_x
                if 0 <= ny < h and 0 <= nx < w:
                    dest[ny, nx] = conn_arr[y, x]

    for y in range(new_shin_h):
        for x in range(bw):
            if shin_arr[y, x, 3] < 8:
                continue
            ny = paste_y + y
            nx = x0 + x + slide_x
            if 0 <= ny < h and 0 <= nx < w:
                dest[ny, nx] = shin_arr[y, x]


def make_frame(
    idle: np.ndarray,
    left: np.ndarray,
    right: np.ndarray,
    left_scale: float,
    right_scale: float,
    left_lift: int,
    right_lift: int,
    left_slide: int,
    right_slide: int,
) -> np.ndarray:
    legs = left | right
    out = idle.copy()

    # Clear ONLY the leg mask (+ small dilate). Do not wipe the dress bbox.
    if legs.any():
        img = Image.fromarray((legs.astype(np.uint8) * 255), "L")
        img = img.filter(ImageFilter.MaxFilter(3))
        clear = np.asarray(img) > 127
        out[clear] = 0

    blit_leg(out, idle, left, left_scale, left_lift, left_slide)
    blit_leg(out, idle, right, right_scale, right_lift, right_slide)
    return out


def make_frames(idle: np.ndarray, direction: str) -> dict[int, np.ndarray]:
    legs = legs_and_feet(idle)
    left, right = leg_split(legs)
    if legs.any():
        ys = np.where(legs)[0]
        leg_h = int(ys.max() - ys.min()) + 1
    else:
        leg_h = 40
    # Subtle stride — dress character, avoid huge lifts
    lift = max(6, min(18, leg_h // 8))
    slide = max(2, min(8, leg_h // 20))

    def F(ls, rs, ll, rl, lsl, rsl):
        return make_frame(idle, left, right, ls, rs, ll, rl, lsl, rsl)

    if direction in ("down", "up"):
        return {
            1: F(1.0, 0.78, 0, lift, -slide // 2, slide),
            2: F(0.92, 0.92, lift // 4, lift // 4, 0, 0),
            3: F(0.78, 1.0, lift, 0, slide, -slide // 2),
        }
    if direction == "left":
        return {
            1: F(1.0, 0.78, 0, lift, -slide, slide // 2),
            2: F(0.92, 0.92, lift // 4, lift // 4, 0, 0),
            3: F(0.78, 1.0, lift, 0, slide // 2, -slide),
        }
    return {
        1: F(1.0, 0.78, 0, lift, -slide // 2, slide),
        2: F(0.92, 0.92, lift // 4, lift // 4, 0, 0),
        3: F(0.78, 1.0, lift, 0, slide, -slide // 2),
    }


def foot_y(im: np.ndarray, x0: int, x1: int) -> int:
    for y in range(im.shape[0] - 1, -1, -1):
        if im[y, x0:x1, 3].max() > 8:
            return y
    return -1


def main() -> None:
    import sys

    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    total = 0
    if which in ("all", "bw"):
        total += generate_variant("bw")
    if which in ("all", "color"):
        total += generate_variant("color")
    print(f"total wrote walk frames across runs: {total}")
    print("cycle in Phaser: 1 -> 2 -> 3 -> 2 @ 10 FPS")


if __name__ == "__main__":
    main()
