# Personality layer

A polished site can still feel anonymous. Personality is a small set of consistent, memorable decisions. It comes after the four phases because it needs clean tokens, a settled layout, and settled copy to build on.

## Process
1. **Propose a named personality** in 3-4 sentences. Name it ("Field Notes", "Night Shift Garage", "Soft Brutalist"). Say what it feels like, which two or three levers carry it, and what it deliberately is not. Ground it in the vibe read and the site's real subject, audience and brand assets, never in what is trending.
2. **Get a yes.** Offer one alternative at most. Don't build until approved.
3. **Write the signature inventory** (below) if the personality adds a recurring element. Do this before any code.
4. **Pull only the levers that serve it.** Using all of them makes noise; a personality is mostly restraint.
5. **Verify with the coverage check** (below), screenshots, a performance check, and the guardrails. Commit as `glow-up: personality`.

If the user picked a lever up front (Color, Type voice...), still do steps 1-2 but scoped to that lever.

## Levers

**Color.** Derive from the brand or subject: a logo, a product photo, a material, a place. Build a small ramp: one dominant hue, one sharp accent, neutrals tinted toward the hue (not pure gray). Assign roles (surface, text, accent, signal) as tokens. Check AA contrast. An accent used rarely is what makes it feel intentional.

**Type voice.** One characterful display face for headings with a quiet text face (or one variable family used across its range). Pick for the subject: editorial serif, grotesk, mono for technical, rounded for friendly. Tune tracking, weight and size contrast; a big jump between headline and body does more than a fancy font. Self-host, subset, `font-display: swap`, limit weights.

**Motion signature.** One distinctive idea reused everywhere: a clip-path wipe, a weighted overshoot, lines that draw in, cursor-follow, a "curtain" section change. Reuse across reveals, hovers and transitions so it reads as a trademark. Coordinate with `motion-pass` and its `references/gsap-recipes.md`.

**Texture and detail.** Grain or paper noise at very low opacity, hairline rules, custom selection color, styled focus ring, designed 404, favicon, scrollbar, a cursor treatment on key elements, a consistent photo treatment (duotone, crop), small details in the footer. Keep each cheap and consistent.

**Copy voice.** Define the voice in 3 rules (e.g. "short, dry, concrete, first person"). Rewrite headlines, empty states, errors, buttons and microcopy to match, then run `de-ai-copy` over the result. Confirm anything that changes meaning.

**Surprise me.** Pick the one or two levers with the biggest gap in the vibe read and run the process above, still naming the personality and getting a yes.

## Signature inventory, build and coverage

A signature is anything the personality repeats so the site reads as one thing: a motif (a thread, a rule, a stamp), an accent colour, a texture, a recurring device. Signatures fail by being half-installed: present on the homepage, missing on the 404, drawn as five scratches instead of one strand. A screenshot of the hero cannot show that, so the spec and the check below are mandatory. Save the spec to `.glow-up/signature.md` before building.

**1. Spec** (a few lines per signature):
- *What*: one sentence naming the physical idea ("a jute fibre hanging and swaying down the page").
- *Where*: every route, or a named list. Derive the list from the router or filesystem (Next `app/**/page.tsx` and `pages/**`, Astro/Vite pages, plain `*.html`), plus the 404, error, and legal/policy pages. Never from memory. Write the list into the spec.
- *Surfaces*: what it may touch (backgrounds, decorative SVG, dividers) and must never touch (text, controls, focus ring, anything that carries meaning).
- *Kind*: **continuous** (one object across the page: thread, line, rail) or **discrete** (repeated marks). Say which; the checks differ.
- *Hook*: the one selector the check will count, e.g. `[data-signature]`, and the token that colours it.

**2. Build through one shared thing.** One component plus one token (`--signature`), mounted from the shared layout, footer, or section wrapper so new pages inherit it. Per-page placement is a last resort; if you must, add it to every route in the spec. Why: anything wired page by page gets forgotten on the next page someone adds.

**3. Continuity (continuous kinds).** Each segment starts where the previous one ended; measure endpoints in screen space, not by eye. Chain from a fixed anchor to a fixed anchor (e.g. page centre at the top, into the footer). Segments that begin at their own convenient x are the scratches failure.

**4. Shape intent.** Check that the geometry matches the sentence in the spec (`--max-lateral` automates the sideways-versus-drop part). For something that hangs, keep sideways travel small against the vertical drop; a long lateral move over a short join flattens into a swoosh. Look at 1440 and 390, since narrow screens squash the ratio.

**5. Graceful states.** Final state must show with JS off and under `prefers-reduced-motion`: a static, fully drawn version. Grep CSS for rules that hide the signature before JS runs (`opacity:0`, `visibility:hidden`, `stroke-dashoffset`, `.pending`) and gate them behind a class that JS sets (see the `html.m-on` pattern in `motion-pass/references/gsap-recipes.md` section 10). Make sure comments don't claim more than the rule does.

**6. Coverage check (run it, do not eyeball).** Serve the site, then:
```
node <skill-dir>/scripts/signature-coverage.mjs --base http://localhost:3000 \
  --routes /,/about,/contact,/__missing --selector "[data-signature]" --token --signature --continuous   --max-lateral 0.3 --avoid-text
```
Use `--continuous` only for continuous kinds, `--max-lateral` (sideways extent over vertical drop, per segment) for motifs meant to run down the page, and `--avoid-text` whenever the spec says the signature must not touch text or controls. Include a nonexistent route so the 404 is covered. It runs every route at 1440, 390, 1440 with reduced motion, and 1440 with JS off, and reports per route: element count, computed colour against the token, visible and fully drawn after scrolling the whole page, and (continuous) breaks between consecutive segments (end x against next start x, 1px tolerance), the sideways/drop ratio, and crossings of text or controls. Exit code 1 means fail. See `references/signature-coverage.md` for options and how to read the output.

**The personality step fails if any route has 0 elements, any element has the wrong colour or is hidden, or any continuous chain has a break.** Fix and rerun; a failing route is a bug in the build, not something to report as "mostly done". A single-page screenshot never marks this step done. A shape or overlap failure means the geometry or its position is wrong: change the path or the gutter, not the thresholds. Still glance at the 1440 and 390 screenshots for taste; the script judges geometry, not beauty.

If you discover a signature that already exists half-installed (a leftover component used on one page), treat it as an inventory item: spec it, move it to the shared mount, fix the chain, and rerun the check.

## Guardrails
- **Performance budget:** roughly 100KB or less of added JS/CSS (gzip), fonts under ~150KB total, images optimized; LCP and CLS must not regress. Measure before and after if tooling exists.
- **prefers-reduced-motion:** every new motion has a calm or static fallback.
- **Visible focus:** custom cursors, textures and effects never hide or replace keyboard focus indication.
- **Contrast and legibility:** texture, color and type choices keep AA contrast and 16px+ body.
- **Usability beats personality.** If a flourish slows a task, hides navigation, or confuses, cut it.
- **Restraint:** one signature per layer. If you can't describe the personality in one sentence, it's too much.
