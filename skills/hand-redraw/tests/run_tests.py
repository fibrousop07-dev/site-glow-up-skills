#!/usr/bin/env python3
"""Self-test for hand-redraw's scripts. Usage: python run_tests.py   (needs Pillow, numpy, scipy)

Generates the labelled fixtures, runs scan_assets.py and checks every triage label, then
checks roughen_svg.py and check_svg.py on good and bad SVGs. Prints a summary; exit 1 on any failure.
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, "..", "scripts")
PY = [sys.executable, "-I"]
fails = []


def run(*args):
    return subprocess.run(PY + list(args), capture_output=True, text=True)


def expect(name, ok):
    print(("ok    " if ok else "FAIL  ") + name)
    if not ok:
        fails.append(name)


with tempfile.TemporaryDirectory() as t:
    fx = os.path.join(t, "fx")
    expect("fixtures generate", run(os.path.join(HERE, "make_fixtures.py"), fx).returncode == 0)
    labels = json.load(open(os.path.join(fx, "labels.json")))
    rows = json.loads(run(os.path.join(S, "scan_assets.py"), fx, "--json").stdout)
    got = {"/".join(r["file"].replace("\\", "/").split("/")[-2:]): r["triage"] for r in rows}
    for k, want in labels.items():
        expect(f"scan {k} -> {want} (got {got.get(k)})", got.get(k) == want)

    clean = os.path.join(HERE, "..", "examples", "wrench-clean.svg")
    out = os.path.join(t, "o", "w.svg")
    expect("roughen writes output (creates folder)", run(os.path.join(S, "roughen_svg.py"), clean, out, "--seed", "3", "--echo").returncode == 0)
    out2 = os.path.join(t, "o", "w2.svg")
    run(os.path.join(S, "roughen_svg.py"), clean, out2, "--seed", "3", "--echo")
    expect("roughen deterministic", open(out, "rb").read() == open(out2, "rb").read())
    expect("roughen refuses its own output", run(os.path.join(S, "roughen_svg.py"), out, os.path.join(t, "x.svg")).returncode == 1)
    expect("check passes roughened", run(os.path.join(S, "check_svg.py"), out).returncode == 0)
    expect("strict fails unroughened", run(os.path.join(S, "check_svg.py"), clean, "--strict").returncode == 1)
    bad = {
        "raster": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><image href="data:image/png;base64,AA"/></svg>',
        "bg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/></svg>',
        "script": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><script>1</script></svg>',
        "noviewbox": '<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>',
        "xml": "<svg",
    }
    for name, body in bad.items():
        f = os.path.join(t, name + ".svg")
        open(f, "w").write(body)
        expect(f"check rejects {name}", run(os.path.join(S, "check_svg.py"), f).returncode == 1)

print(f"\n{'all tests passed' if not fails else str(len(fails)) + ' test(s) failed'}")
sys.exit(1 if fails else 0)
