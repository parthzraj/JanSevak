"""The kinds of photos the demo reports use, and what to search for when fetching real ones.

`before` kinds are problems, `after` kinds are the fixed result shown in Impact Reels.
Real pictures are found by fetch_photos.py (Wikimedia Commons, free, no key). Anything missing gets a clearly
labelled placeholder picture instead, so the app never shows a broken image.
"""

# kind -> (label, (r, g, b) accent colour for the placeholder, [Commons search queries, best first])
KINDS: dict[str, tuple[str, tuple[int, int, int], list[str]]] = {
    "pothole": ("Pothole", (82, 82, 91), ["pothole road india", "pothole on road", "potholes street damaged asphalt"]),
    "garbage": ("Garbage pile", (120, 113, 108), ["garbage pile street india", "overflowing garbage bin street", "waste dump roadside india"]),
    "streetlight": ("Street light", (30, 41, 82), ["broken street light pole", "street light off night street india", "damaged street lamp"]),
    "waterlog": ("Waterlogged road", (37, 99, 160), ["waterlogged road india", "flooded street monsoon india", "water logging road rain"]),
    "pipeleak": ("Pipe leak", (14, 116, 144), ["water pipe leak road", "burst water pipe street", "leaking water pipeline road"]),
    "tree": ("Fallen tree", (21, 94, 62), ["fallen tree blocking road", "tree fallen on road storm", "uprooted tree street"]),
    "bench": ("Broken bench", (146, 98, 52), ["broken park bench", "damaged bench park", "vandalized park bench"]),
    "drain": ("Blocked drain", (71, 85, 105), ["clogged storm drain street", "blocked drain garbage", "choked drain waste road india"]),
    "sewage": ("Sewage overflow", (101, 90, 52), ["sewage overflow street", "open sewage drain street india", "manhole overflowing sewage"]),
    "footpath": ("Broken footpath", (120, 100, 85), ["broken footpath pavement india", "damaged pavement sidewalk", "footpath encroachment street india"]),
    "manhole": ("Open manhole", (60, 60, 70), ["open manhole street", "missing manhole cover road", "uncovered manhole road"]),
    "park": ("Park litter", (34, 120, 70), ["litter in park", "garbage park lawn", "dirty public park india"]),
    "cleanup": ("Community clean-up", (22, 128, 98), ["community cleanup volunteers india", "volunteers cleaning lake india", "beach cleanup volunteers"]),
    # ---- results (Impact Reels "after" photos)
    "after_road": ("Road repaired", (63, 63, 70), ["freshly paved road india", "newly asphalted road", "road resurfacing finished"]),
    "after_clean": ("Street cleaned", (60, 120, 90), ["clean street india", "clean street pavement tidy", "swept street clean"]),
    "after_light": ("Light fixed", (40, 52, 110), ["street lights at night india", "led street light night road", "lit road night street"]),
    "after_drain": ("Drain cleared", (60, 100, 140), ["stormwater drain cleaned", "clean storm drain channel", "cleaned drain street"]),
    "after_bench": ("Bench repaired", (150, 110, 60), ["park bench new wooden", "park bench in garden", "wooden bench park clean"]),
    "after_pipe": ("Pipe repaired", (20, 120, 150), ["road repaired after pipe repair", "pipeline repair finished road", "repaired road patch"]),
    "after_tree": ("Road cleared", (30, 110, 70), ["clear road after tree removal", "tree trimming road cleared", "pruned trees street"]),
}

VARIANTS = 6  # how many different pictures to keep per kind
