---
name: motion-pass
description: Upgrade or add animation to an already-built website with GSAP - timelines, ScrollTrigger, stagger, page and section transitions, hover and focus feedback, loading states - with a defined motion language and prefers-reduced-motion support. Use whenever the user wants to animate, add motion, make the site feel alive, smoother, more premium, more interactive, add scroll animations or page transitions, fix janky or generic fade-in animations, or says the animations feel cheap, boring, or AI-default. Also use for converting CSS or Framer Motion animation to GSAP (after asking first). Works with React/Next and plain HTML sites.
argument-hint: "[path|url] [audit]"
---

# Motion Pass

Invoked as `/motion-pass`: arguments are `$ARGUMENTS` (a project path or dev-server URL, and/or `audit`). With `audit`, produce the findings and recommended changes but edit nothing, so the user can pick what to apply. Without a path, use the current project.

Replace the default "fade up on everything" with motion that has a reason: it shows hierarchy, connects states, or gives feedback. Define a motion language first so the result feels like one designer made it.

## 0. Use companion skills first
Which ones matter depends on the site: `/gsap-core` and `/gsap-timeline` almost always; `/gsap-scrolltrigger` only if the page actually scrolls with triggers; `/gsap-react` only for React/Next. Don't load what the site won't use.
Check the skill list. If installed, load `/gsap-core`, `/gsap-timeline`, `/gsap-scrolltrigger`, `/gsap-performance`, and for React/Next `/gsap-react`; also `/gsap-plugins` and `/gsap-frameworks` as needed. They carry the authoritative API details. If not installed, use `references/gsap-recipes.md`. Don't block on missing skills.

## 1. Audit existing motion
- Grep for `transition`, `@keyframes`, `animation`, `framer-motion`/`motion`, `gsap`, `AOS`, `lottie`, `IntersectionObserver`, `scroll-behavior`, Lenis/locomotive.
- Note what exists, where, and whether it respects `prefers-reduced-motion`. Also read any custom scroll or slide engine (wheel/keyboard handlers, snap logic) and any JS-side reduced-motion handling: early returns there can silently break navigation for reduced-motion users, so verify the site still works with motion off.
- **One library per concern.** If Framer Motion or AOS drives animations now, don't layer GSAP over the same elements. Ask the user before replacing it; offer "keep it and only improve" as an option. Simple CSS transitions for hover/focus are fine to keep alongside GSAP.
- Read the vibe read (`.glow-up/vibe.md`) if present; else write 3 lines on how the site should feel in motion (calm, crisp, playful, heavy, cinematic).

## 2. Define the motion language (write it down before coding)
Put it in a short block at the top of the motion module and in your report:
- **Easings (2-3):** e.g. entrance `power3.out`, exit/hide `power2.in`, emphasis `back.out(1.4)` or custom. Match the vibe: calm = long smooth outs; crisp = quick `expo.out`; playful = slight overshoot.
- **Durations:** micro 0.15-0.25s, standard 0.4-0.6s, large/page 0.7-1.0s. Large is for page-load and scroll-revealed moments; anything triggered directly by a click or keypress stays at or under ~0.5s (slide changes may glide to ~0.8s).
- **Stagger rule:** 0.05-0.1s between siblings, capped at ~0.6s total, ordered by reading order or hierarchy.
- **Distance rule:** small offsets (12-40px); bigger only for hero moments.
- **One signature idea** reused everywhere (mask/clip reveal, line draw, weighted settle, curtain, scrub). Choose from the vibe, not from fashion.
Expose these as constants/CSS variables so they can be tuned in one place.

## 3. Implement
Put all of it in a single motion module (`motion.js`/`motion.ts`, or a `useMotion` hook), not scattered in components.
- Timelines for choreographed sequences; `ScrollTrigger` for scroll-based reveals/scrub/pinning; `stagger` for groups. Prefer `gsap.from`/`fromTo` with `immediateRender: false` care when using ScrollTrigger.
- Animate **transform and opacity only** (x, y, scale, rotate, autoAlpha, clipPath is acceptable). Avoid animating width/height/top/left/box-shadow; avoid reading layout in loops (layout thrash). Use `will-change` sparingly and only during animation.
- Register plugins **once** (`gsap.registerPlugin(ScrollTrigger)` at module scope or a single client entry).
- Refresh ScrollTrigger after fonts and images load (`document.fonts.ready.then(ScrollTrigger.refresh)`; `window.addEventListener('load', ...)`); set image dimensions to avoid shifts.
- **React/Next:** use `useGSAP` (from `@gsap/react`) with a `scope` ref, or `gsap.context()` with `ctx.revert()` on cleanup. Client components only (`"use client"`). Never touch the DOM from server components.
- **Plain sites:** scope selectors to a root, create inside `DOMContentLoaded`/after load, kill triggers and timelines on teardown (`ctx.revert()`, `ScrollTrigger.getAll().forEach(t => t.kill())`).
- Content must be visible if JS fails or is slow: set initial hidden state from JS (or a `.js` class on html) not in CSS alone, so no-JS users see everything and there's no flash of invisible content.

## 4. Reduced motion and mobile
Wrap everything in `gsap.matchMedia()`:
- `(prefers-reduced-motion: no-preference)` gets the full language.
- `(prefers-reduced-motion: reduce)` gets a calm fallback: no parallax, scrub, pinning or large movement; instant or opacity-only short fades; or nothing.
- Adapt for `(max-width: 767px)`: fewer, shorter, no heavy pinning or parallax; avoid scroll-jacking; keep native scrolling.
Return cleanup from each branch so the contexts revert when queries change.

## 5. Replace the defaults purposefully
- **Hierarchy-driven reveals:** headline first, supporting text second, media third; not every box at once.
- **Page/section transitions** when the stack supports it (route transitions in Next with care for unmount timing; View Transitions API can complement).
- **Meaningful hover/focus feedback:** buttons, links, cards give a response tied to the signature idea; same feedback on `:focus-visible`, not hover only.
- **Loading states:** skeletons or a short intro that never blocks content for more than ~1s.
- Remove hover-scale on every card, perpetual floating, and fade-up on every section unless it's the chosen signature.
Fewer, stronger moves: usually 4-8 well-chosen animations beat 30.

## 6. Test
- Run the dev server and watch it in the browser. With Playwright, emulate reduced motion and capture errors: `const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: {width: 390, height: 844} }); page.on('pageerror', e => console.log(e)); page.on('console', m => m.type()==='error' && console.log(m.text()));` (write it to a .mjs file, not an inline shell string).
-  Scroll through slowly and fast, resize to 390px, reload mid-page (restores scroll position, triggers still correct), navigate between routes (no duplicate triggers or leaks).
- Check the console for GSAP warnings (missing targets are the usual one).
- Toggle reduced motion (browser devtools emulation or `matchMedia` override) and confirm the fallback.
- Check for jank: no layout shifts, no dropped frames on scroll; use the Performance panel if available. Confirm bundle impact (GSAP core + ScrollTrigger is ~45KB gzip; don't import unused plugins).
- Run the build.

## 7. Report
State the motion language (easings, durations, stagger, signature), then each change as: element / what it does / why (tied to hierarchy or vibe) / file. Note anything removed, what was kept, any library decision, and how reduced-motion and mobile behave. Commit as `glow-up: motion-pass`.

## Don'ts
On a static site with no build step, self-host a pinned GSAP build (e.g. `assets/vendor/`) rather than relying on a CDN, and use the no-JS fallback pattern at the end of `references/gsap-recipes.md` (`html.m-on` class set only once GSAP loads). Don't mix competing animation libraries on the same elements, don't hide content permanently on error, don't use scroll-jacking, and don't animate text so slowly the user waits to read.

Recipes: `references/gsap-recipes.md`.
