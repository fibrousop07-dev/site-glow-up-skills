---
name: site-glow-up
description: Orchestrates a full polish of an ALREADY BUILT website - design theory fixes, removing AI-generated visual tells, hand-redrawing AI-looking artwork, GSAP motion, de-AI-ing the copy, then an optional personality layer. Use this whenever the user wants to glow up, polish, level up, refresh, freshen, finish, or "make better" an existing site; says it looks AI-generated, generic, templated, bland, or soulless; wants it to feel human, premium, distinctive, or more alive; or asks for a full design/motion/copy pass over a site they already built, even if they never say "glow up". Also use to compare a local/staging build against the live deployed site (is it ready to ship, what regressed). Prefer this over the single-purpose skills when more than one of design, animation, and copy is in play.
argument-hint: "[path|url] [audit|resume|status|revert <phase>] [compare=<live url>] [only=design,ai,art,motion,copy] [skip=...] [personality=color|type|motion|texture|copy|surprise]"
---

# Site Glow-Up

Polish a finished site in phases, each judged against one written "vibe read", each committed separately so any phase can be reverted. The phases are separate skills that also work alone: `design-theory-pass`, `de-ai-design`, `hand-redraw`, `motion-pass`, `de-ai-copy`.

Why a pipeline: design fixes change tokens that the AI-tell cleanup then builds on; artwork is redrawn once the palette is settled; motion should animate the final layout; copy changes last because they change text length and can break layouts. Order matters.

## How to be invoked (slash command arguments)
`/site-glow-up` takes optional arguments. Arguments received: `$ARGUMENTS`
Parse them loosely (order doesn't matter, plain words are fine):

| Argument | Meaning |
|---|---|
| a folder path | the project root (otherwise use the current directory, or find the nearest package.json/index.html) |
| a URL (`http://localhost:5173`, `https://...`) | the running site to screenshot; still edit the source, never a live site |
| `audit` | report only: write the vibe read and a prioritized findings list from all phases, change nothing |
| `only=design,ai,art,motion,copy` | run just those phases (names: `design`=design-theory-pass, `ai`=de-ai-design, `art`=hand-redraw, `motion`, `copy`) |
| `skip=motion` | run everything except those phases |
| `personality=color` (or type, motion, texture, copy, surprise, none) | answer the Step 3 question in advance |
| `resume` | continue from `.glow-up/state.json`, skipping finished phases |
| `status` | print which phases are done, with commit hashes, and stop |
| `revert <phase>` | revert that phase's commit (confirm first) and stop |
| `anchor=swiss` (or industrial, brutalist, aurora, chaotic, retro, organic, lofi) | run the optional `anti-ai-glowup` layer after `design`: AI-tell audit, one locked Aesthetic Anchor, theme cycling. Also available alone as `/anti-ai-glowup` |
| `fast` | skip screenshots; verify with markup/build checks only |
| `compare=<url>` (or "compare it to the live site") | after the run (or alone, with `audit`), compare the local site against a deployed one: `references/compare.md` |

No arguments means the full flow on the current project. If an argument is ambiguous, ask once.

Keep `.glow-up/state.json` up to date after every phase: `{"run": 17, "root": "...", "branch": "glow-up-17", "base": "<commit before the run>", "phases": {"design": {"status": "done", "commit": "abc123"}}, "personality": null}`. It is what makes `resume`, `status` and `revert` work, and it survives a closed session. Write facts you checked (`git rev-parse`), never a guess: a state file that says "no git" in a git repo sends the next run down the wrong path.

## Files the skill keeps in `.glow-up/` (out of git)
- `decisions.md`: the owner's standing decisions, newest last, one line each with a date (`2026-10-05 keep hero scroll length; do not shorten`). **Read it before anything else and obey it over every reference in this skill**, including the font audit and design theory. A finding that contradicts a decision is not a recommendation: list it once under "conflicts with decision (date)" or drop it. Append every new decision the user makes during the run.
- `vibe.md`: the current vibe read (replace it each run; history belongs in decisions.md).
- `state.json`, `run-<n>/` (screenshots, audit output, scratch scripts for that run). Don't scatter one-off scripts at the top of `.glow-up/`; reuse `scripts/audit.mjs` and `scripts/shoot.mjs` and put anything else in `run-<n>/scratch/`.

## Principles
- Preserve what is intentional. A choice that looks odd but fits the vibe stays.
- Fewer, stronger changes beat many timid ones. Ten tweaks nobody notices are worse than three the whole page feels.
- Never change meaning, prices, names, links, or legal text without asking.
- If the user's taste conflicts with design theory, say so once, briefly, then follow the user.
- Skip any phase that finds nothing worth doing. Don't invent work.
- Judge ideas and their execution separately. A good idea built badly is the most valuable thing to find: keep the idea, fix the build.
- Check by role, not by element: fonts, colours and spacing should be consistent for every element doing the same job, so audit every heading, label and button, not only the hero.

## Step 0: Setup
1. **Find the root and stack.** Look for package.json, next/vite/astro config, or plain index.html. Note framework, styling (Tailwind, CSS modules, plain CSS), animation libs, and where tokens and copy live. Ask only if several projects are plausible.
   - **Reject build output as the root.** A folder with a standalone `server.js`, only `.next/`/`dist/`, a zipped backup, or a placeholder page (`pages/index.tsx` returning one heading) is a deploy bundle, not the source. Find the real source: ask the OS which process listens on the dev port and read its working directory (Windows: `netstat -ano | findstr :4000` then `wmic process where processid=<pid> get commandline` / PowerShell `Get-Process -Id <pid>`; macOS/Linux: `lsof -i :4000` then `lsof -p <pid> | grep cwd`), or search sibling folders for the same package name with real `app/`/`src/`. Check project memory and README for a workspace map. Never edit a bundle.
   - **Respect protected areas.** Read CLAUDE.md/AGENTS.md, project memory and decisions.md for folders the owner said not to touch (a store, a separate subdomain app, internal tools). Those paths are out of scope for every phase and for commits.
2. **Protect the work.** If it is a git repo: check `git status`. If the tree is dirty, the changes are the owner's work in progress: do not stash, reset or commit them for the owner. Either ask to commit them first as the owner's own commit, or work around them and **stage only the files each phase touched** (`git add <paths>`, never `git add -A`), listing any file that has both owner WIP and phase edits in the report. If you can't ask (user away, non-interactive) and WIP overlaps files the phases must edit, commit it on the new run branch (never on main) as `snapshot: uncommitted work before glow-up-<n>` with the file list, so each phase diff stays clean and the snapshot can be split or dropped later; say so in the report. Branches: if `state.json` shows an unfinished run, continue on its branch (`resume`); otherwise create one branch per run, `glow-up-<n>`, from the current HEAD, record `run`, `branch` and `base` in state, and commit after every phase as `glow-up: <phase>`. Don't stack a new branch on an unfinished one. If not a repo: copy the folder to `<name>-backup-<date>` beside it first (skip huge asset folders if they are untouched, and say so) and tell the user the path. Then ask whether a `git init` is OK so per-phase commits work; if you can't ask (non-interactive) or the user declines, record before/after file copies per phase instead and report those paths in place of commit hashes.
3. **Baseline screenshots** of 3-5 key pages at 1440, 768 and 390 px wide into `.glow-up/before/` (keep this folder out of git via .gitignore or .git/info/exclude). Use Claude in Chrome or the built-in browser if available, else `scripts/shoot.mjs` (Playwright; it scrolls first so reveals finish, and its header says how to install Playwright in a scratch dir), else say screenshots are unavailable and verify via markup and computed styles instead. Start the dev server with the project's own script; don't guess ports.
4. **Check companions** against the skill list: `/design:design-critique`, `/impeccable`, `/gsap-core`, `/gsap-scrolltrigger`, `/gsap-timeline`, `/gsap-react`, `/gsap-performance`, `/frontend-design`. Record which exist and tell the user in one line. Invoke them where they fit a phase (critique tools in design-theory-pass, `/gsap-*` in motion-pass); a plain static page may need little from them, and that's fine. Missing ones never block; each sub-skill has built-in fallbacks.

Then run the baseline audit once, from the project root (it resolves Playwright and axe-core from the project if they are devDependencies): `node <skill>/scripts/audit.mjs .glow-up/run-<n>/before-audit <local url>`. It records, per route at 1440 and 390, HTTP status, console errors and failed requests, overflow, axe WCAG 2.2 AA, h1 count and heading skips, text under 12px, broken images, page height, fonts by role, and the status of every same-origin link. Its table is the "before" column of the final report; rerun it into `after-audit` at the end. Treat a 404 status on the deliberate 404-check route as expected.

## Step 1: Vibe and feel read
If this is a repeat run (earlier `run-*` folders, glow-up branches, or a vibe.md exist), say so and read the last report and decisions.md first: the job is the next gap, not redoing settled work. Look at the screenshots and source, then write about 8 lines:
- Intended feeling (what the site is trying to make a visitor feel)
- Audience
- What actually comes across today
- Biggest gap between the two
- 3 qualities to protect, 3 to avoid
- **Ideas in play**: every concept the site is trying to express (a roaming thread, live demos, a drawn typeface, a signature animation), one line each. Read `references/execution-gaps.md` and `references/font-audit.md` first; the next two bullets come from them.
- **Execution gaps**: for each idea, direction (right for this audience?) and execution (does it actually read?) rated separately. High direction with low execution means keep the idea and redo the build; never cut an idea because its first build was weak.
- **Decisions in force**: the lines from decisions.md that constrain this run, so the user can correct them.
- **Fonts by role**: the table from the font audit (h1, h2, h3, nav, buttons, labels, body, figures). Note any custom brand face and where it is and is not used.

Show it to the user and wait for a yes or correction. Save the approved text to `.glow-up/vibe.md`. Every later phase quotes it when choosing between options, so a wrong read poisons everything; this is the one checkpoint worth blocking on.

## Step 2: The phases

Two checks cut across all phases and are part of each phase's findings, not extra phases:
- **Font audit** (`references/font-audit.md`): done inside `design-theory-pass` and `de-ai-design`. Headlines in a stock face, a brand face used in one place only, and mono-uppercase labels are findings, not nitpicks.
- **Execution gaps** (`references/execution-gaps.md`): after the design and motion phases, re-judge every idea from the vibe read. Anything still rated high direction / low execution is fixed before the final report, or listed with a reason.
Run each by invoking the skill, passing the vibe read and companion list as context. If invoking isn't possible, read its SKILL.md and follow it.

1. `design-theory-pass`, then re-screenshot into `.glow-up/after-1/`, commit.
2. `de-ai-design`, then re-screenshot into `.glow-up/after-2/`, commit.
3. `hand-redraw` (phase `art`): inventory the artwork first. If no asset is a `high` AI-art verdict, skip the phase and say so (scanned textures, photos and logos are `keep`). Otherwise confirm the list with the user, redraw, re-screenshot into `.glow-up/after-3/`, commit. With `audit`, only report the verdict table.
4. `motion-pass`, then re-screenshot and check scroll behavior and jank, commit.
5. `de-ai-copy`, then check text overflow and wrapping at 1440/768/390 (new text lengths break layouts), fix, commit.

When a phase hits a decision only the user can make (replace the animation library? is this oddity a choice?), batch the questions and ask once rather than interrupting repeatedly.

## Step 3: Personality layer (optional)
Ask: "Want a personality layer on top? Color (richer palette), Type voice, Motion signature, Texture and detail, Copy voice, Surprise me, or skip." If yes, follow `references/personality.md`, including its signature inventory and coverage check: ask for approval of the named personality and its signature spec before building. The personality step is not done until `scripts/signature-coverage.mjs` passes on every route and the visual review in `references/signature-review.md` has been done and shown to the user. If no, move on.

## Step 4: Final report
Keep it to one screen:
- Vibe before vs. after (two sentences)
- Changes per phase, one line each, with commit hash
- Risky items (layout structure, dependencies, copy with nuance) and how to revert: `git revert <hash>` per phase
- Execution gaps table (idea / direction / execution / what was wrong / fix) and the fonts-by-role before and after
- Things to check by eye (specific pages and breakpoints, the motion, copy that carried nuance)
- Where the before/after screenshots are, and the before/after audit tables (`run-<n>/before-audit/audit.md`, `after-audit/audit.md`) with any row that got worse called out
- Live comparison (when `compare=` was given or the user asked): the summary from `references/compare.md`
- **Signature coverage** (only if a personality layer added a signature): paste the table from the coverage run, never a single-page screenshot:

  | Route | Count | Breaks | Visible without JS |
  |---|---|---|---|
  | / | 4 | 0 | yes |

  Under it, one line with the review result: six rubric scores, independent or self-reviewed, rounds taken, user decision. One row per route in `.glow-up/signature.md`, including the 404. If any row has count 0, breaks above 0, or "no", the personality layer is not done: say so and list the fix, don't mark it complete.

Don't merge `glow-up` into the main branch; the user decides.
