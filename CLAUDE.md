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

The one deliberate exception is the `--paper-*` group and `--plate-red`, which colour the program
card in §15. That card represents a printed training sheet, so it stays light while the page is
dark and does not track a rebrand of `--bg`/`--text`. `--plate-red` is used exactly once, as the
card's margin rule — keep it that way.

`styles.css` is organised into 19 numbered sections with a table of contents in the header
comment. `script.js` mirrors this with 8 numbered sections. Keep both maps in sync when adding
code — put new rules in the section they belong to rather than appending to the end.

### The `js` class contract

Three files cooperate so scroll-reveal can't blank the page:

1. An inline script in `index.html`'s `<head>` adds `js` to `<html>`.
2. `styles.css` §18 hides `.reveal` elements **only** under `.js .reveal`.
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

The starter-kit form (§8) is one field, so it has its own small handler rather than a rule in that
array. Shared constants — `EMAIL_RE`, `ENQUIRY_ENDPOINT`, `CONTACT_FALLBACK`, `HONEYPOT_FIELD`,
`GUIDE_URL` — sit at the top of the IIFE because §6, §7 and §8 all use them. Do not move them back
inside a section: `var` hoists, so it would still *work*, right up until that section's element is
removed and the others break silently.

### Structured data must match visible copy

`index.html` carries two JSON-LD blocks: `HealthClub` + `WebSite` in the `<head>`, and `FAQPage`
immediately after the FAQ section. Google discards markup asserting things the page does not say,
so **every value in them is duplicated from rendered copy and has to be changed in both places.**
The membership prices live in three: the pricing cards, the FAQ answer, and `hasOfferCatalog`.

Never add `aggregateRating` or `geo` here. There are no real reviews or a surveyed location behind
this build, and fabricated review markup is the one schema mistake that draws a manual action.

### Animation is opt-in per element

Adding class `reveal` to any element enrols it in the scroll-reveal observer. Grids stagger
automatically because the observer offsets siblings within a batch.

### `prefers-reduced-motion` is honoured in both layers

`styles.css` neutralises transitions/animations; `script.js` checks the same media query and
skips counter animation, carousel autoplay, and the reveal observer entirely (revealing
everything immediately instead). New motion needs handling in whichever layer introduces it.

### The logo exists in five places

`assets/logo.svg` (standalone), `assets/favicon.svg` (rounded tile for the tab), inlined twice in
`index.html` — header and footer — and inlined once more in the source of `assets/og-image.png`.
The inline copies use classes (`.bar`, `.plate-outer`, `.plate-inner`) so CSS recolours them from
`--text` / `--accent`; the standalone files carry literal hex fills. Changing the mark means
updating all five, and the OG image has to be re-rendered rather than edited.

### The guide is a standalone document

`assets/first-session-guide.html` is what the §8 form delivers. It carries its own styles and does
**not** link `styles.css` — it gets printed, saved to phones and forwarded, so it cannot depend on
the site's stylesheet being reachable. It repeats the `--paper-*` values as local literals; if
those change, change them here too. It is `noindex` and disallowed in `robots.txt`, which is what
makes it worth an email address.

## Known placeholders

The contact form (§6) and the starter-kit form (§8) both post to FormSubmit
(`ENQUIRY_ENDPOINT`, now at the top of `script.js`) and are real, but delivery depends on someone
having clicked FormSubmit's one-time activation email — until then submissions go nowhere. The
newsletter form still `console.log`s its payload (§7).

All imagery is `picsum.photos` with stable `seed` values — including the photo baked into
`assets/og-image.png` — and the contact map is a CSS-striped `div`, not a real embed. Coach names,
quotes, prices, the timetable and the "1,200+ members" proof line under the starter-kit form are
illustrative copy. Don't treat any of these as working integrations.
