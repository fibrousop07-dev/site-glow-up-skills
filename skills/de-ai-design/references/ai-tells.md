# Catalog of AI-design tells

For each: how to spot it, why it reads as AI, what to do instead. Remember: only a default is a tell. Keep it when it is a real brand choice.

## Contents
1. Color  2. Surfaces and effects  3. Layout templates  4. Iconography and imagery  5. Typography  6. Motion  7. Details  8. Micro-copy flags

## 1. Color
**Purple-to-blue gradients** (indigo/violet/#6366f1/#8b5cf6 to blue or pink, on hero, buttons, backgrounds). Grep `from-indigo`, `violet`, `#6366f1`, `linear-gradient`. Reads as the default output of every generator. Instead: derive palette from logo/photos/product material; flat color or a single-hue tonal gradient if gradient is needed.

**Gradient headline text** (`bg-clip-text text-transparent`). Reads as 2023 SaaS template. Instead: solid text with strong weight/size; emphasize one word with color, underline, or italic of a second face.

**Navy plus neon glow** (near-black navy bg with cyan/purple glows). Instead: choose a real dark (tinted toward brand hue) with restrained accent, or go light; no glow.

**Untinted gray neutrals** (pure #888, slate/gray scale unmodified). Instead: tint neutrals toward the brand hue (warm or cool) so surfaces, borders and text feel related.

## 2. Surfaces and effects
**Glassmorphism everywhere** (`backdrop-blur`, translucent white cards over blobs). Instead: solid surfaces with border or tone shifts; keep blur for one purposeful overlay (sticky nav over content) if at all.

**Floating glow blobs** (blurred colored circles behind hero). Instead: delete; if depth is needed use photography, a structural graphic, or a subtle tonal field.

**Same radius and shadow on everything** (`rounded-2xl shadow-lg` on all). Instead: define roles: control radius, container radius, overlay radius; shadows only to express elevation (menu, modal), borders elsewhere. Pick radius to match brand: sharp for technical/editorial, soft for friendly.

## 3. Layout templates
**The template stack**: centered hero + pill badge, three equal feature cards, testimonial row, 3-tier pricing (middle highlighted "Most popular"), CTA band, footer. Instead: structure around this business's actual story and the visitor's decision. Give one thing dominance (big image, one big number, a demo), vary section rhythm (full-bleed, asymmetric split, list, quote), use a broken grid or overlap deliberately, and drop sections that don't earn space. Pricing: if there is only one real offer, show one.

**Everything centered.** Instead: left-aligned text with a strong edge; center only short statements.

**Equal-weight card grids.** Instead: one featured item larger than the rest, or a ruled list with numbers.

**Badge/pill above the headline** ("New", "Introducing", sparkle emoji). Instead: remove unless it carries real news; if kept, make it specific and dated. (Wording belongs to de-ai-copy.)

## 4. Iconography and imagery
**Emoji as icons.** Instead: one icon set with consistent stroke/size, or no icons (type and numbering are often stronger).

**Icons in colored rounded squares** above card titles. Instead: bare icons, or drop; or replace with a real photo/illustration/diagram of the thing.

**Decorative hero illustration that isn't theirs** (cartoon vehicles, clip-art, lettering or branding of another business in the artwork). Check hero art for third-party names or logos. Instead: a real photo of the actual workshop/product/people.

**Generic 3D blobs, abstract mesh gradients, stock handshake/laptop photos.** (Redrawing the AI-made ones by hand is the `hand-redraw` skill.) Instead: real photography of the product, place or people (ask the user), consistent treatment (crop, duotone), diagrams or screenshots that show the actual product, or purposeful typographic graphics.

**Fake social proof**: invented testimonials with stock avatars, "Trusted by 10,000+", logo walls of companies that aren't customers, round-number stats. Never keep fabricated claims. Flag; replace with real quotes, real numbers, or remove.

## 5. Typography
**Flat type scale** (everything 14-18px, headings only slightly larger). Instead: dramatic scale contrast (display 3-5x body), set weights deliberately.

**Default font stack** (Inter/system-ui/Poppins unmodified everywhere). Instead: pick a face for the subject: editorial serif, grotesk, mono; pair one display with one text face; tune tracking and line-height. Self-host and subset.

**Brand face on one role only.** A custom or drawn typeface exists but appears on the hero and nowhere else; every other headline, title and label is a stock Google face. Detect by computing font-family per role (see the site-glow-up font audit). Instead: decide the custom face's job and apply it to every element in that job; keep it off long body copy.

**Stock headline face** (Space Grotesk, Inter, Poppins, Plus Jakarta on all of h1 to h3). Reads as a template. Instead: the brand face, or a face chosen for the subject.

**Monospace uppercase tracked labels** ("ONE-OFF", "MONTHLY", "STEP 02", "ILLUSTRATION") on ordinary words and boxed "pill" tags. A generic tech-site device. Instead: body face, sentence case, no box; keep mono for real code or data.

**Good idea, weak build.** A concept that is right but unfinished (a thread that ends nowhere, a dimmed signature animation, a label in a default face, a demo with an opaque background hiding the motion behind it). Do not cut it; see site-glow-up `references/execution-gaps.md` and fix the build.

## 6. Motion (flag here, fix in motion-pass)
**Fade-up-on-everything** (every block translates 20px and fades in on scroll). **Hover scale on every card** (`hover:scale-105`). **Perpetual floating/bobbing** elements. Instead: motion that follows hierarchy and purpose.

**Themed-effects pile-up** (scanlines, CRT flicker, glow on every border, terminal-prefix gimmicks like "// portfolio.exe loaded", hover letter-spacing shifts, cursor spotlights). Fine once as identity; a tell when applied to every component. Keep one signature, cut the rest. Copy gimmicks go to de-ai-copy.

## 7. Details
**Default 404, favicon, `<title>`, OG image, selection color, focus ring, scrollbar.** Instead: a designed 404 in brand voice, a real favicon from the logo, a custom `::selection`, a restyled (not removed) `:focus-visible`, a proper OG image.

## 8. Micro-copy flags (hand to de-ai-copy; do not edit here)
"Seamless", "Supercharge", "Elevate", "Unlock", "Get started", "Learn more" as every button, "Built for the modern X", "Trusted by teams", em-dash-heavy headlines, "not just X, but Y", rule-of-three taglines.

## Severity quick guide
High: palette, hero template, fonts, icon style, fake proof. Medium: cards/radius/shadow, glass, section order, motion defaults. Low: favicon, 404, selection, focus styling.
