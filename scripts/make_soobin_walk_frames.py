"""
Slice Soobin direction sheets + generate walk frames (leg plant/lift).
Does NOT redraw the character — only crops reference sheets and manipulates leg pixels.

Sheet layout (L→R): FRONT | RIGHT | LEFT | BACK
Mapped to:           down  | right | left | up

Sources:
  soobin-reference.png          → normal idle/walk
  soobin-holding-reference.png  → holding (paper+pen) idle/walk
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/assets/characters/soobin"

DIRS = ("down", "up", "left", "right")
# Soobin sheets are ordered differently from Sude
SHEET_TO_DIR = ("down", "right", "left", "up")

VARIANTS = {
    "normal": {
        "sheet": OUT / "soobin-reference.png",
        "prefix": "soobin",
    },
    "holding": {
        "sheet": OUT / "soobin-holding-reference.png",
        "prefix": "soobin-holding",
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
    out: dict[str, np.ndarray] = {}
    for i, direction in enumerate(SHEET_TO_DIR):
        crop = sheet.crop((i * fw, 0, (i + 1) * fw, h))
        # Make pure black near-transparent for cleaner edges
        arr = np.asarray(crop).copy()
        # keep as-is (reference already has black bg — convert near-black to alpha)
        rgb = arr[:, :, :3].astype(np.int16)
        dark = (rgb.max(axis=2) < 18) & (arr[:, :, 3] > 0)
        arr[dark, 3] = 0
        out[direction] = arr
        idle_path = OUT / f"{prefix}-{direction}.png"
        Image.fromarray(arr, "RGBA").save(idle_path, optimize=True)
        print(f"wrote {idle_path.name} size={crop.size} bbox={opaque_bbox(arr)}")
    return out


def legs_and_feet(idle: np.ndarray) -> np.ndarray:
    """Pants character: lower ~28% of opaque body as legs/shoes."""
    h, w = idle.shape[:2]
    x0, y0, x1, y1 = opaque_bbox(idle)
    body_h = max(1, y1 - y0)
    y_cut = y0 + int(body_h * 0.72)

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


def blit_leg(dest, idle, mask, scale_y, lift_px, slide_x):
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
    shin_arr = np.asarray(
        Image.fromarray(shin, "RGBA").resize((bw, new_shin_h), Image.Resampling.NEAREST)
    )

    h, w = dest.shape[:2]
    for y in range(hip_h):
        for x in range(bw):
            if hip[y, x, 3] < 8:
                continue
            ny, nx = y0 + y, x0 + x + slide_x
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
                ny, nx = hip_bottom + y, x0 + x + slide_x
                if 0 <= ny < h and 0 <= nx < w:
                    dest[ny, nx] = conn_arr[y, x]

    for y in range(new_shin_h):
        for x in range(bw):
            if shin_arr[y, x, 3] < 8:
                continue
            ny, nx = paste_y + y, x0 + x + slide_x
            if 0 <= ny < h and 0 <= nx < w:
                dest[ny, nx] = shin_arr[y, x]


def make_frame(idle, left, right, ls, rs, ll, rl, lsl, rsl):
    legs = left | right
    out = idle.copy()
    if legs.any():
        img = Image.fromarray((legs.astype(np.uint8) * 255), "L")
        clear = np.asarray(img.filter(ImageFilter.MaxFilter(3))) > 127
        out[clear] = 0
    blit_leg(out, idle, left, ls, ll, lsl)
    blit_leg(out, idle, right, rs, rl, rsl)
    return out


def make_frames(idle: np.ndarray, direction: str) -> dict[int, np.ndarray]:
    legs = legs_and_feet(idle)
    left, right = leg_split(legs)
    if legs.any():
        ys = np.where(legs)[0]
        leg_h = int(ys.max() - ys.min()) + 1
    else:
        leg_h = 40
    lift = max(5, min(16, leg_h // 8))
    slide = max(2, min(7, leg_h // 20))

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


def generate_variant(key: str) -> int:
    cfg = VARIANTS[key]
    sheet = cfg["sheet"]
    prefix = cfg["prefix"]
    if not sheet.exists():
        raise SystemExit(f"Missing: {sheet}")
    print(f"\n=== {key} {sheet.name} -> {prefix}-* ===")
    idles = extract_idle_frames(sheet, prefix)
    count = 0
    for direction in DIRS:
        idle = idles[direction]
        for idx, frame in make_frames(idle, direction).items():
            out = OUT / f"{prefix}-{direction}-{idx}.png"
            Image.fromarray(frame, "RGBA").save(out, optimize=True)
            print(f"wrote {out.name}")
            count += 1
    return count


def extract_yeonjun_front() -> None:
    """Crop Yeonjun Noona front-facing idle from uneven sheet."""
    src = ROOT / "public/assets/characters/yeonjun/yeonjun-noona.png"
    out_dir = ROOT / "public/assets/characters/yeonjun"
    im = Image.open(src).convert("RGBA")
    a = np.asarray(im)
    col = (a[:, :, 3] > 8).sum(axis=0)
    thresh = col.max() * 0.02
    opaque = col > thresh
    runs = []
    i = 0
    w = a.shape[1]
    while i < w:
        if opaque[i]:
            j = i
            while j < w and opaque[j]:
                j += 1
            runs.append((i, j))
            i = j
        else:
            i += 1
    # First substantial run = front
    runs = [r for r in runs if r[1] - r[0] > 50]
    x0, x1 = runs[0]
    pad = 12
    x0 = max(0, x0 - pad)
    x1 = min(w, x1 + pad)
    crop = im.crop((x0, 0, x1, im.size[1]))
    arr = np.asarray(crop).copy()
    rgb = arr[:, :, :3].astype(np.int16)
    dark = (rgb.max(axis=2) < 18) & (arr[:, :, 3] > 0)
    arr[dark, 3] = 0
    path = out_dir / "yeonjun-noona-down.png"
    Image.fromarray(arr, "RGBA").save(path, optimize=True)
    print(f"wrote {path.name} size={crop.size}")


def main() -> None:
    import sys

    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    total = 0
    if which in ("all", "normal"):
        total += generate_variant("normal")
    if which in ("all", "holding"):
        total += generate_variant("holding")
    if which in ("all", "yeonjun"):
        extract_yeonjun_front()
    print(f"done walk frames: {total}")


if __name__ == "__main__":
    main()
