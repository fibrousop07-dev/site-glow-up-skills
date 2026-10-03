# GSAP recipes

Short, general patterns. Adapt selectors, constants and the motion language. Verify API details against the installed `/gsap-*` skills or gsap.com docs for the user's GSAP version (3.13+ ships all plugins free, including SplitText).

## Contents
1. Setup and tokens  2. Reveal timeline  3. Scroll-linked section  4. Text split reveal  5. Magnetic hover  6. Page transition  7. Reduced-motion and mobile setup  8. React/Next wrapper  9. Cleanup and refresh

## 1. Setup and tokens
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger); // once, at module scope

export const M = {
  ease: { in: "power3.out", out: "power2.in", accent: "back.out(1.4)" },
  dur: { s: 0.2, m: 0.5, l: 0.9 },
  stagger: 0.07,
  dist: 28,
};
```

## 2. Reveal timeline (hierarchy-driven)
Headline, then supporting copy, then media, in one timeline instead of independent fades.
```js
const tl = gsap.timeline({ defaults: { ease: M.ease.in, duration: M.dur.m } });
tl.from(".hero h1", { y: M.dist, autoAlpha: 0 })
  .from(".hero p", { y: M.dist / 2, autoAlpha: 0 }, "-=0.3")
  .from(".hero .cta > *", { y: 12, autoAlpha: 0, stagger: M.stagger }, "-=0.25")
  .from(".hero img", { scale: 1.06, autoAlpha: 0, duration: M.dur.l }, 0.1);
```
Per-section reveal on scroll:
```js
gsap.utils.toArray("[data-reveal]").forEach((el) => {
  gsap.from(el.children, {
    y: M.dist, autoAlpha: 0, stagger: M.stagger, duration: M.dur.m, ease: M.ease.in,
    scrollTrigger: { trigger: el, start: "top 80%", once: true },
  });
});
```

## 3. Scroll-linked section (scrub and pin)
Use sparingly, desktop only.
```js
gsap.timeline({
  scrollTrigger: { trigger: ".story", start: "top top", end: "+=150%", scrub: 0.6, pin: true, anticipatePin: 1 },
})
  .to(".story .bg", { scale: 1.15 }, 0)
  .from(".story .line", { autoAlpha: 0, y: 40, stagger: 0.3 }, 0)
  .to(".story .line", { autoAlpha: 0.2, stagger: 0.3 }, 0.6);
```
Horizontal gallery: animate `x` on a track with `xPercent: -100 * (n - 1)` and `scrub: true`, `pin: true`, `snap: 1 / (n - 1)`.

## 4. Text split reveal
SplitText (free in current GSAP) keeps accessibility by default via `aria` handling; check the installed version's options.
```js
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);

document.fonts.ready.then(() => {
  const split = SplitText.create(".headline", { type: "lines", mask: "lines", autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, { yPercent: 110, duration: M.dur.l, ease: "expo.out", stagger: 0.08 });
    } });
});
```
Without SplitText: wrap lines in `overflow:hidden` spans manually and animate inner `yPercent`. Split only short headlines; never body paragraphs.

## 5. Magnetic hover
Pointer-fine devices only; skip for touch and reduced motion.
```js
document.querySelectorAll("[data-magnetic]").forEach((el) => {
  const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
    yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
  });
  el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
});
```
Keep a matching `:focus-visible` style; magnetism is not a focus indicator.

## 6. Page transition
Plain multi-page sites: View Transitions API where supported, with GSAP on the overlay. In SPA/Next: animate out, navigate on complete, animate in after mount.
```js
function leave(done) {
  gsap.to(".page-curtain", { yPercent: 0, duration: M.dur.m, ease: "power3.inOut", onComplete: done });
}
function enter() {
  gsap.fromTo(".page-curtain", { yPercent: 0 }, { yPercent: -100, duration: M.dur.m, ease: "power3.inOut", delay: 0.05 });
  gsap.from("main > *", { y: 20, autoAlpha: 0, stagger: M.stagger, duration: M.dur.m, delay: 0.2 });
}
```
In Next App Router, route transitions need a client wrapper; keep transitions under ~0.8s total, never block navigation on animation failure, and call `ScrollTrigger.refresh()` after the new page mounts.

## 7. Reduced-motion and mobile setup
```js
const mm = gsap.matchMedia();
mm.add(
  { motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)", desktop: "(min-width: 768px)" },
  (ctx) => {
    const { motion, reduce, desktop } = ctx.conditions;
    if (reduce) {
      // calm fallback: opacity-only, no movement; clear only what this module set
      gsap.from("[data-reveal]", { autoAlpha: 0, duration: 0.18, clearProps: "opacity,visibility" });
      return;
    }
    revealSections();            // full language
    if (desktop) { pinnedStory(); magnetic(); }  // heavy stuff desktop only
  }
);
// mm.revert() on teardown
```
Do not use `clearProps: "all"` here; it can wipe transforms that other code owns. Make sure custom scroll/slide engines still navigate when this branch runs.

## 8. React/Next wrapper (client component only)
```jsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Section({ children }) {
  const root = useRef(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".item", { y: 28, autoAlpha: 0, stagger: 0.07,
        scrollTrigger: { trigger: root.current, start: "top 80%", once: true } });
    });
  }, { scope: root });
  return <section ref={root}>{children}</section>;
}
```
`useGSAP` reverts everything on unmount. Use `contextSafe` for handlers created outside the hook callback.

## 9. Cleanup and refresh
```js
document.fonts.ready.then(() => ScrollTrigger.refresh());
window.addEventListener("load", () => ScrollTrigger.refresh());
// plain-site teardown
ctx.revert(); // for gsap.context(...)
ScrollTrigger.getAll().forEach((t) => t.kill());
```
Hide-before-reveal without a flash: add `class="js"` to `<html>` in an inline script and apply the initial hidden state only under `.js` (and only inside a no-preference media query) so no-JS and reduced-motion users see content.

## 10. No-JS / GSAP-failed-to-load fallback
```html
<script>document.documentElement.classList.add("js")</script>
<style>
  /* hide-before-reveal only when GSAP is confirmed and motion is allowed */
  @media (prefers-reduced-motion: no-preference) { html.m-on [data-reveal] { visibility: hidden } }
</style>
```
```js
if (window.gsap) { document.documentElement.classList.add("m-on"); /* build timelines; they set autoAlpha:1 */ }
```
If GSAP never loads, `m-on` is never set and everything stays visible. Check that 0 animated elements remain hidden in both normal and reduced-motion runs.
