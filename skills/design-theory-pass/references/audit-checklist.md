# Audit checklist

Use as thresholds, not laws. Deliberate rule-breaking is fine unless it hurts usability.

## Hierarchy
- One clear primary element per viewport; squint test: the eye lands on the right thing first.
- Size, weight, color and space signal importance consistently. If everything is bold or everything is big, nothing is.
- One primary CTA per section; secondary actions visibly quieter.

## Spacing rhythm
- Spacing comes from a scale (4/8-based). Flag one-off values like 13px, 27px, 37px.
- Space between groups > space within groups (proximity). Section padding consistent across sections of the same level.
- Check by grepping the CSS for the most common margin/padding/gap values; a healthy site has ~6-10 distinct ones.

## Alignment and grid
- Shared left edge for text and components; consistent container max-width and gutters.
- Columns align across sections. Centered text blocks only when short.

## Typography
- Faces by role: h1, h2, h3, nav, buttons, labels, body and figures each use one face. A custom brand face appears wherever its job says it should, not only on the hero. Headlines in a stock face, and monospace-uppercase labels for ordinary words, are findings (see site-glow-up `references/font-audit.md`).
- Sub-12px text (badges, tags, hints, captions) counts as a failure; grep for it first, it is the most common find on otherwise clean sites.
- Max 2 families (1 is fine); limited weights (3 or fewer in use).
- Body 16px or larger (18 for long reading). Line length 45-75ch (use `max-width: 65ch`). Line-height ~1.5-1.7 body, 1.1-1.3 large headings. Headings tighter tracking, small caps/uppercase wider.
- Scale has 4-6 distinct sizes with obvious steps; `clamp()` for fluid headings.
- Avoid long all-caps, justified text, tiny gray text.

## Color roles and contrast
- Roles defined: background, surface, text, muted text, border, accent, status colors. One accent does most of the work.
- WCAG AA: 4.5:1 for body text, 3:1 for large text (18.66px bold / 24px) and UI components/borders. Check text on images and gradients, placeholder text, disabled and muted text, and hover states.
- Don't rely on color alone for meaning (links, errors, charts).

## Composition and balance
- Visual weight distributed; no dead zones or crowded zones. Intentional whitespace; imagery supports the message.
- Above-the-fold answers: what is this, who is it for, what do I do next.

## Component consistency
- Buttons: same height, radius, padding, type per size. Cards, inputs, badges, icons use one style family.
- Same thing looks the same everywhere; different things look different.

## Responsive
- No horizontal scroll at 390px (check `document.documentElement.scrollWidth > innerWidth`). Wide images/tables/code constrained.
- Tap targets ~44x44px with spacing. Nav collapses sensibly. Text doesn't shrink below 16px body. Layout reflows, not just shrinks. Test 320px too.
- Images have width/height or aspect-ratio (no layout shift); `srcset` or modern formats if heavy.

## Accessibility basics
- Visible `:focus-visible` styles on every interactive element; logical tab order; skip link on long pages.
- Alt text on meaningful images, empty alt on decorative. One `h1`, headings in order. Form labels tied to inputs; errors announced.
- Landmarks (`header`, `nav`, `main`, `footer`). Links/buttons used correctly (links navigate, buttons act). Language attribute set.
- Reduced motion respected (see `motion-pass`).

## States
- Hover, focus, active, disabled, loading, empty, error, success for interactive components. Transitions short (100-250ms). 404 page exists and is on-brand.

## Measuring tips
- Computed contrast: sample colors with the browser tool or compute from CSS variables.
- Find overflow: in the console, list elements wider than the viewport.
- Find spacing drift: grep for `margin|padding|gap` values and count distinct ones.

## Ideas and execution
- List the site's recurring ideas (a motif, a signature animation, a drawn typeface) and judge direction and execution separately. A good idea with a weak build is fixed, not cut. Method: site-glow-up `references/execution-gaps.md`.
