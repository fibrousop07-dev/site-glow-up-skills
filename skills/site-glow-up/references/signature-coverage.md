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
| `--avoid-text` | fail if the path passes within 3px of a text glyph box, link, button or form control. Mark decorative text to ignore with `data-signature-ignore` |
| `--tol` | break tolerance in px (default 1) |
| `--json file` | write full rows and failures |

On Git Bash, a route of `/` is rewritten to a Windows path. Prefix the command with `MSYS_NO_PATHCONV=1` or use `@file`.

## Reading the output
`route | view | count | colour ok | visible | breaks (worst dx) | max y gap | sideways/drop | text hits`, one row per route and view (1440, 390, 1440 reduced-motion, 1440 no-JS), then `PASS` or `FAIL` with one line per failure.

- **count 0**: signature missing on that route. Usually a per-page placement; move it to the shared layout.
- **colour ok false**: the element uses a literal or a stale value instead of the token.
- **visible false**: opacity under 5%, `display:none`, `visibility:hidden`, zero size, or a dash-drawn stroke not fully drawn after a full scroll. In the no-JS row this is the "hidden until JS runs" bug.
- **breaks > 0**: segments do not join. `worst dx` is the biggest horizontal gap in px. Fix the endpoints, not the tolerance.
- **sideways/drop**: the worst per-segment ratio. A "swoosh" is a high value here.
- **text hits**: segments whose path crosses text or a control (only with `--avoid-text`).
- **max y gap**: informational. Large gaps usually mean a section between segments has no segment; add one or make the chain span it.

For SVG paths, endpoints come from `getPointAtLength` through the screen transform, so `preserveAspectRatio="none"` and CSS scaling are accounted for. For other elements it uses the horizontal centre at the top and bottom of the box.

## What it cannot judge
Taste: whether the shape is beautiful, or whether the motif fits the vibe. The geometry checks stop a swoosh and a collision; look at 1440 and 390 screenshots for the rest. Text and control overlap only sees text nodes and form controls, not images.

## Self-test
`node scripts/selftest.mjs` (from a folder where `playwright` resolves) serves generated fixtures and checks the script itself: multi-segment chains of 2, 4 and 6 segments plus a 404 must pass; segments at different x, a wide sweep, a hidden-until-JS motif, a thread through text, a route without the motif, and a literal colour must each fail for the right reason. Run it after editing the script.
