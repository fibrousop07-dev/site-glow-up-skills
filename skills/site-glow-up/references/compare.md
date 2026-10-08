# Compare local against live

Use when the user asks to compare the local site with the deployed one, or passes `compare=<url>`. The question it answers: **is local ready to replace live, and what must be fixed first?** Edit only the local source. Never change anything on the live site.

## 1. Run the same checks on both
From the project root:
```
node <skill>/scripts/audit.mjs .glow-up/run-<n>/compare <local url> --compare <live url>
node <skill>/scripts/shoot.mjs .glow-up/run-<n>/compare/local <local url>/ <local url>/<route> ...
node <skill>/scripts/shoot.mjs .glow-up/run-<n>/compare/live  <live url>/ <live url>/<route> ...
```
The audit uses the same routes on both (taken from local's header, nav and footer, plus a 404 check), so a route missing on one side shows as an HTTP error rather than vanishing. Live sites often have analytics beacons that never let the network go idle: the script waits for `load` and caps the idle wait, so don't "fix" this by raising timeouts.

## 2. Judge with the critique skills, if present
Give each skill the matching pair of screenshots, not one site alone:
- `/design:design-critique` or `/visual-critique:critique-screen`: hierarchy, consistency, first impression.
- `/impeccable` (critique/audit mode): anti-patterns, AI tells, polish.
- `/ux-strategy:competitive-analysis` style framing is overkill here; skip it.
If a skill is missing, apply design-theory-pass's checklist yourself. Score the same heuristics for both sides (0 to 4) and say they are judgments, not measurements.

## 3. Filter through decisions.md
Before writing a finding, check `.glow-up/decisions.md` and project memory. A difference the owner chose on purpose (live and local differ because the owner changed it) is not a regression. A recommendation that reverses a decision goes under "conflicts with decision" with its date, or is dropped.

## 4. Write `.glow-up/run-<n>/compare/comparison.md`, one screen
- Verdict: ship local as-is / ship after the P1s / not yet, in one sentence.
- Side-by-side table: area / local / live / which is better and why (first impression, identity, services, proof, pricing, contact, ending, legal pages, 404).
- Measured table straight from audit.md (status, a11y, overflow, h1, errors, height), with **live-only defects** called out, because they are live right now and shipping local fixes them (for example a 404 linked from the footer, a missing h1, a CSP-blocked script).
- **Regressions**: anything live does better than local. These are the P1s, since shipping would lose them.
- Priority list P1 (blocks shipping) / P2 (fix soon) / P3, each with evidence (screenshot path or audit row).
- Limits: what wasn't tested (form submission, real devices, speed under load).

Then show the user the verdict and the P1s, and offer to fix the local P1s in the same run.
