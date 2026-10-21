"""Server-side image validation: decode it for real, clean it, and fingerprint it.

* The file must fully decode with Pillow (a header with garbage behind it is rejected).
* The image is re-encoded, which drops EXIF (GPS position, phone model), any hidden appended data,
  and animation; the stored file is always a plain JPEG or PNG.
* A 64-bit perceptual hash (dHash) is returned so the same photo can't be reused as evidence.
"""
import io
from dataclasses import dataclass

from PIL import Image, ImageOps, ImageStat, UnidentifiedImageError

Image.MAX_IMAGE_PIXELS = 50_000_000  # decompression-bomb guard (Pillow raises above 2x this)

MAX_SIDE = 2560  # larger photos are scaled down to save disk space
MIN_SIDE_STRICT = 100  # evidence photos smaller than this are not real photos of a site
MIN_STDDEV_STRICT = 4.0  # an almost single-colour picture (blank wall, black screen) is rejected
HASH_DISTANCE_LIMIT = 5  # bits that may differ for two photos to count as "the same picture"


class InvalidImage(Exception):
    def __init__(self, detail: str, status_code: int = 422):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass
class CheckedImage:
    data: bytes
    extension: str
    phash: str  # 16 hex chars


def dhash(img: Image.Image) -> str:
    small = img.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    px = list(small.tobytes())  # "L" mode: one byte per pixel
    bits = 0
    for row in range(8):
        for col in range(8):
            bits = (bits << 1) | (1 if px[row * 9 + col] > px[row * 9 + col + 1] else 0)
    return f"{bits:016x}"


def hash_distance(a: str, b: str) -> int:
    return bin(int(a, 16) ^ int(b, 16)).count("1")


def check_and_clean(raw: bytes, strict: bool = False) -> CheckedImage:
    try:
        probe = Image.open(io.BytesIO(raw))
        probe.verify()  # structural check
        img = Image.open(io.BytesIO(raw))
        img.load()  # full decode: catches truncated / corrupt pixel data
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError, EOFError):
        raise InvalidImage("This file is not a valid, readable image")

    if img.format not in ("JPEG", "PNG", "WEBP", "GIF"):
        raise InvalidImage("Only JPEG, PNG, WEBP or GIF images are allowed", 415)

    img = ImageOps.exif_transpose(img)  # respect phone rotation before the EXIF is dropped
    if min(img.size) < (MIN_SIDE_STRICT if strict else 8):
        raise InvalidImage("This image is too small to be a useful photo")

    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    if strict:
        probe_rgb = img.convert("RGB")
        if max(ImageStat.Stat(probe_rgb).stddev) < MIN_STDDEV_STRICT:
            raise InvalidImage("This image looks blank. Please take a clear photo of the issue")

    if max(img.size) > MAX_SIDE:
        img.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    if has_alpha:
        img.convert("RGBA").save(out, format="PNG", optimize=True)
        ext = ".png"
    else:
        img.convert("RGB").save(out, format="JPEG", quality=88, optimize=True)
        ext = ".jpg"
    return CheckedImage(data=out.getvalue(), extension=ext, phash=dhash(img))
