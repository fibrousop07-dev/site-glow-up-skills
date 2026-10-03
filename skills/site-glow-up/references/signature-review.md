# Signature visual review

`signature-coverage.mjs` proves the signature is present, joined, smooth, visible, clear of content and not too faint or loud. It cannot say whether the result is **beautiful**, and no script can. Beauty needs eyes. This review gives those eyes a fixed procedure so the judgment is consistent, evidence-based and checked by someone other than the person who built it. The user always has the last word.

## Procedure
1. Run the coverage check first. Review only a signature that passes it; a measurable defect is cheaper to fix than to argue about.
2. Build the image set:
   ```
   node <skill-dir>/scripts/signature-review.mjs --base http://localhost:3000 --routes /,/about,/__missing \
     --selector "[data-signature]" --out .glow-up/signature-review
   ```
   It saves, per route at 1440 and 390: the top of the page at rest and at the extreme of the animation, the full page, close crops of up to three joins, and the foot of the page.
3. **Use a fresh reviewer.** If subagents are available, start one that is given only `.glow-up/signature.md` (the spec and its one-sentence idea), `.glow-up/vibe.md`, the images, and the rubric below. It has not seen the code or your reasoning, which is the point: the builder always likes their own work. Without subagents, review the images yourself after re-reading the spec, and say in the report that the review was not independent.
4. The reviewer scores each criterion 1 to 5 and writes one line of evidence naming an image. A score with no evidence does not count.
5. **Pass** means no criterion below 3 and an average of 4 or more. If it fails, make one targeted change aimed at the lowest criterion, rerun the coverage check, rebuild the images and review again. Two rounds at most; after that, show the user the best version and the reviewer's remaining notes.
6. Show the user the full-page image and one join crop per viewport with the scores. Present it as "here is what I'd ship and why", not as a verdict. If they disagree with the reviewer, they win, and the spec's idea sentence changes to match what they want.

## Calibration from testing
In tests, builders who scored their own signature gave an average of 4.2. Fresh reviewers looking at the same kind of images gave 3.7 to 3.8, and a first-pass signature that passed every measurement was scored 2 on placement for reading as a stray edge line. Expect the first independent review to fail and treat that as normal: the usual causes were a strand pinned to the viewport edge and one with no visible start or end. Both are now measurable (`--min-edge`, `--ends-inside`), so run them before asking for a review.

Scores also vary between reviewers looking at the same images, by about 0.3 on the average. A clean fixture went 3.8 to 3.67 after a fix round that moved the strand to the margin centre line and added a knot, because a different reviewer weighted different flaws (a kink near the foot, edge crowding at 390). When the average lands between 3.5 and 4.0, use two reviewers and take the lower average, and fix the flaws both name before spending a round on one reviewer's taste.

## Rubric
| Criterion | 5 looks like | 1 looks like |
|---|---|---|
| **Idea match** | You could guess the spec's sentence from the image alone ("a fibre hanging and swaying") | It reads as something else: a scratch, a border, a scrollbar |
| **Line quality** | Even weight, gentle continuous curves, joins you cannot find | Corners, wobble, uneven weight, visible seams |
| **Restraint** | You notice it after the content; it frames the page | It competes with headings or buttons; it is the first thing you see |
| **Placement and rhythm** | It sits on a considered line (gutter, grid edge, content axis) and hangs from a fixed anchor to a fixed end | It drifts without reason, starts and stops at arbitrary places |
| **Fit with the site** | The colour belongs to the palette and its warmth matches the surfaces; weight matches the type | It looks pasted on from another site |
| **Narrow screens** | At 390 it keeps its character without crowding text or edges | It disappears, doubles up, or squeezes the layout |

## What the reviewer should look for, and not do
- Look at the joins and the end points first; that is where half-built signatures show.
- Compare the "rest" and "extreme" frames: a swing that is lovely at rest and awkward at its limit fails Placement and rhythm.
- Check the 390 images separately; a signature that works at 1440 often fails there.
- Do not praise effort or complexity. Fewer, stronger decisions is the house principle, so a quieter signature should score higher on Restraint than a busier one.
- Do not suggest new features. Name the single change that would raise the lowest score.

## Reviewer prompt (copy and fill in)
> You are reviewing the visual quality of one design signature on a website. You have not seen the code. Read the spec and vibe note, look at the images listed, then score the six rubric criteria 1-5 with one line of evidence each that names an image. Then give: the lowest-scoring criterion, the single smallest change that would raise it, and whether you would ship it as is. Be strict; a 5 should be rare. Spec: <paste .glow-up/signature.md>. Vibe: <paste .glow-up/vibe.md>. Images: <list>.

## Report line
Add to the Step 4 signature section: the six scores, who reviewed (independent or self), the rounds taken, and "user decision: accepted / changed".
