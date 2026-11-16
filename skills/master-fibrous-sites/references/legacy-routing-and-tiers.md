# Historical routing and tier notes

Retained for reference. Current preferences and verified capability take precedence. Do not load by default.

## 2. Master Multi-Model Routing Table

**Vision Rule (`eye` role):** use a connected model that can actually inspect images and has passed the Section 0 probe. Astra, Opus and GLM 5.3 Flash are candidates when available. Do not assume every model can see or every agent can run browser tools. A model without verified vision is limited to DOM, computed styles, Playwright assertions, axe, Lighthouse and pixel-diff numbers.

| Stage | Task & contract | Primary model (`effort`) | Support model(s) |
| :--- | :--- | :--- | :--- |
| **1-2 Scan / Pick / Intake** | `_research/status.md`, `NN-brand-freeform.md`, folder classification, build-exit checks | `glm-5.3-flash` (`low`) | `sol` (`low`) only to pick between tied prompts |
| **3 Concept & Copy** | `concept.md` (Angles, Voice, Copy 5+ pages, Content) | `sonnet-5.5` (`medium`) | `luna` (`low`) drafts 3 alternative headline/CTA sets Sonnet may adopt; `glm-5.3-flash` banned-word and length lint |
| **4 Research & Scorecard** | `research.md`: N=10 sites, synthesis, ranked 8-10 decisions, 8-criteria scorecard | `sol` (`medium`) | `eye` (`low`) visually inspects the top 3-5 benchmark sites via browser screenshots to score Imagery/Typography/Motion honestly |
| **4b Directions & Plan** | `design-plan.md` Part A + Part B + Aesthetic Anchor | `opus-5.5` (`low`, **never higher**) merges and writes Part B | `sonnet-5.5` (`medium`) drafts Part A in parallel; `opus-5.5` critiques both |
| **4c-i Asset Inventory** | `assets.md` | `glm-5.3-flash` (`low`) | `deepseek` (`low`) sets pixel sizes and responsive `srcset` budgets |
| **4c-ii Asset Prompts & 3D Specs** | `assets-prompts.md`: Master Style Block, prompts for verified image/video routes, 3D GLB specs | Antigravity prompt writer when callable; otherwise best connected prompt writer | Vision-capable reviewer checks continuity; technical model writes 3D specs as needed |
| **4d Asset Studio (Section 3c)** | Generate, judge and iterate approved images/video into `assets/` through the best value verified path | Separate image/video worker selected per asset, independent of coder model | `eye` judges actual outputs; inexpensive worker keeps ledger and optimizes files |
| **5 Build** | `<project-root>/<site-slug>/` | Recommend best connected frontend coder for selected direction; honor `build=` and user preference | Technical specialist handles scroll-scrub math, Three.js/WebGL and shaders when central |
| **5b Option Heroes (on request)** | `_options/NN-brand/<slug>/index.html` | `glm-5.3` (`low`) x N in parallel (Antigravity workers if available) | `eye` picks the strongest proof by screenshot |
| **6 Hard Gate** | `audit.mjs`, Lighthouse mobile, 1440/390 DOM, `REPORT.md`, benchmark rescore | `sol` (`medium`): Playwright/axe/Lighthouse | `eye` (`medium`) visual rescore; `opus-5.5` (`low`) spot-checks near-median scores; `glm-5.3-flash` writes `REPORT.md` tables |
| **7 Fix Loop & Showcase** | remediation, then Step 7 summary | `sol` (perf/a11y), `opus-5.5`/`sonnet-5.5` (design/motion/copy) | `glm-5.3-flash` formats the checklist and asset list |
| **8 Assets Landed** | optimize and wire real assets | `sol` (`low`): ffmpeg, sharp, WebP/AVIF, gltf-transform | `deepseek` verifies GLB orientation/scale/origin; `glm-5.3-flash` checks filenames, ratios, sizes vs `assets.md` |
| **9 Glow-Up** | Section 4, Step G | `eye` (vision) + `opus-5.5`/`sonnet-5.5` (fixes) | `glm-5.3-flash` copy overflow/wrap checks; `deepseek` motion-jank and signature math; `sol` audits |
| **10 Cleanup** | delete list, fold files | `glm-5.3-flash` (`low`) | main thread asks the user |

Routing rule: use the table as a menu of candidate roles, not a fixed provider chain. Choose connected models by demonstrated ability and budget. Prefer Antigravity for prompt writing when working; use Sol or another strong researcher for research, a strong language model for copy, a vision-capable reviewer for screenshot critique, and a capable frontend coder for implementation. Explain the recommended build model and invite a user preference at the direction checkpoint. A coder's provider has no bearing on the selected image/video worker.

---

## 3. Quota, Rate-Limit & Credit Exhaustion Protocol (Weave Guard)

**Failover mode (default `failover=auto`; `failover=ask` restores the manual prompt below).** Switching is automatic but **never silent**: every switch prints one line (`Claude usage at 100%: Stage 4b moved opus-5.5 -> sol (high). Reason: ...`), is logged, and is repeated in the Finish report.

**Triggers:** Weave's usage meter for a provider at **100%**, or `HTTP 429`, `insufficient_quota`, `credit_balance_too_low`, token-cap exhaustion, or a user budget threshold. **Pre-emptive:** at **95%** of a provider's allowance, do not start a new stage on that provider; route it straight to its fallback (a stage that dies mid-way wastes more than the switch costs). If a stage is already running when 100% hits, checkpoint it, then continue the same stage on the fallback.

**Provider chains (Claude family exhausted -> OpenAI-class and GLM alternatives):** the fallback table below is the chain; `sol`, `luna` and `astra` are the OpenAI-side models, `glm-5.3`/`glm-5.3-flash` and `deepseek` the budget side. Prefer an OpenAI-side model for taste/reasoning stages and a GLM model for build/mechanical stages, per the table. Stages that need sight use only models that passed the Eye calibration. If every option in a chain is also exhausted, **then** stop: checkpoint, and ask the user (the manual prompt below).

**Return path:** at every stage boundary, re-check the preferred model's meter; when its allowance resets, route new stages back to it and log the switch back. Do not move a half-finished stage back.

**Taste-critical stages** (4b Part B, flagship/elite build, Step G design pass) still auto-switch when `failover=auto`, but the Finish report lists them under "ran on fallback model" so the user can re-run that stage on the preferred model after reset (`/master-fibrous-sites resume restage=4b`).

Procedure on a trigger: `HTTP 429`, `insufficient_quota`, `credit_balance_too_low`, token-cap exhaustion, or a user budget threshold:

1. **Freeze & checkpoint.** Flush partial work to `_research/NN-brand/` or `.glow-up/state.json` with `status: "paused_quota"`, `stage`, `exhausted_model`, `resume_from`.
2. **Look up the fallback** for the exact stage modality:

| Exhausted | Stage type | #1 Recommended | #2 Budget | Trade-off to state |
| :--- | :--- | :--- | :--- | :--- |
| **Opus 5.5** | 4b plan, flagship build, glow-up design pass | `sonnet-5.5` (`medium`) with strict `anti-ai-glowup` anchor rules, or `astra` if available (design judgment) | `sol` (`high`) | Astra keeps visual taste; Sonnet writes clean UI but needs explicit anti-slop rules. |
| **Sonnet 5.5** | copy, standard build, `de-ai-copy` | `sol` (`medium`) for build; `luna` (`medium`) or `opus-5.5` (`low`) for copy | `glm-5.3` (`high`), builds and DOM-based checks only, never screenshot judgment | Sol matches React/Tailwind speed; GLM is cheapest but less nuanced on brand copy. |
| **Eye** (default `glm-5.3-flash`) | gate visual scoring, `vibe.md`, `hand-redraw`, asset judging, `visual-critique:*` | `sonnet-5.5` (`medium`) | `opus-5.5` (`low`) or `luna` if it passed calibration | Only models that passed the Eye calibration may judge sight work. Re-run calibration on the replacement. |
| **Sol** | research, gate CLI/Lighthouse, asset optimization, a11y/perf fixes | `glm-5.3` (`high`) | `sonnet-5.5` (`low`) | GLM handles terminal work and Lighthouse remediation cheaply. |
| **Luna** | prompt writing; image generation only if a real image-capable tool is exposed | Antigravity or another capable prompt writer; verified separate image worker | Another connected image worker within the approved budget | A Luna coder session does not imply image generation is available. |
| **GLM 5.3** | option heroes, bulk components, placeholder builds | `sol` (`low`) | `deepseek` or `sonnet-5.5` (`low`) | Slightly higher cost, same accuracy. |
| **GLM 5.3 Flash** | scan, inventory, lint, reports, cleanup lists | `glm-5.3` (`low`) | `sol` (`low`) | Marginal cost increase only. |
| **DeepSeek** | GLB specs, WebGL/shaders, scrub math | `sol` (`medium`) | `glm-5.3` (`high`) | Both handle Three.js and matrix math cleanly. |

3. **`failover=auto`:** pick the table's **#1 Recommended** fallback (or #2 if #1 is also at 100% or fails the Eye calibration for a sight stage), apply it as a `session-override` for the exhausted provider's remaining stages, print the one-line notice, and continue. **`failover=ask`, or when the whole chain is exhausted:** ask once, in a single structured Weave prompt, and wait:
   > **Model Quota / Credit Limit Reached:** `[Exhausted Model]` hit its limit during **Stage `[X]: [Name]`**. State is checkpointed at `[path]`.
   > 1. **[Recommended] Switch to `[#1]` (`[effort]`)**: *[reason + trade-off]*
   > 2. **Switch to `[#2]` (`[effort]`)**: *[budget/speed trade-off]*
   > 3. **Apply #1 for the rest of this session** (`session-override` for every remaining stage on `[Exhausted Model]`)
   > 4. **Pause run** (top up or wait, then `/master-fibrous-sites resume`)
4. **Vision guard:** if the stage needs screenshots and the chosen model has not passed the Eye calibration, reject it and re-ask with calibrated options only.
5. Log every switch in `decisions.md` (timestamp, stage, from, to, trigger %, auto vs asked, one-off vs session-override), including switches back.

---

## 3b. Quality Tiers (what we sell, what the pipeline does)

Pick the tier from `tier=` or the stated budget; otherwise infer from the brief and state the assumption. A $1,000 brief maps to Starter. Price bands are AUD scope guidance, never shown on the site unless the business itself sells those services.

| | **Starter** (~$500-1,000) | **Studio** (~$2,500-4,000) | **Flagship** (~$10,000) | **Elite** ($15,000+) |
| :--- | :--- | :--- | :--- | :--- |
| **What it is** | A clean, premium brochure site in the class of rolex.com/en-au: confident layout, great photography, restrained motion, 3-5 pages, template-led | Fully custom design system, 5-8 pages, tasteful GSAP motion, light CMS | The real $10k: custom brand DNA, cinematic scroll-animated hero, 8+ pages, schema SEO, analytics, deploy pack, delivered with a client experience | Flagship plus 3D/WebGL, multiple signature interactions, art-directed shoot, case-study-grade storytelling |
| **Benchmark N** | 3 | 6 | 10 | 10 plus 3 awards-class sites |
| **Part A directions** | 3 | 3-4 | 4-5 | 5 |
| **Motion** | CSS + minimal GSAP | GSAP + ScrollTrigger reveals | One signature scrubbed/pinned hero + choreographed page | Multiple signatures, 3D scenes, shaders |
| **Assets** | Image prompts only | Image prompts, one short video | Hero film, full image set, style block | Hero film, image set, GLB models, shader assets |
| **Pipeline** | Focused research and three concept directions; Part B after user choice; asset generation as needed | Full, research N=6 | Full, all stages, Client Pack | Full + 3D track + one extra gate loop |
| **Default build model** | `sonnet-5.5` low, or `glm-5.3` high | `sonnet-5.5` medium | Auto-pick (Step 5) | `opus-5.5` low + `deepseek` |
| **Gate bar** | Median on 6 of 8, Lighthouse perf >= 85, a11y/BP/SEO >= 95 | Median on all 8, perf >= 90 | Median on all 8 + Best-in-Set on 2, perf >= 90 (aim 95) | Median on all 8 + Best-in-Set on 4, perf >= 90 |
| **Polish (Step G)** | Optional | Recommended | Always: phases 1-5 + execution gaps | Always + personality layer + signature coverage |
| **Client Pack** | Short README | README + handover | Full Client Pack | Full Client Pack + case-study draft |

**Scope honesty.** A Starter must still look expensive (type, spacing, photography, restraint) but does not get a brand-DNA pass, a hero film, or a scrubbed signature interaction. Never quietly upgrade or downgrade a tier; if the brief needs more than the tier allows, say so and ask.

**Flagship/Elite "real $10k" components** (what separates it from a cheap site):
1. **Brand DNA capture.** If the client has an existing site, extract colours, fonts, imagery and copy tone into `_research/NN-brand/brand-dna.json` (Firecrawl if a connector is available, else the built-in browser / DOM extraction). The new site is custom to that DNA, never a template.
2. **Cinematic hero.** A 5-7 second hero film: key art generated by `luna` / Antigravity image tool, a real clip generated by whichever video tool probes true, else a Google Flow prompt with start/end frames in `assets-prompts.md`. Poster frame and mobile fallback always shipped.
3. **Multi-page, one system.** 8+ pages sharing one design system and nav; mobile tested; Lighthouse mobile numbers recorded.
4. **SEO and analytics built in.** Run the `seo` skill: titles, meta, Open Graph, JSON-LD schema, sitemap, robots, alt text. Analytics wired but disabled until the client supplies an ID.
5. **Deploy pack.** Vercel/Netlify config, domain and DNS notes, one-command deploy script. **Do not push or deploy**; hand the user the exact commands (repos are local-only by choice).
6. **Client Pack** in `portfolio/NN-brand/CLIENT-PACK/`: `questionnaire.md` (brand questionnaire), `project-plan.md` (tasks, owners, deadlines), `project-brief.md` (objectives, scope, requirements, sign-off block; in a real engagement no design starts before sign-off), `presentation-script.md` (guided tour of the site as the customer sees it, with the reasoning behind each design decision), `testimonial-request.md` (testimonial and referral ask), `handover.md` (edit, host, back up).
7. **Outcome framing.** The brief states measurable objectives (enquiries, bookings, sales) so the price is justified by outcomes, not page count.

