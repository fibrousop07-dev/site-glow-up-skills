#!/usr/bin/env python3
"""Triage image files for AI-generation signals. Reports signals, never the verdict.

Usage: python scan_assets.py PATH [PATH ...] [--json] [--min-kb 0]

PATH is an image file or a folder (searched recursively). Reads:
  metadata  (standard library): PNG text chunks (parameters/prompt/workflow), C2PA /
            Content Credentials markers, IPTC "trainedAlgorithmicMedia", generator names,
            AI-typical filenames and exact AI-typical pixel sizes.
  pixels    (needs Pillow + numpy, skipped if missing): sensor/scan noise level and how
            much of the image is smooth non-flat gradient (gloss, mesh gradients, 3D renders).

Result per file: `suspect` (strong metadata such as C2PA or a prompt chunk), `review` (a
noise-free soft-gradient signature or weak signals; look at it), or `clean`. Metadata proves nothing when absent (it is easy to
strip) and pixel statistics are a heuristic: a human must still look at `suspect` and
`review` files, and photos, logos and scanned textures stay `keep` regardless.
"""
import argparse
import json
import os
import re
import struct
import sys

EXT = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"}
NAME_RE = re.compile(r"(chatgpt|dall[-_ ]?e|midjourney|\bmj[_-]|gemini|firefly|stable[-_ ]?diffusion|"
                     r"\bsdxl?\b|leonardo|ideogram|flux|higgsfield|imagen|generated|ai[-_ ]?(art|image|gen))", re.I)
STRONG_BYTES = [  # (marker, label)
    (b"c2pa", "C2PA / Content Credentials"),
    (b"jumbf", "JUMBF manifest"),
    (b"trainedAlgorithmicMedia", "IPTC digital source type: AI-generated"),
    (b"compositeWithTrainedAlgorithmicMedia", "IPTC digital source type: AI-composite"),
    (b"Made with Google AI", "Google AI label"),
    (b"Stable Diffusion", "Stable Diffusion"),
    (b"Midjourney", "Midjourney"),
    (b"DALL-E", "DALL-E"),
    (b"DALL\xc2\xb7E", "DALL-E"),
    (b"Adobe Firefly", "Adobe Firefly"),
]
PNG_AI_KEYS = {"parameters", "prompt", "workflow", "invokeai_metadata", "sd-metadata", "negative_prompt"}
AI_SIZES = {(1024, 1024), (1024, 1792), (1792, 1024), (1536, 1024), (1024, 1536), (1344, 768), (768, 1344),
            (1152, 896), (896, 1152), (1216, 832), (832, 1216), (1664, 928), (928, 1664), (2048, 2048)}


def png_text_keys(data):
    keys, pos = set(), 8
    while pos + 8 <= len(data):
        n, typ = struct.unpack(">I4s", data[pos:pos + 8])
        if typ in (b"tEXt", b"iTXt", b"zTXt"):
            keys.add(data[pos + 8:pos + 8 + min(n, 80)].split(b"\x00")[0].decode("latin1").lower())
        if typ == b"IEND":
            break
        pos += 12 + n
    return keys


def image_size(data, path):
    try:
        from PIL import Image
        with Image.open(path) as im:
            return im.size
    except Exception:
        pass
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    return None


def metadata_signals(path, data):
    strong, weak = [], []
    if NAME_RE.search(os.path.basename(path)):
        weak.append("AI-like filename")
    for marker, label in STRONG_BYTES:
        if marker in data:
            strong.append(label)
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        hit = png_text_keys(data) & PNG_AI_KEYS
        if hit:
            strong.append("PNG text chunk: " + ",".join(sorted(hit)))
    size = image_size(data, path)
    if size and tuple(size) in AI_SIZES:
        weak.append(f"AI-typical size {size[0]}x{size[1]}")
    return sorted(set(strong)), weak, size


def pixel_stats(path):
    """(noise, gradient_area) or None.
    noise: mean |gray - 3x3 median| on native-resolution 192px crops (max of three), so scan
    grain and sensor noise are not averaged away by downscaling. gradient_area: share of a
    512px thumbnail whose smoothed gradient is small but not flat (soft shading, gloss)."""
    try:
        import numpy as np
        from PIL import Image
        from scipy.ndimage import median_filter, uniform_filter
    except Exception:
        return None
    try:
        with Image.open(path) as im:
            im = im.convert("L")
            g = np.asarray(im, dtype=np.float32)
            thumb = im.copy()
    except Exception:
        return None
    h, w = g.shape
    cs = min(192, h, w)
    noise = 0.0
    for y, x in (((h - cs) // 2, (w - cs) // 2), (0, 0), (h - cs, w - cs)):
        c = g[y:y + cs, x:x + cs]
        noise = max(noise, float(np.abs(c - median_filter(c, size=3)).mean()))
    thumb.thumbnail((512, 512))
    s = uniform_filter(np.asarray(thumb, dtype=np.float32), size=5)
    gy, gx = np.gradient(s)
    mag = np.hypot(gx, gy)
    area = float(np.mean((mag > 0.08) & (mag < 2.0)))
    return round(noise, 2), round(area, 3)


# Thresholds set on the labelled fixtures plus real site textures (tests/RESULTS.md).
NOISE_MAX, AREA_MIN = 0.3, 0.2
PIXEL_MIN_KB = 12  # tiny tiles carry too little information to judge


def classify(strong, weak, stats):
    reasons = list(strong)
    smooth = bool(stats and stats[0] <= NOISE_MAX and stats[1] >= AREA_MIN)
    if smooth:
        reasons.append(f"noise-free soft-gradient render (noise {stats[0]}, soft-gradient area {stats[1]})")
    if strong:
        return "suspect", reasons + weak
    if smooth or weak:
        return "review", reasons + weak
    return "clean", []


def scan(path, min_kb):
    with open(path, "rb") as f:
        data = f.read()
    if len(data) / 1024 < min_kb:
        return None
    strong, weak, size = metadata_signals(path, data)
    if len(data) / 1024 < PIXEL_MIN_KB:  # a tiny tile says nothing about how it was made
        weak = [w for w in weak if not w.startswith("AI-typical size")]
    stats = pixel_stats(path) if len(data) / 1024 >= PIXEL_MIN_KB else None
    verdict, reasons = classify(strong, weak, stats)
    return {"file": path, "size": list(size) if size else None, "kb": round(len(data) / 1024),
            "noise": stats[0] if stats else None, "gradient_area": stats[1] if stats else None,
            "triage": verdict, "reasons": reasons}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("paths", nargs="+")
    p.add_argument("--json", action="store_true")
    p.add_argument("--min-kb", type=float, default=0, help="ignore files smaller than this")
    a = p.parse_args()
    files = []
    for x in a.paths:
        if os.path.isdir(x):
            for d, _, fs in os.walk(x):
                files += [os.path.join(d, f) for f in sorted(fs) if os.path.splitext(f)[1].lower() in EXT]
        elif os.path.isfile(x):
            files.append(x)
        else:
            sys.exit(f"not found: {x}")
    rows = [r for r in (scan(f, a.min_kb) for f in files) if r]
    if a.json:
        print(json.dumps(rows, indent=1))
        return
    if not rows:
        print("no raster images found")
        return
    if rows[0]["noise"] is None:
        print("(pixel statistics skipped: install Pillow, numpy and scipy to enable them)")
    for r in rows:
        dims = "x".join(map(str, r["size"])) if r["size"] else "?"
        print(f"{r['triage']:8} {r['file']}  [{dims}, {r['kb']} KB]")
        for why in r["reasons"]:
            print(f"           - {why}")


if __name__ == "__main__":
    main()
