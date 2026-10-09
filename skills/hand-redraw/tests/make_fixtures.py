#!/usr/bin/env python3
"""Generate a labelled fixture set for scan_assets.py.

Usage: python make_fixtures.py OUTDIR
Writes OUTDIR/positive/*.png (metadata cases expect suspect, pixel-only cases expect review) and OUTDIR/negative/*.png
(should triage clean) and OUTDIR/labels.json. Needs Pillow and numpy. Deterministic.

The positives are SYNTHETIC stand-ins for AI-style renders (glossy shading, mesh
gradients, soft 3D), not real model output; see RESULTS.md for what that means.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from PIL.PngImagePlugin import PngInfo

rng = np.random.default_rng(7)
W = H = 512


def save(arr, path, info=None):
    img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))
    img.save(path, pnginfo=info)


def grid():
    y, x = np.mgrid[0:H, 0:W].astype("float32")
    return x / W, y / H


def glossy_sphere():
    x, y = grid()
    bg = np.stack([200 - 60 * y, 190 - 40 * y, 255 - 80 * y], -1)
    r = np.hypot(x - 0.5, y - 0.5)
    inside = (r < 0.32)[..., None]
    shade = np.clip(1 - r / 0.32, 0, 1)[..., None]
    spec = np.exp(-(np.hypot(x - 0.42, y - 0.4) / 0.07) ** 2)[..., None]
    sphere = np.array([255, 90, 160]) * (0.45 + 0.55 * shade) + 255 * spec * 0.9
    return np.where(inside, sphere, bg)


def mesh_gradient():
    x, y = grid()
    out = np.zeros((H, W, 3), "float32")
    for cx, cy, col in [(0.2, 0.2, (255, 80, 120)), (0.8, 0.3, (90, 80, 255)),
                        (0.5, 0.85, (60, 220, 200)), (0.9, 0.9, (255, 200, 80))]:
        w = np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / 0.12)[..., None]
        out += w * np.array(col)
    return out / np.maximum(1e-3, np.sum([np.exp(-((x - a) ** 2 + (y - b) ** 2) / 0.12)
                                          for a, b in [(0.2, 0.2), (0.8, 0.3), (0.5, 0.85), (0.9, 0.9)]], 0))[..., None]


def glass_blob():
    img = Image.new("RGB", (W, H), (30, 20, 60))
    d = ImageDraw.Draw(img)
    for i, c in enumerate([(120, 80, 255), (255, 90, 200), (90, 220, 255)]):
        d.ellipse([60 + 70 * i, 90 + 40 * i, 330 + 70 * i, 360 + 40 * i], fill=c)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(38)), dtype="float32")


def plastic_icons():
    img = Image.new("RGB", (W, H), (240, 242, 250))
    d = ImageDraw.Draw(img)
    for i in range(3):
        d.rounded_rectangle([40 + 160 * i, 150, 150 + 160 * i, 260], 28, fill=(110 + 40 * i, 90, 255 - 50 * i))
    arr = np.asarray(img.filter(ImageFilter.GaussianBlur(5)), dtype="float32")
    x, y = grid()
    return arr * (0.85 + 0.15 * y[..., None])


def soft_3d_scene():
    x, y = grid()
    floor = np.stack([225 - 40 * y, 215 - 30 * y, 235 - 20 * y], -1)
    box = ((x > 0.3) & (x < 0.7) & (y > 0.3) & (y < 0.7))[..., None]
    shade = (0.6 + 0.4 * (1 - x))[..., None]
    shadow = np.exp(-((x - 0.55) ** 2 + (y - 0.78) ** 2) / 0.02)[..., None]
    return np.where(box, np.array([255, 140, 80]) * shade, floor * (1 - 0.35 * shadow))


def flat_logo():
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    d.ellipse([150, 150, 360, 360], fill=(255, 90, 20))
    d.rectangle([230, 60, 280, 200], fill=(20, 20, 20))
    return np.asarray(img, dtype="float32")


def photo_like():
    x, y = grid()
    base = np.stack([120 + 80 * np.sin(6 * x + y), 110 + 70 * np.cos(5 * y), 90 + 60 * x], -1)
    return base + rng.normal(0, 5, base.shape)


def paper_scan():
    base = np.full((H, W, 3), (222, 205, 170), "float32")
    noise = rng.normal(0, 9, (H, W, 1))
    fibers = np.asarray(Image.fromarray(rng.integers(0, 255, (H, W), dtype="uint8")).filter(
        ImageFilter.GaussianBlur(1.2)), "float32")[..., None] - 128
    return base + noise + fibers * 0.25


def screenshot_like():
    img = Image.new("RGB", (W, H), (250, 250, 250))
    d = ImageDraw.Draw(img)
    for i in range(14):
        d.rectangle([30, 30 + 32 * i, 30 + int(rng.integers(120, 440)), 46 + 32 * i], fill=(60, 60, 70))
    return np.asarray(img, dtype="float32")


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "fixtures"
    labels = {}
    for kind in ("positive", "negative"):
        os.makedirs(os.path.join(out, kind), exist_ok=True)

    def put(kind, name, arr, info=None, expect=None):
        path = os.path.join(out, kind, name)
        save(arr, path, info)
        labels[f"{kind}/{name}"] = expect or ("review" if kind == "positive" else "clean")

    put("positive", "glossy-sphere.png", glossy_sphere())
    put("positive", "mesh-gradient.png", mesh_gradient())
    put("positive", "glass-blob.png", glass_blob())
    put("positive", "plastic-icons.png", plastic_icons())
    put("positive", "soft-3d-scene.png", soft_3d_scene())
    # metadata cases: noisy image but an AI text chunk / content credentials => still suspect
    info = PngInfo()
    info.add_text("parameters", "a cozy workshop, 8k, masterpiece\nNegative prompt: blurry\nSteps: 30, Sampler: Euler a")
    put("positive", "noisy-with-sd-metadata.png", photo_like(), info, expect="suspect")
    info = PngInfo()
    info.add_text("Comment", "c2pa manifest JUMBF")
    put("positive", "noisy-with-c2pa-marker.png", photo_like(), info, expect="suspect")

    put("negative", "flat-logo.png", flat_logo())
    put("negative", "photo-like.png", photo_like())
    put("negative", "paper-scan.png", paper_scan())
    put("negative", "screenshot.png", screenshot_like())
    # weak signal only (AI-typical size, noisy content): expected `review`, not suspect
    big = np.asarray(Image.fromarray(np.clip(photo_like(), 0, 255).astype("uint8")).resize((1024, 1024)), "float32")
    put("negative", "photo-1024x1024.png", big + rng.normal(0, 4, big.shape), expect="review")
    with open(os.path.join(out, "labels.json"), "w") as f:
        json.dump(labels, f, indent=1)
    print(f"wrote {len(labels)} fixtures to {out}")


if __name__ == "__main__":
    main()
