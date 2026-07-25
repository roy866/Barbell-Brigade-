# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page marketing site for **Barbell Brigade**, a strength gym targeting people who want to
get fit (beginner-first positioning — see `README.md`). Plain HTML/CSS/vanilla JS with **no build
step, no package manager, and no dependencies**. Everything is five hand-written files.

## Running it

There is nothing to install, build, lint, or test. To view the site:

- VS Code *Live Server* extension → right-click `index.html` → **Open with Live Server**, or
- open `index.html` directly in a browser (Google Fonts and `picsum.photos` images need network).

There is no test suite. Verify changes by loading the page and exercising the interactions
manually — resize below 768px for the mobile nav, scroll for the reveals and counters, submit the
contact form with bad input.

## Architecture

### Design tokens drive everything

All colour, type, spacing, radius and motion values live as CSS custom properties in `:root` at
the top of `styles.css`. Nothing downstream hard-codes a colour or font. **Rebranding = editing
`:root`.** If you find yourself typing a hex value elsewhere in the stylesheet, add or reuse a
token instead.

`styles.css` is organised into 17 numbered sections with a table of contents in the header
comment. `script.js` mirrors this with 7 numbered sections. Keep both maps in sync when adding
code — put new rules in the section they belong to rather than appending to the end.

### The `js` class contract

Three files cooperate so scroll-reveal can't blank the page:

1. An inline script in `index.html`'s `<head>` adds `js` to `<html>`.
2. `styles.css` §16 hides `.reveal` elements **only** under `.js .reveal`.
3. `script.js` §3 adds `.is-visible` via `IntersectionObserver`.

Without JS, nothing is ever hidden. Any new hide-then-animate effect must follow this pattern —
never set `opacity: 0` on content unconditionally.

### HTML ↔ JS coupling is by `id`

`script.js` reaches into the DOM by element ID (`menuToggle`, `siteNav`, `carouselTrack`,
`contactForm`, and one `<id>Error` paragraph per validated field). Renaming an ID in
`index.html` silently breaks a feature — every lookup is guarded with `if (el)` so failures are
quiet. Grep `script.js` for the ID before changing it.

The contact form's validation lives in a `rules` array in §6; each entry's `id` must match both
an input's `id` and its error paragraph's `id + "Error"`. Add a field by adding markup **and** a
rule.

### Animation is opt-in per element

Adding class `reveal` to any element enrols it in the scroll-reveal observer. Grids stagger
automatically because the observer offsets siblings within a batch.

### `prefers-reduced-motion` is honoured in both layers

`styles.css` neutralises transitions/animations; `script.js` checks the same media query and
skips counter animation, carousel autoplay, and the reveal observer entirely (revealing
everything immediately instead). New motion needs handling in whichever layer introduces it.

### The logo exists in four places

`assets/logo.svg` (standalone), `assets/favicon.svg` (rounded tile for the tab), and inlined
twice in `index.html` — header and footer. The inline copies use classes (`.bar`, `.plate-outer`,
`.plate-inner`) so CSS recolours them from `--text` / `--accent`; the standalone files carry
literal hex fills. Changing the mark means updating all four.

## Known placeholders

The contact form posts to FormSubmit (`ENQUIRY_ENDPOINT` in `script.js` §6) and is real, but
delivery depends on someone having clicked FormSubmit's one-time activation email — until then
submissions go nowhere. The newsletter form still `console.log`s its payload (§7). All
imagery is `picsum.photos` with stable `seed` values, and the contact map is a CSS-striped `div`,
not a real embed. Coach names, quotes, prices and the timetable are illustrative copy. Don't
treat any of these as working integrations.
