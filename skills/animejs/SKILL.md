---
name: animejs
description: Use when adding or choosing motion with Anime.js v4 (animejs.com) in a site or app: scroll-linked animation, text splitting and scrambling, SVG line drawing and morphing, staggered reveals, draggable/spring interactions, timelines. Also use to decide Anime.js vs GSAP for a given build, especially static sites that want a tiny modular bundle.
argument-hint: "[what to animate | compare | install]"
---

# Anime.js v4

Source: https://animejs.com (verified 2026-10-17: v4, ~24.5 KB with every module, modular). Always check the live docs page for any signature you are not sure of; several details below are marked UNVERIFIED because the docs overview did not show them.

## When to pick it over GSAP
- Pick **Anime.js** for static or small sites that want a small, modular bundle (`animejs/animation` alone is ~5 KB), plus built-in text splitting, SVG draw/morph/motion path, springs, draggable, and scope-based responsive animation, with no plugin licensing questions to check.
- Pick **GSAP + ScrollTrigger** (the portfolio default, vendored) when the signature interaction is a long pinned, scrubbed scroll sequence with many coordinated timelines: ScrollTrigger's pin/scrub tooling is more mature. Do not mix both libraries in one site; one animation library per project.
- License: not stated on the overview page. Check the repo (github.com/juliangarnier/anime) before shipping a client site.

## Install
- npm: `npm i animejs`. ESM: `import { animate, createTimeline, stagger, onScroll, splitText } from 'animejs'`.
- Subpath imports load only what you use: `animejs/animation`, `timer`, `timeline`, `animatable`, `draggable`, `layout`, `scope`, `engine`, `events`, `easings`, `utils`, `svg`, `text`, `waapi`.
- No bundler (portfolio static sites): vendor `node_modules/animejs/dist/modules/` into `vendor/animejs/` and use an `<script type="importmap">` mapping `animejs` and each subpath to those files, then `<script type="module">`. No CDN. A UMD/CDN path exists in the docs "Installation" page; UNVERIFIED here.

## Core API (v4 names)
- `animate(targets, { x: 100, opacity: [0, 1], duration: 800, ease: 'outExpo', delay: stagger(60), autoplay, loop, alternate })`. CSS transforms are individual properties (`x`, `y`, `rotate`, `scale`).
- `createTimeline({ defaults })` then `.add(targets, props, position)`; position like `'-=200'` or a `stagger()`.
- `stagger(100)` (time) and value/position forms; `utils.stagger` is the same function via the utils module.
- `onScroll({ container, target, axis, repeat, debug, enter/leave thresholds, sync })` returns a ScrollObserver; pass as `autoplay: onScroll({...})` to link an animation, timer or timeline to scroll. Callbacks: `onEnter`, `onEnterForward`, `onEnterBackward`, `onLeave...`, `onUpdate`, `onSyncComplete`, `onResize`. Methods: `link()`, `refresh()`, `revert()`. UNVERIFIED: exact threshold syntax, and which `sync` value gives scrub vs play-once; read /documentation/events/onscroll and its sync-modes page before using, then test in the browser.
- `splitText(target, { lines, words, chars, includeSpaces, accessible, debug })` returns `{ words, chars, lines, addEffect, revert, refresh }`; `words: { wrap: 'clip' }` gives the masked line-reveal look. Needs v4.1+ (standalone import `animejs/text` from v4.2). Wait for fonts (`document.fonts.ready`) before splitting, and call `revert()` on resize if line splits matter. `scrambleText` is documented in the same Text section.
- SVG: `createDrawable(path)` with `animate(drawable, { draw: '0 1' })` for line drawing; `morphTo`, `createMotionPath` also in `animejs/svg`.
- `createDraggable(el, { releaseEase: createSpring({ stiffness, damping }) })`; `createSpring` for spring eases; `createScope({ root, mediaQueries })` for responsive animations with clean `revert()`; `createLayout` for layout-change animation; `engine` for global speed/fps/pauseOnDocumentHidden; Three.js adapter exists.
- `waapi` module: hardware-accelerated Web Animations path for simple transforms/opacity.

## Rules for Studio Fibrous builds
1. Honour `prefers-reduced-motion`: skip `animate`/`onScroll` setup (or set final state) and show everything; content must be visible with no JS.
2. Animate only transform and opacity; never layout properties on scroll.
3. Revert on teardown or breakpoint change (`createScope` + `revert()`), no leaked observers.
4. Use it for reveals, text, SVG and micro-interactions; keep the signature interaction in one library and document the choice in the site README.
5. Test in a real browser: scroll behaviour, console errors, mobile fallback. Do not claim 60fps without measuring.
