#!/usr/bin/env python3
"""Give a clean SVG a hand-drawn look: wobbly edges, line jitter, paper grain.

Usage: python roughen_svg.py in.svg out.svg [--seed 1] [--style ink|pencil|marker|crayon]

Deterministic: the same seed gives the same output. Standard library only.
"""
import argparse
import random
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)

# style -> (wobble scale, wobble frequency, grain opacity, stroke-linecap)
# tuned for a 100-unit drawing; main() rescales to the real size
STYLES = {
    "ink": (3.0, 0.035, 0.10, "round"),
    "pencil": (2.0, 0.050, 0.25, "round"),
    "marker": (4.0, 0.025, 0.00, "round"),
    "crayon": (5.0, 0.060, 0.30, "round"),
}


def drawing_size(root):
    """Short side of the drawing in user units, from viewBox or width/height."""
    vb = root.get("viewBox", "").replace(",", " ").split()
    if len(vb) == 4:
        return min(float(vb[2]), float(vb[3]))
    dims = [root.get(k, "").replace("px", "") for k in ("width", "height")]
    if all(d.replace(".", "", 1).isdigit() for d in dims):
        return min(float(d) for d in dims)
    raise SystemExit("SVG needs a viewBox, or numeric width and height")


def build_defs(seed, scale, freq, grain):
    defs = ET.Element(f"{{{SVG}}}defs")
    wobble = ET.SubElement(defs, f"{{{SVG}}}filter", id="hand-wobble",
                           x="-5%", y="-5%", width="110%", height="110%")
    ET.SubElement(wobble, f"{{{SVG}}}feTurbulence", type="fractalNoise",
                  baseFrequency=str(freq), numOctaves="2", seed=str(seed), result="n")
    ET.SubElement(wobble, f"{{{SVG}}}feDisplacementMap", **{"in": "SourceGraphic"},
                  in2="n", scale=str(scale), xChannelSelector="R", yChannelSelector="G")
    if grain > 0:
        paper = ET.SubElement(defs, f"{{{SVG}}}filter", id="hand-grain",
                              x="0", y="0", width="100%", height="100%")
        ET.SubElement(paper, f"{{{SVG}}}feTurbulence", type="fractalNoise",
                      baseFrequency="0.8", numOctaves="3", seed=str(seed + 7), result="g")
        ET.SubElement(paper, f"{{{SVG}}}feColorMatrix", type="saturate", values="0")
    return defs


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--seed", type=int, default=1)
    p.add_argument("--style", choices=STYLES, default="ink")
    a = p.parse_args()

    scale, freq, grain, cap = STYLES[a.style]
    rng = random.Random(a.seed)
    scale *= 0.85 + rng.random() * 0.3  # per-asset variation

    tree = ET.parse(a.src)
    root = tree.getroot()
    if root.tag != f"{{{SVG}}}svg":
        raise SystemExit("input is not an SVG document")
    # STYLES numbers are tuned for a 100-unit drawing; scale them to this one.
    k = drawing_size(root) / 100.0
    scale *= k
    freq /= k

    children = list(root)
    for c in children:
        root.remove(c)
    root.insert(0, build_defs(a.seed, scale, freq, grain))

    g = ET.SubElement(root, f"{{{SVG}}}g", filter="url(#hand-wobble)",
                      **{"stroke-linecap": cap, "stroke-linejoin": "round"})
    for c in children:
        g.append(c)

    if grain > 0:
        vb = root.get("viewBox", "").replace(",", " ").split()
        if len(vb) != 4:
            w, h = (root.get(k, "").replace("px", "") for k in ("width", "height"))
            if not (w.replace(".", "", 1).isdigit() and h.replace(".", "", 1).isdigit()):
                raise SystemExit("SVG needs a viewBox, or numeric width and height")
            vb = ["0", "0", w, h]
        ET.SubElement(root, f"{{{SVG}}}rect", x=vb[0], y=vb[1], width=vb[2], height=vb[3],
                      filter="url(#hand-grain)", opacity=str(grain),
                      style="mix-blend-mode:multiply;pointer-events:none")

    tree.write(a.dst, encoding="utf-8", xml_declaration=True)
    print(f"wrote {a.dst} (style={a.style}, seed={a.seed})")


if __name__ == "__main__":
    main()
