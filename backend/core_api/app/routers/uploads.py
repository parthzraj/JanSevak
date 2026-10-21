"""Photo upload: the frontend uploads here first, then sends the returned URLs in POST /api/issues."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.services.image_check import InvalidImage, check_and_clean

router = APIRouter(prefix="/uploads", tags=["Uploads"])

_CHUNK = 1024 * 1024


async def save_image(file: UploadFile, strict: bool = False) -> tuple[str, int, str]:
    """Read, validate, clean and store one image. Returns (url, size_bytes, perceptual_hash).

    The upload must be a real, fully decodable image (checked with Pillow, not just the file
    header). It is re-encoded, so EXIF/GPS data and any hidden extra bytes are dropped.
    `strict=True` (used for evidence photos) also rejects tiny or blank pictures.
    Shared by POST /api/uploads and POST /api/issues/{id}/evidence.
    """
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    raw = bytearray()
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        raw.extend(chunk)
        if len(raw) > max_bytes:
            raise HTTPException(status_code=413, detail=f"Image is larger than {settings.MAX_UPLOAD_MB} MB")

    try:
        checked = await run_in_threadpool(check_and_clean, bytes(raw), strict)
    except InvalidImage as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail)

    name = f"{uuid.uuid4().hex}{checked.extension}"
    (upload_dir / name).write_bytes(checked.data)
    return f"/uploads/{name}", len(checked.data), checked.phash


def delete_uploaded(url: str) -> None:
    """Best-effort removal of a stored upload (used when a request fails after saving files)."""
    if url.startswith("/uploads/"):
        (Path(settings.UPLOAD_DIR) / Path(url).name).unlink(missing_ok=True)


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    url, size, _ = await save_image(file)
    return {"url": url, "size_bytes": size}
