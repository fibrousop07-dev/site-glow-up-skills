#!/usr/bin/env python3
"""Give a clean SVG a hand-drawn look: wobbly edges and paper-style grain.

Usage: python roughen_svg.py in.svg out.svg [--seed 1] [--style ink|pencil|marker|crayon] [--echo]

--echo adds a faint second outline pass, offset and wobbled differently, like a
re-traced pen line.

Deterministic: the same seed gives the same output. Standard library only.
The drawing's background stays transparent: grain is clipped to the shapes.
"""
import argparse
import copy
import os
import random
import xml.etree.ElementTree as ET

SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)

# style -> (wobble scale, wobble frequency, grain strength, stroke-linecap)
# tuned for a 100-unit drawing; main() rescales to the real size
STYLES = {
    "ink": (3.0, 0.035, 0.30, "round"),
    "pencil": (2.0, 0.050, 0.60, "round"),
    "marker": (4.0, 0.025, 0.00, "round"),
    "crayon": (5.0, 0.060, 0.80, "round"),
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


def build_echo_filter(defs, seed, scale, freq):
    flt = ET.SubElement(defs, f"{{{SVG}}}filter", id="hand-echo-f",
                        x="-5%", y="-5%", width="110%", height="110%")
    ET.SubElement(flt, f"{{{SVG}}}feTurbulence", type="fractalNoise", baseFrequency=str(freq * 1.4),
                  numOctaves="2", seed=str(seed + 31), result="n")
    ET.SubElement(flt, f"{{{SVG}}}feDisplacementMap", **{"in": "SourceGraphic"}, in2="n",
                  scale=str(scale * 1.3), xChannelSelector="G", yChannelSelector="R")


def build_filter(seed, scale, freq, grain, k):
    """One filter: displace the shapes, then speckle grain inside them."""
    f = lambda tag, **kw: ET.Element(f"{{{SVG}}}{tag}", **kw)
    defs = f("defs")
    flt = ET.SubElement(defs, f"{{{SVG}}}filter", id="hand-wobble",
                        x="-5%", y="-5%", width="110%", height="110%")
    sub = lambda tag, **kw: ET.SubElement(flt, f"{{{SVG}}}{tag}", **kw)
    sub("feTurbulence", type="fractalNoise", baseFrequency=str(freq),
        numOctaves="2", seed=str(seed), result="n")
    sub("feDisplacementMap", **{"in": "SourceGraphic"}, in2="n", scale=str(scale),
        xChannelSelector="R", yChannelSelector="G", result="d")
    if grain > 0:
        sub("feTurbulence", type="fractalNoise", baseFrequency=str(0.8 / k),
            numOctaves="3", seed=str(seed + 7), result="g")
        # black speckle, alpha taken from the noise, strength = grain
        sub("feColorMatrix", **{"in": "g"}, type="matrix", result="gm",
            values=f"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  {grain} 0 0 0 0")
        sub("feComposite", **{"in": "gm"}, in2="d", operator="in", result="gc")
        merge = sub("feMerge")
        ET.SubElement(merge, f"{{{SVG}}}feMergeNode", **{"in": "d"})
        ET.SubElement(merge, f"{{{SVG}}}feMergeNode", **{"in": "gc"})
    return defs


def main():
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dst")
    p.add_argument("--seed", type=int, default=1)
    p.add_argument("--style", choices=STYLES, default="ink")
    p.add_argument("--echo", action="store_true", help="add a faint second outline pass")
    a = p.parse_args()

    scale, freq, grain, cap = STYLES[a.style]
    rng = random.Random(a.seed)
    scale *= 0.85 + rng.random() * 0.3  # per-asset variation

    tree = ET.parse(a.src)
    root = tree.getroot()
    if root.tag != f"{{{SVG}}}svg":
        raise SystemExit("input is not an SVG document")
    if any(el.get("id") == "hand-wobble" for el in root.iter()):
        raise SystemExit("already roughened: run it on the clean source SVG")
    # STYLES numbers are tuned for a 100-unit drawing; scale them to this one.
    k = drawing_size(root) / 100.0
    scale *= k
    freq /= k

    children = list(root)
    for c in children:
        root.remove(c)
    root.insert(0, build_filter(a.seed, scale, freq, grain, k))

    g = ET.SubElement(root, f"{{{SVG}}}g", filter="url(#hand-wobble)",
                      **{"stroke-linecap": cap, "stroke-linejoin": "round"})
    for c in children:
        g.append(c)

    if a.echo:
        defs = root[0]
        build_echo_filter(defs, a.seed, scale, freq)
        style = ET.Element(f"{{{SVG}}}style")
        style.text = "#hand-echo *{fill:none !important;stroke-width:1.2px !important}"
        defs.append(style)
        e = ET.SubElement(root, f"{{{SVG}}}g", id="hand-echo", filter="url(#hand-echo-f)",
                          opacity="0.6", transform=f"translate({2.2 * k:.2f} {-1.8 * k:.2f})",
                          **{"stroke-linecap": cap, "stroke-linejoin": "round"})
        for c in children:
            e.append(copy.deepcopy(c))

    os.makedirs(os.path.dirname(os.path.abspath(a.dst)), exist_ok=True)
    tree.write(a.dst, encoding="utf-8", xml_declaration=True)
    print(f"wrote {a.dst} (style={a.style}, seed={a.seed})")


if __name__ == "__main__":
    main()
