---
name: hand-redraw
description: Scan a built site, design file or image folder for artwork that looks AI-generated (glossy 3D blobs, mesh gradients, plastic illustrations, uncanny stock-style renders, generic icon sets), then redraw each one as hand-drawn vector art (wobbly ink lines, imperfect fills, paper grain) so it reads as made by a person. Use when the user says images or illustrations look AI-made, want them hand drawn, sketchy, doodled or handmade, or asks to replace AI art with human-looking illustrations. Phase "art" of site-glow-up. Layout, color and type tells belong to de-ai-design.
argument-hint: "[path|url] [audit] [style=ink|pencil|marker|crayon]"
---

# Hand Redraw

Arguments: `$ARGUMENTS` (a project path, URL or image folder; `audit` to list only; `style=`, default `ink`). Phase `art` of `site-glow-up`; also works alone.

Goal: every flagged image is **replaced by an original drawing of the same subject**, not filtered. A blur or "sketch" filter over an AI render still looks AI-made.

Tell catalog and style recipes: [references/tells-and-styles.md](references/tells-and-styles.md). Read it first.

## Quick start

```bash
# 1. inventory: paste scripts/inventory.js into the running page, then judge each asset
# 2. redraw: a clean SVG in, a hand-drawn SVG out (try it on examples/wrench-clean.svg)
python -I scripts/roughen_svg.py examples/wrench-clean.svg out/wrench.svg --seed 7 --style ink --echo
# 3. verify: fails on embedded rasters, opaque backgrounds, oversize or unroughened files
python -I scripts/check_svg.py out/*.svg
```

Verdict table shown to the user (step 3):

| Asset | Verdict | Reason | Replacement |
|---|---|---|---|
| `/img/hero-3d.png` | high | waxy gloss, drifting symmetry, 1024x1024 | hand-drawn `hero.svg`, brief: "wrench over a loaf" |
| `/img/team.jpg` | keep | real photo | none |
| `/img/wall.webp` | keep | scanned paper texture, deliberate | none |

## Family conventions
Read `.glow-up/decisions.md` and `.glow-up/vibe.md` first (obey decisions over this file). Inside a run, work on the run branch, stage only the files you touched, and commit as `glow-up: art`. Screenshots go in `.glow-up/after-3/`. Outside a run, ask before committing.

## Workflow

1. **Inventory.** Run `scripts/inventory.js` in the page (browser JS tool) for `<img>`, CSS backgrounds and inline SVG, then add `/public`, `/assets` and design exports from source. Record path, size, where used.
2. **Detect.** View every asset. Verdict: `high` (3+ tells), `maybe`, or `keep`. Metadata (`c2pa`, PNG `parameters`) is a hint only.
   - **Keep by default**: real photos, logos, screenshots, charts, and **scanned or photographic textures** (torn paper, concrete, grain, collage). A deliberate texture is a design choice, not an AI tell; redrawing it destroys the look. Judge deliberateness from the vibe read.
   - Most sites yield few or zero `high` items. Zero is a valid result: say so and stop.
3. **Confirm.** Show the verdict table (path, verdict, reason, proposed replacement). Redraw only `high` items, plus `maybe` ones the user approves.
4. **Redraw.** For each item:
   - One-line subject brief ("a hand holding a wrench, 3/4 view, flat shapes").
   - Build an **SVG** from simple primitives with deliberate imperfection: open outlines, offset fills, uneven stroke width. 2-4 flat colors from the site palette. **Leave the background transparent** (the wobble ragged-edges any background rect).
   - `python -I scripts/roughen_svg.py in.svg out.svg --seed N --style ink` adds wobble and grain; scale follows the drawing size; same seed gives same output. Use a different seed per asset. `--echo` adds a faint re-traced second outline; use it on line-heavy art, skip it on tiny icons.
   - Keep the aspect ratio. Save beside the original (`hero.svg` next to `hero.png`); never overwrite it.
5. **Swap.** Update `src`/CSS/imports in the project's own way. Keep `alt`, add `width`/`height`, check dark mode.
6. **Verify.** `python -I scripts/check_svg.py <redrawn files>` must exit 0 (it rejects embedded raster, opaque background, no viewBox, over 60 KB). Then render at 1x and 2x against the original, in light and dark, and run the build. Squint test: one hand, one line-weight family across all assets.
7. **Report.** Table: asset / verdict / reason / replacement / seed. List what needs human input (real photos, logos) and what was kept as a deliberate choice.

## Rules
- **Be honest.** Hand-drawn style is an aesthetic, not proof of human authorship. If the user wants it to pass a disclosure rule or contest, say it will not make AI-made work human-made, and do not strip provenance metadata from files you did not redraw.
- Consistency beats polish: one style per site.
- Pick line colors that contrast with the site's background in every theme (near-black ink vanishes on a dark page); use a palette ink or `currentColor`.
- Run `roughen_svg.py` on the clean source, never on its own output (it refuses).
- Never trace pixel-for-pixel; redraw from the brief so AI artifacts (garbled text, extra fingers) don't carry over.
- Text inside images becomes real HTML text unless the user asks for lettering.
- Don't fabricate photos, logos or testimonials; flag them for the user.
- If non-interactive, treat only `high` as in scope and list the rest.
