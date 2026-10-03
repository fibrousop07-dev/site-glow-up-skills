# Personality layer

A polished site can still feel anonymous. Personality is a small set of consistent, memorable decisions. It comes after the four phases because it needs clean tokens, a settled layout, and settled copy to build on.

## Process
1. **Propose a named personality** in 3-4 sentences. Name it ("Field Notes", "Night Shift Garage", "Soft Brutalist"). Say what it feels like, which two or three levers carry it, and what it deliberately is not. Ground it in the vibe read and the site's real subject, audience and brand assets, never in what is trending.
2. **Get a yes.** Offer one alternative at most. Don't build until approved.
3. **Pull only the levers that serve it.** Using all of them makes noise; a personality is mostly restraint.
4. **Verify** with screenshots, a performance check, and the guardrails below. Commit as `glow-up: personality`.

If the user picked a lever up front (Color, Type voice...), still do steps 1-2 but scoped to that lever.

## Levers

**Color.** Derive from the brand or subject: a logo, a product photo, a material, a place. Build a small ramp: one dominant hue, one sharp accent, neutrals tinted toward the hue (not pure gray). Assign roles (surface, text, accent, signal) as tokens. Check AA contrast. An accent used rarely is what makes it feel intentional.

**Type voice.** One characterful display face for headings with a quiet text face (or one variable family used across its range). Pick for the subject: editorial serif, grotesk, mono for technical, rounded for friendly. Tune tracking, weight and size contrast; a big jump between headline and body does more than a fancy font. Self-host, subset, `font-display: swap`, limit weights.

**Motion signature.** One distinctive idea reused everywhere: a clip-path wipe, a weighted overshoot, lines that draw in, cursor-follow, a "curtain" section change. Reuse across reveals, hovers and transitions so it reads as a trademark. Coordinate with `motion-pass` and its `references/gsap-recipes.md`.

**Texture and detail.** Grain or paper noise at very low opacity, hairline rules, custom selection color, styled focus ring, designed 404, favicon, scrollbar, a cursor treatment on key elements, a consistent photo treatment (duotone, crop), small details in the footer. Keep each cheap and consistent.

**Copy voice.** Define the voice in 3 rules (e.g. "short, dry, concrete, first person"). Rewrite headlines, empty states, errors, buttons and microcopy to match, then run `de-ai-copy` over the result. Confirm anything that changes meaning.

**Surprise me.** Pick the one or two levers with the biggest gap in the vibe read and run the process above, still naming the personality and getting a yes.

## Guardrails
- **Performance budget:** roughly 100KB or less of added JS/CSS (gzip), fonts under ~150KB total, images optimized; LCP and CLS must not regress. Measure before and after if tooling exists.
- **prefers-reduced-motion:** every new motion has a calm or static fallback.
- **Visible focus:** custom cursors, textures and effects never hide or replace keyboard focus indication.
- **Contrast and legibility:** texture, color and type choices keep AA contrast and 16px+ body.
- **Usability beats personality.** If a flourish slows a task, hides navigation, or confuses, cut it.
- **Restraint:** one signature per layer. If you can't describe the personality in one sentence, it's too much.
