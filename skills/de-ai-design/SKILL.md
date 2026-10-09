---
name: de-ai-design
description: Remove the visual and structural tells that make an already-built website look AI-generated or templated, and replace them with intentional, brand-specific design decisions. Use whenever the user says the site looks AI-made, generic, samey, "vibe-coded", template-y, soulless, bland, or like every other landing page; mentions purple gradients, glassmorphism, glow blobs, three-card feature grids, emoji icons, stock imagery, or "make it feel designed by a human"; or asks to make a site more unique, distinctive, or original visually. Does not rewrite copy (that is de-ai-copy) but flags it.
argument-hint: "[path|url] [audit]"
---

# De-AI Design

Invoked as `/de-ai-design`: arguments are `$ARGUMENTS` (a project path or dev-server URL, and/or `audit`). With `audit`, produce the findings and recommended changes but edit nothing, so the user can pick what to apply. Without a path, use the current project.

AI-built sites share a recognizable set of defaults: the same gradients, the same card grid, the same glow. A tell only matters when it is a **default rather than a choice**. A purple gradient chosen because the brand is purple is fine; one that appeared because nobody decided is the problem. The job is to turn defaults into decisions tied to this site's subject, audience and brand assets.

Full catalog with detection hints and replacements: `references/ai-tells.md`. Read it at the start.

## Workflow

1. **Context.** Use the vibe read (`.glow-up/vibe.md`) if present; otherwise write 5 lines (feeling, audience, what comes across, gap). Identify real brand assets: logo, existing photos, product, colors in the logo, the founder's story, the industry's materials and vocabulary. These are the raw material for replacements.
2. **Detect.** Scan screenshots and source against the catalog. For each tell found, note where (token or component, not just page), and rate severity:
   - **High:** visible on first screen or across every page (palette, hero template, type, icons).
   - **Medium:** repeated in sections (cards, shadows, radii, motion).
   - **Low:** details (favicon, 404, selection, focus).
   Distinguish default from choice by asking: does this connect to the subject or brand? Would the owner defend it? If yes, keep it and say so.
3. **Plan few, strong changes.** Pick the 3-6 changes with the most visible impact. Each replacement must name its anchor: "Palette derived from the workshop's brass logo and oxblood leather photos," not "more modern colors". If you can't name the anchor, don't make the change, or ask the user.
4. **Replace with decisions, not noise.** Good replacements:
   - Brand-derived palette with tinted neutrals and one sparing accent, as tokens.
   - One consistent icon style (a single set, stroke weight, size) or real photography; remove emoji-as-icons and rounded-square icon chips.
   - Layout with a dominant element and a deliberate break in the grid instead of three equal cards.
   - Purposeful devices (rules, numbering, captions, real data, annotations, borders) instead of glow and blur.
   - AI-looking artwork (plastic 3D blobs, mesh-gradient art, generic illustrations): don't restyle it here. Flag it for `hand-redraw`, which scans the assets and redraws the offenders by hand.
   - Characterful type chosen for the subject, with strong scale contrast.
   - Role-based radius and shadow: e.g. inputs and buttons one radius, cards another, modals a third; shadows only to show elevation.
   Avoid swapping into the next cliche (bento grids everywhere, grain on everything, all-serif editorial, brutalist-as-costume). If the replacement could belong to any other site, it is still a default.
5. **Implement at the source.** Change tokens (CSS variables, tailwind theme), shared components and base styles. Avoid one-off overrides, which just add a second layer of defaults. Reuse the project's stack; don't introduce a UI framework.
6. **Boundaries.**
   - Don't edit copy. List AI-sounding headlines, badges and microcopy in a "for de-ai-copy" note.
   - Keep accessibility intact: contrast AA, focus visible, alt text, reduced motion. Don't remove focus rings; restyle them.
   - Don't change prices, names, links, legal text. Don't fabricate testimonials, logos, stats or photos; if social proof is fake, flag it and propose removing or replacing it with real content from the user.
   - Motion tells (fade-up on everything, hover scale) are only flagged here; `motion-pass` fixes them.
7. **Verify.** Re-screenshot at 1440/768/390, compare to baseline, check contrast and overflow, run the build. Ask yourself the squint test: does the site now look like it belongs to this brand and no other?
8. **Report.** A table of tell / severity / found where / replaced with / anchor. List what was kept as a deliberate choice, plus copy flagged for de-ai-copy, and anything needing user assets (real photos, logos). Commit as `glow-up: de-ai-design`.

## Strongly themed sites
A site with a committed theme (HUD, terminal, brutalist, retro) keeps the theme's identity: its palette, signature cursor, fonts and splash are choices. What goes is the generic effect layer stacked on top (glow, blur, gradient text, spotlight hover, scanlines everywhere). Rule of thumb: keep what the theme needs to be recognizable, cut effects that any theme would get.

Phase order matters: removing glow or blur changes contrast that `design-theory-pass` already checked, so re-run the contrast check on the changed surfaces.
If non-interactive, decide and list open questions in the report.

## Asking the user
Ask only when you need a brand fact you can't infer (colors that must stay, whether stock images are real, whether testimonials are genuine). Batch the questions into one message.
