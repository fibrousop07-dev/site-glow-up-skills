---
name: anti-ai-glowup
description: Design-restraint layer for the site-glow-up family. Audits a built (or about-to-be-built) site for AI tells graded P0/P1/P2, forces an explicit "Aesthetic Anchor" with a locked token set (4-6 hex colors, named fonts), cycles themes so consecutive projects do not land on the same default, then rewrites the offenders while preserving product behavior. Use when the user says the UI looks AI-generated, generic, vibe-coded, samey, "slop"; mentions indigo gradients, Inter, centered hero plus three cards, cream-and-terracotta; or wants a site to commit to a strict visual direction (Swiss, Brutalist, Industrial, Organic...). Also use before building a new page to prevent defaults.
argument-hint: "[path|url] [audit|rewrite] [anchor=swiss|industrial|brutalist|aurora|chaotic|retro|organic|lofi] [cycle=off]"
---

# Anti-AI Glow-Up

Invoked as `/anti-ai-glowup`; arguments are `$ARGUMENTS`. `audit` grades and plans without editing. `rewrite` (default) audits, commits to an anchor, then edits. Without a path, use the current project.

A tell is an **unchosen default**, not a banned color. Purple is fine when the brand is purple. The job: replace defaults with decisions tied to the subject, then hold those decisions with locked tokens. Never trade one cliché for the next (indigo gradient -> cream + terracotta -> near-black + acid green are all defaults).

Synthesized from Anthropic's `frontend-design`, `avoid-ai-design` (audit protocol), Ilm-Alan's `frontend-design` (anchors), Nutlope's `hallmark` (rotation, locked tokens, pre-emit critique) and `vibecoded-design-tells` (unslop-ui). Credits in `references/sources.md`.

## Workflow

1. **Scope and context.** Read the real files. Find an existing design system (`DESIGN.md`, `:root` tokens, sibling pages, a brand color). If one exists it is the contract: do a surgical pass and skip the anchor pick. State one sentence each: subject, audience, primary job.
2. **Scan.** If Node 18+ exists run `node <skill-dir>/scripts/detect.mjs <paths>` (code-certain tells only; exit 2 on any P0/P1). Then render and look, since palette weight, rhythm and structural sameness are visual. Mark unrendered findings *inferred*.
3. **Grade.** Walk `references/ai-tells.md`. For each tell: ID, location (token/component, not just page), severity, one line on why it reads as AI, tagged code-certain / rendered / inferred.
   - **P0** a layperson spots it: indigo/purple gradient, gradient heading text, Inter/Roboto everywhere, centered hero + 3 icon cards, emoji icons, glow blobs.
   - **P1** a designer spots it: cream + serif + terracotta, near-black + acid accent, all-caps mono labels, one accented headline word, decorative 01/02/03, `rounded-2xl shadow-lg` everywhere, untouched shadcn, same fade-up on every section.
   - **P2** craft gaps: no spacing rhythm, bounce easing, generic CTAs.
   Accessibility defects (no `:focus-visible`, contrast under AA, ignored reduced-motion) are high priority at any tier.
4. **Choose an anchor** (`references/anchors.md`). Pick exactly one of the eight, leaning toward the unexpected pairing for the subject. Write one line: *anchor, why this over the safe one*. Then one **differentiator**: a single memorable move visible in the render. No hybrids.
5. **Rotate** (`references/theme-cycling.md`). Read `.glow-up/anchor-log.json`; do not reuse the last two anchors or the same font pair unless the brief or an existing system demands it. Log the pick.
6. **Lock tokens.** Write 4-6 named hex colors with roles, 1-2 named font families, and radius/shadow rules, all inside the anchor's allowed range, as a token block (`:root` or `tailwind.config`). From here every color and `font-family` must reference a token; lift new values into the block first.
7. **Restructure.** Replace the centered-hero-plus-three-cards skeleton with an asymmetric or editorial/brutalist structure suited to the anchor: left-aligned type, off-grid hero, a section rhythm that differs from hero / 3 features / CTA / footer. Open with the most characteristic thing in the subject's world.
8. **Rewrite.** Preserve props, state, routing, data flow, accessibility and the meaning of the copy. No silent new dependencies. Surgical for components and anything inside a design system; rebuild for standalone pages.
9. **Pre-emit critique and re-scan.** Score 1-5 on Philosophy, Hierarchy, Execution, Specificity, Restraint, Variety; anything under 3 gets a revision. Re-run the scanner (no P0, no P1 the brief did not ask for) and check the anchor's "Breaks if" list. A clean scan is necessary, not sufficient: the result must also be justified, coherent and not a second-order default.

## Content discipline
Every string names real information. No invented metrics, personas, testimonials or telemetry; leave the slot empty or mark it "to confirm". No unicode-glyph icons, `//` kickers, themed replacements for standard UI copy ("Authenticate Session" for "Next"), or fake browser/phone chrome. No italic headings.

## Guardrails
- The brief and any existing brand beat this skill's taste; mark deliberate choices with `avoid-ai-design-ignore: <ID>` (the scanner honors it) comments.
- Report defaults as evidence, never as proof of authorship.
- If the site is already distinctive, say so and stop. A clean audit is a valid result.
- Never break working code. Edit source, never a live site.
- In a full `/site-glow-up` run this layer fits after `design` and supersedes `de-ai-design`'s palette picks when both run.

## Output
Audit table (ID, severity, location, reason, tag) -> stated direction (anchor, reason, differentiator, tokens) -> edits -> what changed -> re-scan result and critique scores.
