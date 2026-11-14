# Cardinal Fulfillment — Animation Concept

**Theme: "Flow on the floor."** Cardinal's whole pitch is that fulfillment becomes boring and reliable. The motion should feel the same way: steady, mechanical and confident, like a conveyor line. No bounces or flashy effects. Things arrive, settle and keep moving.

**Motion rules**
- One easing curve everywhere: `cubic-bezier(.22, 1, .36, 1)` (fast start, soft landing).
- Durations: 200–300ms for hovers, 500–700ms for entrances, 40px/s for anything that loops.
- Elements travel 16–24px at most. Opacity and transform only, so it stays smooth on phones.
- With *reduce motion* turned on, everything is static and fully visible. The marquee becomes a wrapped row.

---

## Already built (live in the page)

| Element | Behaviour |
|---|---|
| **USP marquee (top bar)** | Seamless infinite scroll at 40px/s, so the speed stays the same on any screen width. Pauses on hover. Edges fade out with a mask. Loops with no visible jump, because the content is copied until it is wider than the screen and then slides exactly one copy's width. |
| **Channel logos (mobile)** | The same marquee at 35px/s, because the mobile frame shows the logo row cut off at the edge. Static row on desktop. |
| **Quiz** | Steps slide in from the right (from the left when going back). The progress bar grows smoothly. A tile pops slightly when chosen. |
| **FAQ** | Answers open and close with an animated height, and the plus turns into a minus. One answer open at a time. |
| **Buttons / links** | The arrow nudges 4px on hover. Nav links get an underline that wipes in. Case-study images zoom slowly on hover. |

## Proposed (for your review, not built yet)

1. **Hero entrance (load).** Stagger: rating, then headline revealed line by line behind a mask, then lede, stats, CTA, then the channel row. About 1.1s in total. The background photo starts at 1.08 scale and slowly settles to 1.0 over 2.5s, like a dolly push down the warehouse aisle.
   *Option:* swap the still for the Gemini warehouse video that sits next to the canvas in Figma (I couldn't export it through the API, so I'd need the file). It would play muted and looping, with the still as poster.
2. **Hero stat counters.** "4.1 million", "99.8%", "94%" and "140+" count up once on load (about 900ms).
3. **Section reveals.** Each section head (eyebrow, H2, sub) fades up as it enters the viewport. Card grids (steps, case studies) follow in a 80ms stagger, left to right, like boxes coming down a line.
4. **How it works: "the line".** A thin teal line draws across the three step cards as they appear, connecting step 1 → 2 → 3. Each card's border brightens as the line reaches it. This shows the 14-day process literally moving forward.
5. **Why Cardinal: scroll-linked list.** On desktop the truck photo stays pinned (sticky) while the six reasons scroll past. The reason in the middle of the screen is at full opacity and the others are dimmed to 40%. The photo has slight parallax (about 40px).
6. **Testimonials marquee.** The Figma frame already bleeds cards off both edges, which suggests motion. A second, slower marquee (about 25px/s) that pauses on hover or touch and can also be dragged or swiped.
7. **Get your numbers.** Background parallax on the forklift photo (it moves at 0.85× scroll speed), plus a subtle drift of the navy gradient.
8. **Quiz completion.** On "Thank you" the progress bar fills, fades out and becomes a teal check. The three "what happens next" items stagger in.

**Decisions I need from you**
- Hero background: still photo with a slow zoom, or the video?
- Testimonials: auto-scrolling marquee (6), or swipe-only like the current build?
- Why Cardinal: pinned scroll effect (5), or a simpler fade-in?

Implementation would be CSS plus about 2KB of plain JS (IntersectionObserver), with no animation library. If we want scroll-scrubbed effects to be smoother, GSAP ScrollTrigger is the upgrade path.
