---
name: de-ai-copy
description: Find AI-sounding copy in an already-built website, run it through the user's LOCAL offline humanizer (Node project on 127.0.0.1, nothing leaves the machine), then simplify it by hand into plain, specific, human language. Use whenever the user says the website copy sounds like ChatGPT/AI, robotic, corporate, buzzwordy, generic, or fluffy; asks to humanize, de-AI, simplify, tighten, or rewrite site text, headlines, hero copy, about page, CTAs, or microcopy; or mentions words like seamless, elevate, unlock, supercharge, em dashes, "not just X but Y". Also use as the copy phase of a site glow-up.
argument-hint: "[path|url] [audit]"
---

# De-AI Copy

Invoked as `/de-ai-copy`: arguments are `$ARGUMENTS` (a project path or dev-server URL, and/or `audit`). With `audit`, produce the findings and recommended changes but edit nothing, so the user can pick what to apply. Without a path, use the current project.

AI copy has a cadence: vague superlatives, triplets, "not just X, but Y", em dashes everywhere, buzzwords that say nothing. The fix is two passes: the user's local humanizer strips the mechanical tells, then a manual pass makes the text concrete. The humanizer was built for cold sales emails, so treat its output as a candidate to compare, never a verdict.

## Privacy rule
Only ever call `127.0.0.1`. Never send site content to external detectors, humanizer sites, or APIs, and never paste it into web tools. The user chose a local pipeline specifically so the content stays on their machine. If the local tools can't run, fall back to the manual pass, not to a cloud service.

## 1. Inventory the copy (in source, not the DOM)
Find where text lives: JSX/TSX, Astro/Vue/Svelte templates, MDX/Markdown, JSON/YAML content files, i18n catalogs, CMS seed files, plain HTML. Build a list of units: `{file, key or line, text}`.

Worth humanizing: headlines, subheads, hero text, paragraphs, feature and service descriptions, about text, long CTAs, meta descriptions.
Also inventory text outside the body: `<title>`, meta and og descriptions, `aria-label`/`alt` text, and em dashes inside HTML attributes.
Leave alone: nav and footer labels, buttons under ~4 words (but review for generic ones like "Get started"), names, prices, numbers, dates, legal and policy text, code, aria labels unless clearly robotic, anything in another language than the one you're editing, quoted testimonials (real quotes aren't ours to edit).
If the site is multilingual, edit one locale at a time and tell the user other locales aren't touched.

Show the user a short summary of how many units you'll process and which areas you're skipping, then continue (don't wait unless something is ambiguous).

## 2. Preflight the humanizer
1. Locate the folder named `humanizer` (check the user's usual project folders first; ask for the path if you can't find it). Read its `package.json`, `server.js`, and README if present to confirm the start script and route; don't assume.
2. Check if the server is up: `curl -s http://127.0.0.1:4177/ -o /dev/null -w "%{http_code}"`. If not, start it with its real script (`npm start` in that folder) in the background, and wait for it to answer.
   **Verify it is the current local-only code.** Send one short test sentence and read the response `stages`/`note`. A server started from older code may mention external detectors (`zerogpt`, `sapling`, "no API key", "no detector available"); the current `pipeline.js` scores with the offline `localdetect.js` only. If the response shows any external detector, don't use that process (it could call out if keys were ever set). Start a fresh instance from the current files on another port (`PORT=4178 node server.js` in the humanizer folder) and use `--port 4178`; don't kill the user's running process.
3. If the server won't run, write a throwaway Node script (in a temp/scratch directory, not in the user's site) that imports `humanizeAuto` from `pipeline.js` and `factsPreserved` from `humanize.js` after reading their real exports.
4. Check Ollama: `curl -s http://127.0.0.1:11434/api/tags`. If it isn't running, or none of the humanizer's models (see `MODELS` in `llm.js`, overridable via `HUMANIZER_MODELS`) are pulled, use `mode: "rules"` and tell the user the model pass was skipped. Never `ollama pull` without asking (large download).
5. If every unit comes back unchanged, read the `note` field before assuming the text is clean: it says why (no detector, no model).
Optionally run `npm test` in the humanizer folder once if the server was freshly started and something looks off.

## 3. Run the humanizer in small units
The confirmed interface (verify against `server.js`): `POST http://127.0.0.1:4177/api/humanize` with JSON `{text, mode, strength}`; `mode` is `rules` (offline, instant), `auto` (default: rules, then local model only if the detector score exceeds `HUMANIZER_LOCAL_MAX`, default 36), or `ai` (always model); `strength: 0` skips the model; text up to 20000 chars, body up to 100 KB. Response: `{text, engine, chosen, stages, note, factsPreserved}`.

Use `scripts/humanize_units.mjs` to batch it: it takes a JSON file of units, calls only 127.0.0.1, one unit per request, and writes results with before/after, `factsPreserved`, and length ratio. Example:
```
node <skill-dir>/scripts/humanize_units.mjs units.json results.json --mode auto
```
Process one element or paragraph at a time. Whole pages in one request lose structure and trip the fact guard.

Accept or reject each result:
- Reject if `factsPreserved` is false (URLs, names, numbers must survive).
- Reject or hand-edit if meaning changed, length changed more than ~30% for a headline or ~40% for a paragraph, brand voice flattened, or it added email-isms ("Quick note:", "Hope you're well", greetings, sign-offs). The tool is tuned for cold emails and may do this.
- Compare before and after side by side. Often the right move is to take the humanizer's removal of a buzzword and keep your own phrasing around it.

Expect rules mode to be a minor assist: it mostly swaps em dashes for commas, which can create comma splices. The manual pass does the real work, so don't treat "humanizer ran" as "copy is done". Result fields in the script output are `before`, `after`, `factsPreserved`, `lengthRatio`, `accept`.

## 4. Manual simplify pass
Apply to every unit that survives, including ones the humanizer left untouched. See `references/ai-cadence.md` for patterns and rewrites. In short:
- Shorter sentences, plain words, concrete nouns (say what it is, who it's for, what happens next).
- Specific CTAs ("Book a 20-minute call", "See the 3 plans") instead of "Get started" / "Learn more".
- Cut filler and vague superlatives; keep a claim only if it can be backed by a fact on the page.
- Break AI cadence: "not just X, but Y", triplets by reflex, "In today's fast-paced world", "elevate/unlock/seamless/supercharge/empower/leverage", em-dash overuse, rhetorical question openers.
- Keep the brand voice from the vibe read (`.glow-up/vibe.md`) if present; otherwise infer from the most human-sounding existing copy and match it.
- Never change meaning, claims, prices, names, links, or legal text without asking. If a claim looks made up (stats, customer counts), flag it instead of polishing it.

## 5. Edit the source safely
- Edit only the text, preserving JSX structure, tags, interpolations (`{name}`, `%s`, `{{var}}`), i18n keys, HTML entities and escaping (`&apos;`, `\"`, `\u2019`), line breaks that are meaningful, and Markdown syntax.
- Prefer small targeted edits per unit over rewriting whole files. Re-read the file after editing; run the build/lint/tests.
- Typographic consistency: replace em dashes with periods, commas or colons as the sentence needs; keep curly or straight quotes consistent with the file.

## 6. Check layout after the edit
New text lengths change wrapping. At 1440, 768, and 390 px check headings, buttons, cards, and nav for overflow, clipped text, or orphaned words (screenshots with Claude in Chrome / built-in browser / Playwright, or compare lengths if unavailable). Fix with copy trimming first, CSS second.

## 7. Report
A before/after list: `file : key : before : after : how (humanizer / manual / both)`, plus items you deliberately left alone, items flagged for the user (suspect claims, text that needs real facts), whether the model pass ran or only rules, and the humanizer engine/scores if available. Commit as `glow-up: de-ai-copy` (or a plain message when standalone).
