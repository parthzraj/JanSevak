"""Photo upload: the frontend uploads here first, then sends the returned URLs in POST /api/issues."""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])

_CHUNK = 1024 * 1024


def _detect_extension(head: bytes) -> str | None:
    """Trust the file's magic bytes, not the client-supplied name or content-type."""
    if head.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    if head[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    return None


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    first = await file.read(_CHUNK)
    ext = _detect_extension(first)
    if ext is None:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, WEBP or GIF images are allowed")

    name = f"{uuid.uuid4().hex}{ext}"
    path = upload_dir / name
    size = 0
    try:
        with open(path, "wb") as out:
            chunk = first
            while chunk:
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(status_code=413, detail=f"Image is larger than {settings.MAX_UPLOAD_MB} MB")
                out.write(chunk)
                chunk = await file.read(_CHUNK)
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    return {"url": f"/uploads/{name}", "size_bytes": size}
