# Signature coverage check

`scripts/signature-coverage.mjs` is a Playwright script (setup as for `shoot.mjs`: in a scratch dir, `npm i playwright && npx playwright install chromium`, and run it from there).

## Options
| Flag | Meaning |
|---|---|
| `--base URL` | dev or preview server origin (required) |
| `--routes` | comma list, or `@file` with one route per line. Include a nonexistent one (`/__missing`) for the 404 |
| `--selector` | CSS selector counted as the motif (default `[data-signature]`); put the same hook on every segment |
| `--token` | custom property (`--signature`) or literal colour the computed colour must equal (required) |
| `--prop` | `stroke`, `fill`, `color` or `background-color`; default picks per element |
| `--continuous` | check chaining: end x of a segment vs start x of the next, document order |
| `--max-lateral R` | shape intent for vertical motifs: per segment, sideways extent / vertical drop must be <= R (0.3 suits a hanging fibre). Omit for other motifs |
| `--max-kink DEG` | smoothness: the largest direction change between neighbouring ~25px stretches, inside a segment and at every join, must be <= DEG (25 is a good start). Catches corners, zigzags and kinked joins |
| `--min-contrast R` / `--max-contrast R` | stroke or fill against the background it sits on (WCAG ratio). 1.3 to 5 reads as "seen but not shouting" for a decorative line |
| `--min-edge PX` | the whole motif, at every point of its animation, stays at least PX from the left and right viewport edges (12 is a good start) |
| `--ends-inside PX` | the motif starts at least PX below the top of the page and ends at least PX above its foot, so it has a visible start and end. Use for a hanging strand, skip for a full-bleed rail |
| `--avoid-media` | with or without `--avoid-text`: also fail on images, video, canvas, iframes and other SVGs |
| `--avoid-text` | fail if the path passes within 3px of a text glyph box, link, button or form control. Mark decorative text to ignore with `data-signature-ignore` |
| `--tol` | break tolerance in px (default 1) |
| `--json file` | write full rows and failures |

On Git Bash, a route of `/` is rewritten to a Windows path. Prefix the command with `MSYS_NO_PATHCONV=1` or use `@file`.

## Reading the output
`route | view | count | colour ok | visible | breaks (worst dx) | sideways/drop | kink/join deg | contrast | text hits | overflow px`, one row per route and view (1440, 390, 1440 reduced-motion, 1440 no-JS), then `PASS` or `FAIL` with one line per failure.

- **count 0**: signature missing on that route. Usually a per-page placement; move it to the shared layout.
- **colour ok false**: the element uses a literal or a stale value instead of the token.
- **visible false**: opacity under 5%, `display:none`, `visibility:hidden`, zero size, or a dash-drawn stroke not fully drawn after a full scroll. In the no-JS row this is the "hidden until JS runs" bug.
- **breaks > 0**: segments do not join. `worst dx` is the biggest horizontal gap in px. Fix the endpoints, not the tolerance.
- **sideways/drop**: the worst per-segment ratio. A "swoosh" is a high value here.
- **text hits**: segments whose path crosses text or a control (only with `--avoid-text`).
- **kink/join deg**: sharpest turn inside a segment / at a join between segments. High means corners or a join where two curves meet at an angle.
- **contrast**: lowest ratio against the background behind the motif. Too low and it is invisible; too high and it shouts.
- **overflow px**: how far the page scrolls sideways. Always a failure, whatever the cause. A motif hung off the edge or rotated by a sway is a common cause.

For SVG paths, endpoints come from `getPointAtLength` through the screen transform, so `preserveAspectRatio="none"` and CSS scaling are accounted for. For other elements it uses the horizontal centre at the top and bottom of the box.

## What it cannot judge
Taste. The checks measure craft: presence, joins, smoothness, restraint, clearance. Whether the result is beautiful and fits the vibe is judged in `references/signature-review.md` by a reviewer looking at images, with the user as the final word. Overlap checks see text nodes, form controls and (with `--avoid-media`) media elements, not painted backgrounds. Contrast takes the first solid background behind the motif and ignores gradients.

## Self-test
`node scripts/selftest.mjs` (from a folder where `playwright` resolves) serves generated fixtures and checks the script itself. Multi-segment chains of 2, 4 and 6 segments plus a 404 must pass under every flag. Each defect must fail for the right reason: segments at different x, a wide sweep, hidden until JS runs, a thread through text, a missing motif, a literal colour, a sharp corner, a kinked join, too faint, too loud, sideways overflow, a thread through an image, and a swing that only collides at its extreme. Run it after editing the script.
