# Theme Cycling

Defaults repeat because the model has no memory across runs. This rule gives it one. Adapted from Hallmark's per-project rotation log.

## Log
Keep `.glow-up/anchor-log.json` (create if missing; design picks only):
```json
[{"date":"2026-10-11","project":"acme","anchor":"swiss","fonts":["Helvetica Neue"],"accent":"#E4002B","differentiator":"40vw folio numerals"}]
```

## Rules
1. **Read the log first.** Do not pick either of the last two anchors, nor repeat the last font pair or accent hue, unless (a) the brief or brand names it, (b) an existing design system is locked, or (c) it is the only anchor the subject supports (say why).
2. **Within one project, never rotate.** Multi-page work shares one contract (`DESIGN.md`). Vary across projects, not within one; drift between pages reads as AI as loudly as any tell.
3. **Subject first, rotation second.** Rotation picks among anchors that fit the subject. Do not force a tax app into Chaotic just to satisfy the log.
4. **Structural variety, not a color swap.** Two sites must differ in section rhythm, not only palette. Avoid hero / 3 features / CTA / footer. Choose another macrostructure: editorial column, index/list, split-screen, single long scroll, dense table, poster.
5. **No second-order defaults.** Cream + serif + terracotta, near-black + acid lime, all-caps mono chrome, one accented headline word count as already used, whatever the log says.
6. **Custom escape.** If the user names a brand color or a multi-attribute vibe no anchor carries, build a custom token set (palette and font pair chosen from the subject). Locked-token and audit rules still apply; log it as `custom`.
7. **Append** the pick to the log after the rewrite.
