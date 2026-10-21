"""Video links accepted in Civic Academy lessons: YouTube (embedded) or a direct .mp4/.webm/.ogv file."""
import re
from urllib.parse import parse_qs, urlparse

_YT_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"}
_YT_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_FILE_EXT = (".mp4", ".webm", ".ogv", ".m4v")


def parse_video_url(url: str) -> tuple[str, str]:
    """Return ("youtube", video_id) or ("file", url). Raises ValueError with a message fit for the NGO."""
    url = (url or "").strip()
    if not url:
        raise ValueError("Add a video link")
    if url.startswith("/uploads/") and url.lower().split("?")[0].endswith(_FILE_EXT):
        return "file", url
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("The video link must start with https://")
    host = parsed.netloc.lower()
    if host in _YT_HOSTS:
        vid = None
        if host == "youtu.be":
            vid = parsed.path.strip("/").split("/")[0]
        elif parsed.path == "/watch":
            vid = (parse_qs(parsed.query).get("v") or [None])[0]
        else:
            parts = [p for p in parsed.path.split("/") if p]
            if len(parts) >= 2 and parts[0] in ("embed", "shorts", "live", "v"):
                vid = parts[1]
        if vid and _YT_ID.match(vid):
            return "youtube", vid
        raise ValueError("That YouTube link does not point to a single video")
    if parsed.path.lower().endswith(_FILE_EXT):
        return "file", url
    raise ValueError("Use a YouTube link or a direct link to an .mp4 / .webm file")
