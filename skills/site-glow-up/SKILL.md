---
name: site-glow-up
description: Orchestrates a full polish of an ALREADY BUILT website - design theory fixes, removing AI-generated visual tells, GSAP motion, de-AI-ing the copy, then an optional personality layer. Use this whenever the user wants to glow up, polish, level up, refresh, freshen, finish, or "make better" an existing site; says it looks AI-generated, generic, templated, bland, or soulless; wants it to feel human, premium, distinctive, or more alive; or asks for a full design/motion/copy pass over a site they already built, even if they never say "glow up". Prefer this over the single-purpose skills when more than one of design, animation, and copy is in play.
argument-hint: "[path|url] [audit|resume|status|revert <phase>] [only=design,ai,motion,copy] [skip=...] [personality=color|type|motion|texture|copy|surprise]"
---

# Site Glow-Up

Polish a finished site in phases, each judged against one written "vibe read", each committed separately so any phase can be reverted. The phases are separate skills that also work alone: `design-theory-pass`, `de-ai-design`, `motion-pass`, `de-ai-copy`.

Why a pipeline: design fixes change tokens that the AI-tell cleanup then builds on; motion should animate the final layout; copy changes last because they change text length and can break layouts. Order matters.

## How to be invoked (slash command arguments)
`/site-glow-up` takes optional arguments. Arguments received: `$ARGUMENTS`
Parse them loosely (order doesn't matter, plain words are fine):

| Argument | Meaning |
|---|---|
| a folder path | the project root (otherwise use the current directory, or find the nearest package.json/index.html) |
| a URL (`http://localhost:5173`, `https://...`) | the running site to screenshot; still edit the source, never a live site |
| `audit` | report only: write the vibe read and a prioritized findings list from all four phases, change nothing |
| `only=design,ai,motion,copy` | run just those phases (names: `design`=design-theory-pass, `ai`=de-ai-design, `motion`, `copy`) |
| `skip=motion` | run everything except those phases |
| `personality=color` (or type, motion, texture, copy, surprise, none) | answer the Step 3 question in advance |
| `resume` | continue from `.glow-up/state.json`, skipping finished phases |
| `status` | print which phases are done, with commit hashes, and stop |
| `revert <phase>` | revert that phase's commit (confirm first) and stop |
| `fast` | skip screenshots; verify with markup/build checks only |

No arguments means the full flow on the current project. If an argument is ambiguous, ask once.

Keep `.glow-up/state.json` up to date after every phase: `{"root": "...", "branch": "glow-up", "phases": {"design": {"status": "done", "commit": "abc123"}}, "personality": null}`. It is what makes `resume`, `status` and `revert` work, and it survives a closed session.

## Principles
- Preserve what is intentional. A choice that looks odd but fits the vibe stays.
- Fewer, stronger changes beat many timid ones. Ten tweaks nobody notices are worse than three the whole page feels.
- Never change meaning, prices, names, links, or legal text without asking.
- If the user's taste conflicts with design theory, say so once, briefly, then follow the user.
- Skip any phase that finds nothing worth doing. Don't invent work.

## Step 0: Setup
1. **Find the root and stack.** Look for package.json, next/vite/astro config, or plain index.html. Note framework, styling (Tailwind, CSS modules, plain CSS), animation libs, and where tokens and copy live. Ask only if several projects are plausible.
2. **Protect the work.** If it is a git repo: check the tree is clean (or ask to stash), create branch `glow-up`, and commit after every phase as `glow-up: <phase>`. If not a repo: copy the folder to `<name>-backup-<date>` beside it first (skip huge asset folders if they are untouched, and say so) and tell the user the path. Then ask whether a `git init` is OK so per-phase commits work; if you can't ask (non-interactive) or the user declines, record before/after file copies per phase instead and report those paths in place of commit hashes.
3. **Baseline screenshots** of 3-5 key pages at 1440, 768 and 390 px wide into `.glow-up/before/` (keep this folder out of git via .gitignore or .git/info/exclude). Use Claude in Chrome or the built-in browser if available, else `scripts/shoot.mjs` (Playwright; it scrolls first so reveals finish, and its header says how to install Playwright in a scratch dir), else say screenshots are unavailable and verify via markup and computed styles instead. Start the dev server with the project's own script; don't guess ports.
4. **Check companions** against the skill list: `/design:design-critique`, `/impeccable`, `/gsap-core`, `/gsap-scrolltrigger`, `/gsap-timeline`, `/gsap-react`, `/gsap-performance`, `/frontend-design`. Record which exist and tell the user in one line. Invoke them where they fit a phase (critique tools in design-theory-pass, `/gsap-*` in motion-pass); a plain static page may need little from them, and that's fine. Missing ones never block; each sub-skill has built-in fallbacks.

## Step 1: Vibe and feel read
Look at the screenshots and source, then write about 8 lines:
- Intended feeling (what the site is trying to make a visitor feel)
- Audience
- What actually comes across today
- Biggest gap between the two
- 3 qualities to protect, 3 to avoid

Show it to the user and wait for a yes or correction. Save the approved text to `.glow-up/vibe.md`. Every later phase quotes it when choosing between options, so a wrong read poisons everything; this is the one checkpoint worth blocking on.

## Step 2: The four phases
Run each by invoking the skill, passing the vibe read and companion list as context. If invoking isn't possible, read its SKILL.md and follow it.

1. `design-theory-pass`, then re-screenshot into `.glow-up/after-1/`, commit.
2. `de-ai-design`, then re-screenshot into `.glow-up/after-2/`, commit.
3. `motion-pass`, then re-screenshot and check scroll behavior and jank, commit.
4. `de-ai-copy`, then check text overflow and wrapping at 1440/768/390 (new text lengths break layouts), fix, commit.

When a phase hits a decision only the user can make (replace the animation library? is this oddity a choice?), batch the questions and ask once rather than interrupting repeatedly.

## Step 3: Personality layer (optional)
Ask: "Want a personality layer on top? Color (richer palette), Type voice, Motion signature, Texture and detail, Copy voice, Surprise me, or skip." If yes, follow `references/personality.md`. If no, move on.

## Step 4: Final report
Keep it to one screen:
- Vibe before vs. after (two sentences)
- Changes per phase, one line each, with commit hash
- Risky items (layout structure, dependencies, copy with nuance) and how to revert: `git revert <hash>` per phase
- Things to check by eye (specific pages and breakpoints, the motion, copy that carried nuance)
- Where the before/after screenshots are

Don't merge `glow-up` into the main branch; the user decides.
