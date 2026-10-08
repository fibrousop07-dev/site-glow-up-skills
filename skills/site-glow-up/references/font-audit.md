# Font audit

Fonts are the single fastest way a site reads as AI-made: stock Google faces (Space Grotesk, Inter, Plus Jakarta Sans, Poppins, JetBrains Mono) used everywhere at default weights, small monospace uppercase labels with wide tracking, and a custom brand face that exists in the repo but only shows up in one place. Audit by **role**, not by file.

**Owner decisions win.** If `.glow-up/decisions.md` or project memory records a font decision ("Space Grotesk stays on section headings", "never add a heading font"), the rules below do not override it. Report the measured table, note the conflict once, and recommend nothing that reverses the decision. `scripts/audit.mjs` prints the by-role table for every run.

## 1. Find what exists
- List every font source: `next/font`, `@font-face`, `<link>` to a font host, `font-family` declarations, design tokens.
- Note any **custom or brand face** (a local woff2, a drawn wordmark font, a commissioned family). It exists to be seen.
- Note the stock faces and what each is doing.

## 2. Measure by role in the running site
Run in the browser console on each key page and read the table:

```js
const roles = {
  'h1': 'h1', 'h2': 'h2', 'h3': 'h3', 'nav links': 'header nav a', 'buttons': '.btn, button',
  'body copy': 'main p', 'small labels': '.eyebrow, [class*=tag], [class*=label], [class*=num], [class*=caption]',
  'prices/figures': '[class*=price], [class*=figure], [class*=metric]', 'footer': 'footer a, footer p'
};
const out = {};
for (const [k, sel] of Object.entries(roles)) {
  out[k] = [...new Set([...document.querySelectorAll(sel)].map(e => {
    const c = getComputedStyle(e);
    return c.fontFamily.split(',')[0].replace(/"/g,'') + ' / ' + c.fontWeight + (c.textTransform==='uppercase' ? ' / UPPER' : '');
  }))].join('  |  ');
}
console.table(out);
```

## 3. What to flag
1. **Brand face used on one role only.** If a custom face exists and appears on the hero but headlines, titles and labels are a stock face, the site has two voices. Decide the face's job (display headlines, short titles, numerals, labels) and apply it to every element in that job. If the owner wrote "the custom face reads worse on sentences", test it on real headlines at real sizes before accepting that; usually it works on headlines and short titles and should still be kept off long body copy.
2. **Headlines in a stock face.** A site whose h1 to h3 are Inter, Space Grotesk or Poppins has no typographic identity. Flag it high severity.
3. **Monospace uppercase tracked labels** ("ONE-OFF", "MONTHLY", "STEP 02", "LIVE") used for ordinary words. They are a generic tech-site device. Keep mono for code, data and genuine technical readouts; set ordinary labels in the body face, sentence case.
4. **Too many faces.** More than three families (display, text, optional mono) means roles are not decided.
5. **Weight and size drift.** The same role at three different weights, or labels under 12px.
6. **Fallback flash.** The custom face loads late and the stock fallback shows first, or lines are measured before the face loads (masked headlines clip or overlap). Check split-text and mask animations re-measure after fonts load.
7. **Small interface text in the headline face, or the reverse.** Headline face on a 13px label usually looks wrong; text face on a 60px headline often looks flat.

## 4. How to fix
- Decide roles once, as tokens: `--font-display`, `--font-text`, `--font-mono`, plus `--font-brand` if different.
- Apply by role in the base stylesheet (headings, titles, tabs, labels), not element by element.
- Re-check line-height, letter-spacing and mask padding for the new face; display faces often have taller descenders and different metrics, so masked or clipped headlines need more room.
- Verify with the table above after the change: every role should list one face, and the brand face should appear wherever its job says it should.

## 5. Report line
"Fonts by role: before [role: face, ...] / after [role: face, ...]. Brand face now on: [...]. Left on stock face on purpose: [...]."
