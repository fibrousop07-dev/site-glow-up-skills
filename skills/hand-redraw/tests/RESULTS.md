# What the tests measured (2026-10-10)

`python -I tests/run_tests.py` generates labelled fixtures and checks every script. 22 checks pass.

## scan_assets.py
| Set | n | Result |
|---|---|---|
| Synthetic AI-style renders (gloss, mesh gradient, glass, plastic icons, soft 3D) | 5 | 5 `review` (noise-free soft gradients) |
| Noisy images carrying a prompt chunk or a C2PA marker | 2 | 2 `suspect` |
| Synthetic negatives (flat logo, noisy photo-like, paper scan, screenshot) | 4 | 4 `clean` |
| AI-typical size only (weak signal) | 1 | 1 `review` |
| Real textures from a live site (torn-poster collage, paper, bill strips, wall tile) | 8 | 8 `clean` |

Thresholds (`NOISE_MAX 0.3`, `AREA_MIN 0.2`, tiny-file rule 12 KB) were chosen after seeing two false
positives on the real textures (tiny seamless tiles; noise averaged away by downscaling), so the real
negatives are partly tuning data, not an independent test.

## What this does not show
- The positives are **synthetic**, not output from a real image model. Recall on real AI images is
  unmeasured. Real generators vary: some add grain, some are upscaled, some are photoreal with noise.
- A noise-free soft gradient is also what a flat-shaded human illustration or a blurred stock
  background looks like, so `review` means "look at it", never "AI".
- Missing metadata proves nothing; it is trivially stripped.
- Hence `scan_assets.py` is triage. The verdict stays a human or model look at the picture.

## End-to-end run (art phase)
A scratch site with two AI-style images, one photo-like image, one scanned texture and one logo was
taken through inventory, scan, verdicts, redraw, `check_svg.py --strict`, swap, render and a
`glow-up: art` commit on a run branch. Results: 2 redrawn (66 KB and 40 KB PNG became 3.5 KB and 1.3 KB SVG),
3 kept, all images load, no horizontal overflow. The "photo" in that fixture is synthetic noise over a
gradient, so it is not evidence that real photos are recognised.
