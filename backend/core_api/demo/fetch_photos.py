"""Download real, freely licensed photos for the demo reports from Wikimedia Commons (no account, no key, no cost).

    python -m demo.fetch_photos                 # fetch 3 pictures for every kind that has none yet
    python -m demo.fetch_photos --only pothole  # just one kind
    python -m demo.fetch_photos --redo pothole  # throw away that kind's pictures and fetch again

Pictures land in demo_assets/photos/<kind>_<n>.jpg. Open demo_assets/photos/index.html afterwards to look at them.
Delete any picture you do not like and run the command again: only the missing ones are fetched.
You can also drop your own photos into that folder using the same names (pothole_1.jpg, garbage_2.jpg ...).
Credits for every picture are written to demo_assets/photos/CREDITS.md (Commons licences ask for them).
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from demo.photo_kinds import KINDS, VARIANTS

API = "https://commons.wikimedia.org/w/api.php"
OUT = Path(__file__).resolve().parent.parent / "demo_assets" / "photos"
UA = "JanSevakDemoData/1.0 (student project; fetches a few CC photos for a demo)"
BAD_WORDS = re.compile(r"(map|diagram|logo|icon|flag|poster|drawing|painting|cartoon|screenshot|chart|stamp|coat of arms|\bsvg\b)", re.I)
OK_LICENCE = re.compile(r"^(CC[ -]|Public domain|PD|Attribution)", re.I)


def http_get(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def search(query: str, get=http_get) -> list[dict]:
    """Candidate photos for a query: big enough, landscape-ish, real photographs, with a usable licence."""
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
        "gsrsearch": f"{query} filetype:bitmap", "gsrlimit": "25", "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1280",
    }
    data = json.loads(get(API + "?" + urllib.parse.urlencode(params)))
    out = []
    for page in (data.get("query", {}).get("pages", {}) or {}).values():
        info = (page.get("imageinfo") or [{}])[0]
        title = page.get("title", "")
        w, h = info.get("width", 0), info.get("height", 0)
        meta = info.get("extmetadata", {})
        licence = (meta.get("LicenseShortName", {}) or {}).get("value", "")
        if info.get("mime") != "image/jpeg" or BAD_WORDS.search(title) or not OK_LICENCE.search(licence):
            continue
        if w < 1000 or h < 650 or not (1.1 <= w / h <= 1.9):
            continue
        author = re.sub(r"<[^>]+>", "", (meta.get("Artist", {}) or {}).get("value", "unknown"))
        out.append({
            "title": title, "url": info.get("thumburl") or info.get("url"), "page": info.get("descriptionurl", ""),
            "licence": licence, "author": html.unescape(author).strip() or "unknown", "size": w * h,
        })
    return sorted(out, key=lambda c: -c["size"])


def fetch_kind(kind: str, per_kind: int, get=http_get, pause: float = 1.0) -> list[dict]:
    OUT.mkdir(parents=True, exist_ok=True)
    have = {int(p.stem.rsplit("_", 1)[1]) for p in OUT.glob(f"{kind}_*.jpg") if p.stem.rsplit("_", 1)[1].isdigit()}
    needed = [n for n in range(1, per_kind + 1) if n not in have]
    if not needed:
        return []
    seen: set[str] = set()
    credits: list[dict] = []
    for query in KINDS[kind][2]:
        if not needed:
            break
        try:
            cands = search(query, get)
        except Exception as exc:  # network hiccup: try the next query
            print(f"    search failed for '{query}': {exc}")
            continue
        for cand in cands:
            if not needed:
                break
            if cand["title"] in seen:
                continue
            seen.add(cand["title"])
            try:
                data = get(cand["url"])
            except Exception as exc:
                print(f"    download failed: {exc}")
                continue
            n = needed.pop(0)
            (OUT / f"{kind}_{n}.jpg").write_bytes(data)
            cand["file"] = f"{kind}_{n}.jpg"
            credits.append(cand)
            time.sleep(pause)
    return credits


def main(argv: list[str] | None = None, get=http_get) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="fetch just this kind")
    ap.add_argument("--redo", help="delete this kind's pictures first, then fetch")
    ap.add_argument("--per-kind", type=int, default=VARIANTS)
    args = ap.parse_args(argv)
    kinds = [args.only or args.redo] if (args.only or args.redo) else list(KINDS)
    for k in kinds:
        if k not in KINDS:
            print(f"Unknown kind '{k}'. Choose from: {', '.join(KINDS)}")
            return 2
    OUT.mkdir(parents=True, exist_ok=True)
    if args.redo:
        for p in OUT.glob(f"{args.redo}_*.jpg"):
            p.unlink()
    credits_file = OUT / "credits.json"
    credits = json.loads(credits_file.read_text("utf-8")) if credits_file.exists() else {}
    for kind in kinds:
        print(f"- {KINDS[kind][0]} ({kind})")
        got = fetch_kind(kind, args.per_kind, get)
        for c in got:
            credits[c["file"]] = {k: c[k] for k in ("title", "author", "licence", "page")}
        print(f"    {len(got)} new picture(s)")
    credits_file.write_text(json.dumps(credits, indent=1), "utf-8")
    lines = ["# Photo credits", "", "Pictures from Wikimedia Commons, used under the licence shown. Keep this file with the demo.", ""]
    for f, c in sorted(credits.items()):
        if (OUT / f).exists():
            lines.append(f"- `{f}`: {c['title']} by {c['author']} ({c['licence']}). {c['page']}")
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n", "utf-8")
    cells = "".join(
        f'<figure><img src="{p.name}" loading="lazy"><figcaption>{p.name}</figcaption></figure>'
        for p in sorted(OUT.glob("*.jpg"))
    )
    (OUT / "index.html").write_text(
        "<!doctype html><meta charset=utf-8><title>Demo photos</title><style>body{font:14px system-ui;margin:16px;display:flex;"
        "flex-wrap:wrap;gap:12px}figure{margin:0;width:260px}img{width:260px;height:170px;object-fit:cover;border-radius:8px}"
        "figcaption{padding:4px 0}</style>" + cells,
        "utf-8",
    )
    missing = [k for k in KINDS if not list(OUT.glob(f"{k}_*.jpg"))]
    if missing:
        print("\nNo picture found for:", ", ".join(missing), "(placeholders will be used; add your own photos or re-run later)")
    print(f"\nDone. Look through {OUT / 'index.html'} and delete any picture you do not like, then run this again.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
