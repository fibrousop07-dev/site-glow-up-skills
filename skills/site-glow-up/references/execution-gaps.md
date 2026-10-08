# Execution gaps: right direction, weak execution

The most common miss on a site with real ideas: the concept is good and the build of it is not. A thread that wanders the page with no purpose, a hover label in a default font, an animation hidden behind an opaque card, a brand typeface used on one headline and nowhere else. The fix is almost never "cut it". It is "keep the idea, redo how it is built".

Run this check in the vibe-read step (list the ideas) and again after design and motion (judge them).

## 1. Inventory the ideas
List every concept the site is *trying* to express, one line each. Sources: the brief and README, the hero, any recurring motif (a line, thread, ring, grid, character), signature animations, easter eggs, custom fonts, custom cursors, labelled illustrations. Typical entries: "a fibre roams the page and ties the sections together", "work examples play live", "headlines use our drawn typeface".

## 2. Rate direction and execution separately
For each idea, two ratings, 1 to 5, with a one-line reason each.

- **Direction**: is the idea right for this audience and brand? Does it say something true about the business?
- **Execution**: does it actually read? Use the questions below.

Then decide:
| Direction | Execution | Action |
|---|---|---|
| high | high | leave alone |
| high | low | **redo the build, keep the idea** (the main target of this check) |
| low | high | consider cutting or repurposing |
| low | low | cut |

Never bin an idea because its first build was weak. Say "keep the idea, here is what is wrong with the build".

## 3. Execution questions
Answer each with evidence (a screenshot, a measurement, or a computed style), not a feeling.

1. **Legible**: can a first-time visitor tell what it is and what it means within a second or two? Is any text on it in the site's real fonts, at a readable size and contrast?
2. **Connected**: does it start somewhere and end somewhere on purpose? A line, thread or arrow that ends in empty space, or that has no relationship to the content beside it, is unfinished.
3. **Purposeful**: does it respond to what the visitor is doing (scroll position, hover, section) or does it just drift? Decoration that does not follow the content reads as filler.
4. **Visible where it matters**: is it covered by an opaque surface, clipped by a mask, too faint at the real opacity, or only present at one viewport width?
5. **Consistent with the rest**: same typeface, same colour roles, same easing as the other parts of the site, or an obvious one-off?
6. **Behaves well**: smooth at normal scroll speed, no stutter, no jump when the page resizes, correct with reduced motion, and not triggered by accident (easter eggs that fire during normal use are an execution bug).
7. **Finished at the edges**: first frame, last frame, mid-animation, narrow phone, very wide monitor. Many ideas only look right in the frame the developer tested.
8. **Earns its cost**: does it add length, weight or distraction (a 9-screen scroll track for a short story) that the idea does not justify?

## 4. Typical "good idea, poor build" patterns to look for
- A motif line or thread that exists but is thin, off to one side, ends abruptly, or sits behind content so it never meets it.
- A hover label or tooltip in a default or body face with a box, instead of the brand voice.
- A signature animation that is dimmed or buried so the owner stops noticing it.
- A custom font present in the repo but used on one element only; everything else falls back to a stock Google font.
- A live demo with the right content but a background, scale or aspect ratio that makes it cramped while space beside it is empty.
- A long scroll story with the right beats but too much dead scroll between them.
- An easter egg with a trigger so loose that normal use sets it off.

## 5. Output
Add an **Execution gaps** table to the report:

| Idea | Direction | Execution | What is wrong | Fix (keep the idea) |
|---|---|---|---|---|

Fix the high-direction / low-execution rows in the appropriate phase (design for layout and type, motion for behaviour). If the right fix is a design decision the owner has to make (how far to commit to the idea), ask once, batched, with a recommendation.
