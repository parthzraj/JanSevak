"""Give the demo reports their pictures.

For every (kind, variant) we look for a real photo in demo_assets/photos/<kind>_<n>.jpg (put there by
fetch_photos.py or by you). If there is none we draw a labelled placeholder. Either way the picture is stored in the
app's uploads folder and the report gets a normal "/uploads/..." URL, exactly like a photo a citizen uploaded.
"""
from __future__ import annotations

import io
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from app.core.config import settings
from demo.photo_kinds import KINDS, VARIANTS

ASSET_DIR = Path(__file__).resolve().parent.parent / "demo_assets" / "photos"
W, H = 1080, 810
_EXT = (".jpg", ".jpeg", ".png", ".webp")


def _font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default(size)


def _real_photo(kind: str, n: int) -> Path | None:
    found = sorted(p for p in ASSET_DIR.glob(f"{kind}_*") if p.suffix.lower() in _EXT) if ASSET_DIR.exists() else []
    return found[(n - 1) % len(found)] if found else None


def _placeholder(kind: str, n: int) -> Image.Image:
    label, (r, g, b), _ = KINDS[kind]
    rnd = random.Random(f"{kind}-{n}")
    img = Image.new("RGB", (W, H))
    px = ImageDraw.Draw(img)
    for y in range(H):  # sky-to-ground gradient tinted by the kind's colour
        t = y / H
        px.line([(0, y), (W, y)], fill=(int(205 - 120 * t + (r - 90) * 0.5), int(215 - 120 * t + (g - 90) * 0.5), int(225 - 110 * t + (b - 90) * 0.5)))
    horizon = int(H * (0.42 + 0.05 * rnd.random()))
    px.rectangle([0, horizon, W, H], fill=(r // 2 + 40, g // 2 + 40, b // 2 + 40))
    for _ in range(14):  # a few building blocks on the skyline
        x = rnd.randint(-40, W - 40)
        w, h = rnd.randint(70, 160), rnd.randint(60, 200)
        px.rectangle([x, horizon - h, x + w, horizon], fill=(r // 3 + 90, g // 3 + 95, b // 3 + 105))
    cx, cy = W // 2 + rnd.randint(-120, 120), int(H * 0.72)
    if kind in ("pothole", "manhole", "after_road", "after_pipe", "footpath"):
        px.ellipse([cx - 190, cy - 52, cx + 190, cy + 62], fill=(30, 30, 34) if kind in ("pothole", "manhole") else (90, 90, 96))
    elif kind in ("garbage", "park", "sewage", "drain"):
        for _ in range(34):
            x, y, s = cx + rnd.randint(-230, 230), cy + rnd.randint(-70, 50), rnd.randint(22, 58)
            px.ellipse([x, y, x + s, y + s], fill=(rnd.randint(70, 190), rnd.randint(70, 190), rnd.randint(60, 170)))
    elif kind in ("streetlight", "after_light"):
        px.rectangle([cx - 8, horizon - 170, cx + 8, cy + 40], fill=(40, 40, 46))
        px.ellipse([cx - 44, horizon - 200, cx + 44, horizon - 140], fill=(250, 204, 21) if kind == "after_light" else (70, 70, 76))
    elif kind in ("waterlog", "pipeleak", "after_drain"):
        for i in range(5):
            y = cy - 60 + i * 26
            px.arc([cx - 300, y, cx + 300, y + 36], 0, 180, fill=(235, 245, 255), width=5)
    elif kind in ("tree", "after_tree", "bench", "after_bench", "cleanup", "after_clean"):
        px.rectangle([cx - 14, cy - 150, cx + 14, cy + 20], fill=(92, 64, 40))
        px.ellipse([cx - 120, cy - 290, cx + 120, cy - 100], fill=(34, 139, 80))
    img = img.filter(ImageFilter.GaussianBlur(1.1))
    d = ImageDraw.Draw(img)
    band = Image.new("RGBA", (W, 130), (8, 20, 36, 170))
    img.paste(band, (0, H - 130), band)
    d = ImageDraw.Draw(img)
    d.text((44, H - 112), label.upper(), font=_font(52), fill=(255, 255, 255))
    d.text((44, H - 52), "Demo photo placeholder", font=_font(26), fill=(186, 214, 255))
    return img


_WRITTEN: set[str] = set()  # names refreshed during this run


def photo_url(kind: str, n: int = 1) -> str:
    """Store (once) and return the /uploads URL for picture `n` of `kind`."""
    if kind not in KINDS:
        raise KeyError(f"unknown photo kind {kind!r}")
    n = ((n - 1) % VARIANTS) + 1
    name = f"demo_{kind}_{n}.jpg"
    out_dir = Path(settings.UPLOAD_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / name
    if name not in _WRITTEN:  # always refresh once per run, so stale placeholders never linger
        _WRITTEN.add(name)
        src = _real_photo(kind, n)
        img = Image.open(src).convert("RGB") if src else _placeholder(kind, n)
        img.thumbnail((1280, 1280))
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=84, optimize=True)  # re-encoded: no EXIF/GPS, like real uploads
        target.write_bytes(buf.getvalue())
    return f"/uploads/{name}"


def using_real_photos() -> int:
    return len({p.stem.rsplit("_", 1)[0] for p in ASSET_DIR.glob("*") if p.suffix.lower() in _EXT}) if ASSET_DIR.exists() else 0
