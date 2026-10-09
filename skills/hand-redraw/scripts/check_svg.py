#!/usr/bin/env python3
"""Verify redrawn SVGs before they ship.

Usage: python check_svg.py file.svg [more.svg ...] [--max-kb 60]
Exit 0 when every file passes, 1 otherwise. Standard library only.

Fails on: invalid XML, no viewBox, embedded raster (<image>, data:image),
over the size budget, an opaque full-size background rect, scripts or external
references. Warns when the file was not run through roughen_svg.py.
"""
import argparse
import os
import sys
import xml.etree.ElementTree as ET

SVG = "{http://www.w3.org/2000/svg}"


def num(v):
    try:
        return float(str(v).replace("px", "").rstrip("%"))
    except ValueError:
        return None


def check(path, max_kb):
    fails, warns = [], []
    kb = os.path.getsize(path) / 1024
    if kb > max_kb:
        fails.append(f"{kb:.0f} KB over the {max_kb} KB budget")
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as e:
        return [f"invalid XML: {e}"], []
    if root.tag != SVG + "svg":
        return ["root element is not <svg>"], []
    vb = root.get("viewBox", "").replace(",", " ").split()
    if len(vb) != 4:
        fails.append("no viewBox (needed so it scales)")
    for el in root.iter():
        tag = el.tag.replace(SVG, "")
        if tag == "image" or "data:image" in " ".join(str(v) for v in el.attrib.values()):
            fails.append("embeds a raster image: that is the AI art again, not a redraw")
        if tag in ("script", "foreignObject"):
            fails.append(f"<{tag}> is not allowed")
        for k, v in el.attrib.items():
            if k.endswith("href") and not str(v).startswith(("#", "data:image")):
                fails.append(f"external reference {v[:40]}")
    if len(vb) == 4:
        W, H = float(vb[2]), float(vb[3])
        for el in root.iter(SVG + "rect"):
            w, h = num(el.get("width")), num(el.get("height"))
            if w and h and w >= 0.95 * W and h >= 0.95 * H and el.get("fill", "none") not in ("none", "transparent"):
                fails.append("opaque full-size background rect (keep the background transparent)")
    if not any(e.get("id") == "hand-wobble" for e in root.iter()):
        warns.append("not roughened: run scripts/roughen_svg.py on it")
    return fails, warns


def main():
    p = argparse.ArgumentParser()
    p.add_argument("files", nargs="+")
    p.add_argument("--max-kb", type=float, default=60)
    a = p.parse_args()
    bad = 0
    for f in a.files:
        fails, warns = check(f, a.max_kb)
        status = "FAIL" if fails else "ok  "
        print(f"{status} {f}")
        for m in fails:
            print(f"     - {m}")
        for m in warns:
            print(f"     ~ {m}")
        bad += bool(fails)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
