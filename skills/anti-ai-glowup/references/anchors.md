# Aesthetic Anchors

Eight territories, each locked to specific tokens. Pick one, match its tokens exactly, state the choice and the reason. Hybridising ("Swiss with a Brutalist edge") is a category error: each anchor's signature excludes the others. Surprising pairings (a Swiss punk label, an Industrial florist, an Organic trading terminal) beat the safe match. Do not route every technical brief to Industrial.

Adapted from Ilm-Alan/frontend-design. Hex values are the allowed range; pick 4-6 for the token block.

| # | Anchor | Surface | Type | Accent / signal | Structure and texture | Breaks if |
|---|---|---|---|---|---|---|
| 1 | **Swiss** | `#FFFFFF` or `#F7F7F8` | One grotesk family: Helvetica Neue, Akzidenz-Grotesk, Söhne | ONE of `#E4002B`, `#FF4F00`, `#002FA7` | Visible grid or 1px hairlines, left-aligned, asymmetric balance, numerals as composition | warm paper, serif display, grain, centered type |
| 2 | **Industrial** | `#000000` or `#0B0C0A` | Mono only: IBM Plex Mono, JetBrains Mono, Berkeley Mono | ONE of `#00E676`, `#FF3B30`, `#FFB800`, `#C6FF4A` | Flat, 1px borders not shadows, `tabular-nums` | serif, proportional fonts, grain, shadows, rounded corners |
| 3 | **Brutalist** | 2-3 of `#FF0000 #0000FF #FFFF00 #000 #FFF`, competing equally | System fonts only (Times, Helvetica, Courier, Arial), mixed on purpose | pure primaries | Hard offset shadow `8px 8px 0 #000`, native controls, blue underlined links, crushed margins | webfonts, tuned hex, soft shadow, radius, centered layout |
| 4 | **Aurora Maximalism** | dark saturated gradient `#5D34D0 -> #FF006E -> #00F0FF` | Oversized display 15-25vw | neon glow `text-shadow` | Mesh gradient as surface, spring motion, scroll parallax | flat backgrounds, restraint, hairline structure |
| 5 | **Chaotic Maximalism** | pastels AND neons together (`#FF71CE #DFFF00 #00FFFF` + one) | 3+ clashing faces from different registers | n/a (the clash is the point) | Pattern on every surface, oversized type crashing a busy ground | coherent palette, single typeface, whitespace, 60/30/10 |
| 6 | **Retro-Futuristic** | `#0A0014` or deep navy-black | Period type: VT323, Orbitron, Space Mono, Monoton, Press Start 2P | magenta `#FF006E` + cyan `#00FFFF`, or `#00FF41` + `#FFB000` | CRT scanlines and/or chromatic aberration, committed glow | flatness, modern sans (Inter, Söhne), paper, no texture |
| 7 | **Organic** | sage `#8B9D83`, clay `#B08B6E`, terracotta `#C66B3D`, ochre `#C08E3A`, moss `#606C38`; light: sand `#E8DCC7`, oat `#D4B895` | Humanist serif (Freight, Caslon, Fraunces) or warm geometric sans (Greycliff, Epilogue, Recoleta) | earth tones | Radius 16-32px, 1-3% feTurbulence grain, 300-500ms ease, breathing hero | cream `#F0+`, cold grey, pure white/black, hard rectangles |
| 8 | **Lo-Fi** | paper-yellow `#E8E0C0` / `#EDE4CF` (more saturated than cream) | Mixed system fonts colliding | riso offset `text-shadow: 3px 0 #FF006E, -3px 0 #00FFCC` | 2-8deg rotations, halftone tiles, SVG staple/tape/torn edge | precision, single typeface, smooth motion, grid-squared boxes |

Fraunces is reserved for Organic. Cream (the `#F0-F8` warm range) is not an escape hatch: it is a P1 tell everywhere the brief does not demand it.

## Differentiator
After the anchor, write one sentence naming the single memorable move (e.g. "folio numerals at 40vw behind the hero", "hard-offset shadows that collapse on press", "a scanline overlay that tears on scroll"). It must be visible in the render.

## Token block
```css
:root{
  --color-surface:  ; --color-ink:  ; --color-accent:  ;   /* 4-6 colors total, all from the anchor */
  --color-muted:    ; --color-line: ;
  --font-display:   ; --font-body:  ;                       /* 1-2 families */
  --radius: ; --shadow: ;
}
```
Any hex or `font-family` outside this block is token improvisation: lift it in or remove it.
