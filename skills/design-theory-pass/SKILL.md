---
name: design-theory-pass
description: Critique and fix an existing, already-built website using design fundamentals - hierarchy, spacing rhythm, grid and alignment, typography, color roles and WCAG contrast, composition, component consistency, responsive behavior, accessibility basics, and interaction states. Use whenever the user says the site looks off, amateur, messy, cluttered, inconsistent, "something is wrong but I can't say what", asks for a design review, design critique, polish, cleanup, spacing/typography/contrast fixes, mobile/responsive fixes, or an accessibility check on a site that already exists. Trigger even if they only say "make it look more professional" or "polish the UI".
argument-hint: "[path|url] [audit]"
---

# Design Theory Pass

Invoked as `/design-theory-pass`: arguments are `$ARGUMENTS` (a project path or dev-server URL, and/or `audit`). With `audit`, produce the findings and recommended changes but edit nothing, so the user can pick what to apply. Without a path, use the current project.

Find what is objectively weak in a built site and fix it at the source of truth (tokens, variables, shared components), not with one-off overrides. Rules serve the vibe: a brutalist or maximalist site may break rules on purpose. The goal is intentional, usable, consistent, not rule-compliant.

## 0. Context
- If a vibe read exists (`.glow-up/vibe.md` or given by the orchestrator), use it as the tiebreaker for every judgment call. If not, write 5 lines first: intended feeling, audience, what comes across, biggest gap. Confirm quickly with the user if the site's intent is unclear.
- Work on a branch or backup. If invoked standalone, check `git status`; if not a repo, copy the folder first.
- Find the source of truth: CSS variables, tailwind config / theme, design tokens file, shared components. Note whether spacing, type and color tokens exist.

## 1. Read the real site
Screenshots at 1440 / 768 / 390 px of the main pages (Claude in Chrome, built-in browser, or Playwright; if none, inspect markup and computed styles and say so). Then read the markup and stylesheets. Judging only from screenshots misses the cause; judging only from code misses the effect.

## 2. Critique
- Run `/design:design-critique` and `/impeccable` if installed (check the skill list). Otherwise self-critique with the audit in `references/audit-checklist.md`.
- Merge and dedupe. Where tools disagree, decide by the vibe read and say which way you went and why.
- Self-check is still worth doing when tools run: they rarely catch token drift, overflow at 390px, or missing states.

Audit areas: hierarchy, spacing rhythm, alignment and grid, typography, color roles and contrast, composition and balance, component consistency, responsive behavior, accessibility basics, states. Thresholds and how to measure each are in the checklist.

## 3. Decide what is a bug vs a choice
If the run is non-interactive (no way to ask), decide using the vibe read and list each call under "open questions" in the report instead of blocking.

Odd-but-consistent usually is a choice (huge type, tight spacing, asymmetric layout). Odd-and-inconsistent usually is a bug. If unsure on several items, ask once, batched, with a recommendation for each. Don't interrupt per item.

## 4. Prioritize
Rank by impact (how much of the site, how visible) over cost (how many files). Do high-impact/low-cost first: usually tokens, base type, spacing scale, contrast, focus styles, overflow at 390px. Skip nitpicks that won't be noticed; fewer stronger changes beat many timid ones.

## 5. Fix at the source
- Sites patched in layers often redefine the same token or selector several times (duplicate `:root` blocks, overrides at the end of a stylesheet, a responsive file re-declaring colors). Grep every definition of a token or selector before editing, and consolidate so the top-level definition is the real one.
- If tokens are missing, introduce them: a spacing scale (e.g. 4/8/12/16/24/32/48/64/96), a type scale (4-6 steps, a ratio like 1.2-1.333), color roles (bg, surface, text, muted, border, accent, danger/success) as CSS variables or theme entries.
- Replace magic numbers with tokens only where it fixes a visible inconsistency; avoid a repo-wide churn that adds risk and no visible gain.
- Never change copy, prices, names, links or legal text. Flag copy problems for `de-ai-copy`.
- Keep behavior intact; run the build/lint/tests the project has.

## 6. Verify
With no screenshot tool, run the markup-only checks instead: font-size floor (grep for sizes under 12px), duplicate `:root` or token definitions, `transition: all`, hover states that change size or letter-spacing (layout shift), missing `:focus-visible`, text/background pairs computed from the variables, and balanced braces and a successful build.
Re-screenshot the same pages and breakpoints, compare to baseline, check no horizontal scroll at 390px, keyboard-tab through one page to confirm visible focus. Run an automated check if available (axe via Playwright, Lighthouse) but don't depend on it.

## 7. Report
For each fix: **problem / principle / fix / file**, grouped by priority. Add a short "left alone on purpose" list and any open questions. Commit as `glow-up: design-theory-pass` (or a clear message if standalone).
