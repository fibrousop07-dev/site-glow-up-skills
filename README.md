# site-glow-up-skills

Five [Claude Code](https://claude.com/claude-code) skills for polishing websites that are **already built**: design fundamentals, removing "AI-generated" tells, GSAP motion, and de-AI-ing the copy. One orchestrator runs the others in order, each phase on its own git commit so anything can be reverted.

| Skill | Use it for |
|---|---|
| `site-glow-up` | Full pass: vibe read, then the four skills below, then an optional personality layer |
| `design-theory-pass` | Hierarchy, spacing, type, contrast, responsive, accessibility, states; fixes at the token level |
| `de-ai-design` | Purple gradients, glass, glow, three-card templates, emoji icons, stock imagery, replaced with brand-specific decisions |
| `motion-pass` | A motion language, GSAP timelines and ScrollTrigger, reduced-motion support |
| `de-ai-copy` | Finds AI-sounding copy, runs it through a **local** humanizer (127.0.0.1 only), then simplifies by hand |

Each skill works on its own. The orchestrator works even if companion skills (`/impeccable`, `/design:design-critique`, `/gsap-*`, `/frontend-design`) are missing; it falls back to built-in guidance.

## Install

Copy (or symlink) the folders in `skills/` into your user skills directory:

```bash
git clone https://github.com/fibrousop07-dev/site-glow-up-skills
cp -r site-glow-up-skills/skills/* ~/.claude/skills/
```

On Windows PowerShell:

```powershell
git clone https://github.com/fibrousop07-dev/site-glow-up-skills
Copy-Item -Recurse site-glow-up-skills\skills\* $HOME\.claude\skills\
```

Restart Claude Code. The skills are then available from any folder.

## Use

```
/site-glow-up                          full flow on the current project
/site-glow-up audit                    findings only, change nothing
/site-glow-up only=design,ai           just some phases (design, ai, motion, copy)
/site-glow-up skip=motion              everything except some phases
/site-glow-up personality=color        pre-answer the personality question
/site-glow-up resume | status          continue, or show progress
/site-glow-up revert <phase>           revert one phase's commit
/site-glow-up <path or url> fast       point at a project or dev server, skip screenshots
```

The focused skills take `[path|url] [audit]`, for example `/de-ai-copy audit`. You can also just describe what you want ("this site looks AI-generated, fix the design") and the right skill triggers.

The orchestrator works on a `glow-up` git branch (or a backup folder if the project isn't a repo), commits after each phase, and never merges for you.

## The de-ai-copy humanizer

`de-ai-copy` expects a local HTTP humanizer: `POST http://127.0.0.1:4177/api/humanize` with `{text, mode, strength}`, returning `{text, engine, chosen, stages, note, factsPreserved}`. `scripts/humanize_units.mjs` batches units through it and only ever calls `127.0.0.1`. The humanizer itself is not included. Without one, the skill skips that step and does the manual simplify pass (see `references/ai-cadence.md`). Site content is never sent to an external service.

## Requirements and notes

- Optional but useful: Playwright (for `site-glow-up/scripts/shoot.mjs` screenshots) or a browser tool, and Node for the batch script.
- The personality layer writes a signature spec, must pass `site-glow-up/scripts/signature-coverage.mjs` on every route (count, token colour, visible without JS, chain breaks, shape, smoothness, contrast, clearance from text/media/edges, no sideways scroll), and then gets a visual review by a fresh reviewer against a rubric (`references/signature-review.md`). `node scripts/selftest.mjs` checks the script itself (16 scenarios). Whether it is beautiful stays the user's call.
- `argument-hint` in the frontmatter is a Claude Code feature; other skill hosts may ignore or reject it.
- These were tested on two real static sites, and the personality layer on small Next.js fixtures (clean, and with a half-installed motif). Trigger descriptions were reviewed by hand; they were not tuned with an automated optimizer.

## License

MIT
