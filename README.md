# Barbell Brigade

A single-page marketing site for **Barbell Brigade**, a strength and conditioning gym aimed at
people who want to get fit — beginners first, no experience assumed.

Built with plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

![The Barbell Brigade hero section — the headline "You don't need to be fit to start here." over a
dark gym backdrop, with the sticky nav and the free-week call to action](assets/screenshot.jpg)

## Run it

**Easiest — VS Code Live Server:**

1. Install the *Live Server* extension (`ritwickdey.LiveServer`).
2. Right-click `index.html` → **Open with Live Server**.

**Or just open the file:** double-click `index.html`. Everything works except the Google Fonts
and placeholder images, which need an internet connection.

## Live site

<https://roy866.github.io/Barbell-Brigade-/>

Every push to `main` republishes it — `.github/workflows/deploy.yml` copies the repo into
GitHub Pages, minus `.git`, `.github`, `.claude`, `.mcp.json` and `CLAUDE.md`. There's no build
step, so a push is the whole deploy.

New site files ship automatically — the workflow excludes rather than allow-lists — and the
Actions tab has a **Run workflow** button for a manual redeploy.

This file ships too, as raw markdown at
[`/README.md`](https://roy866.github.io/Barbell-Brigade-/README.md). With no build step to render
it, that URL serves source text rather than a formatted page.

Pages sends `max-age=600` on assets, so a browser that already has the site open can keep running
the previous `script.js` for up to ten minutes after a deploy. When verifying a fix on the live
URL, hard-reload — otherwise you are testing the old file.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All page markup — nav, hero, stats, programs, coaches, pricing, FAQ, schedule, testimonials, starter kit, contact, footer. Also carries the JSON-LD structured data |
| `styles.css` | Design tokens + all styling, organised into 19 numbered sections |
| `script.js` | Mobile nav, scroll spy, reveal animations, stat counters, carousel, and the three forms |
| `assets/first-session-guide.html` | The *First Four Weeks* plan — the download the starter-kit form sends. Standalone and print-styled; not part of the site's stylesheet |
| `assets/logo.svg` | Standalone barbell logo (also inlined in the header so CSS can recolour it) |
| `assets/favicon.svg` | Rounded-square version of the mark for the browser tab |
| `assets/og-image.png` | 1200×630 social share card, rendered from HTML via Playwright |
| `assets/screenshot.jpg` | The hero shot at the top of this README |
| `robots.txt` | Allows the site, disallows `README.md` and the gated guide, points at the sitemap |
| `sitemap.xml` | One entry, because the site is one URL. Section anchors are not separate pages |
| `.mcp.json` | Registers the Playwright MCP server, used to retake that screenshot |

## Retaking the screenshot

`.mcp.json` wires up [Playwright MCP](https://github.com/microsoft/playwright-mcp) at the project
level, so any MCP client opened in this folder can drive a real browser over the site. It shells
out to `npx`, so Node.js is the only prerequisite — the package downloads on first run.

The current image is a 1440×900 viewport at 2× DPI with `prefers-reduced-motion: reduce`
emulated, which is what makes the reveal animations settle instead of catching the page
mid-fade.

## Brand

| Token | Value |
| --- | --- |
| Background | `#0D0D0D` |
| Surface | `#181818` |
| Accent | `#C8FF00` (electric lime) |
| Body text | `#F5F5F5` / muted `#A3A3A3` |
| Display font | Oswald 500–700, uppercase |
| Body font | Inter 400–700 |

All of these live as CSS custom properties in `:root` at the top of `styles.css` — change them
there and the whole site follows.

The logo is a barbell: a white bar with two lime outer plates and two white inner plates. It
picks up `--text` and `--accent`, so it recolours with the theme automatically.

## What's interactive

- Sticky header that solidifies once you scroll past the hero
- Hamburger menu under 768px, closes on link tap or `Esc`
- Nav links highlight the section you're currently reading
- Sections fade and rise into view via `IntersectionObserver`, staggered across grids
- Stat counters animate from zero the first time they're on screen
- Testimonial carousel with prev/next, dots, and 7-second autoplay that pauses on hover/focus
- FAQ accordion built on native `<details>`, so it opens and closes with JavaScript switched off
- Contact form validates name, email, phone and goal inline, and focuses the first error
- Starter-kit form takes an email and swaps itself for a panel with the download and a next step

## SEO

The page is a local business listing as much as a brochure, so most of the search work is in the
`<head>` rather than the copy:

- **Title and description** lead with `strength gym for beginners in Singapore` and keep the brand
  at the end. Nobody searches the gym by name until after they have joined.
- **Structured data** — a `HealthClub` node (address, hours, phone, the three membership offers), a
  `WebSite` node, and a `FAQPage` built from the FAQ section. Every value is duplicated from visible
  copy on purpose: Google discards markup that claims things the page does not say, so **changing a
  price, an opening hour or an FAQ answer means changing it in two places.**
- **Deliberately absent:** `aggregateRating` and `geo`. There are no real reviews or a surveyed
  location behind this build, and inventing either is the one schema mistake that earns a manual
  action rather than just being ignored.
- **`og:image`** is an absolute URL to a 1200×630 PNG. Relative paths and SVGs both render as a
  blank card on every platform, which is what the previous `assets/logo.svg` was doing.
- **The hero image** carries a `srcset`, because it is the Largest Contentful Paint element and a
  phone was downloading the 1920px file for a backdrop it can barely see.

The structural ceiling is that this is one page: one URL can realistically rank for one cluster of
queries. Splitting programs or a second location onto their own pages is the next real gain, and
`sitemap.xml` has a note where those entries would go.

## Accessibility notes

- Semantic landmarks, a skip link, and a real `<table>` for the schedule with row/column headers
- Every image has alt text; icon-only buttons carry `aria-label`
- Visible focus rings on all interactive elements
- `prefers-reduced-motion` disables autoplay, counters, reveals and smooth scrolling

## Customising it

### Rebranding

Every colour, font, spacing, radius and motion value is a CSS custom property in `:root` at the
top of `styles.css` (section 1). Nothing further down the stylesheet hard-codes a hex value, so
editing that one block rebrands the whole site:

```css
:root {
  --bg: #0d0d0d;          /* page background */
  --surface: #181818;     /* cards, header, inputs */
  --text: #f5f5f5;        /* body copy */
  --muted: #a3a3a3;       /* secondary copy */
  --accent: #c8ff00;      /* buttons, links, active states, logo plates */
  --accent-dim: #a8d600;  /* accent hover */
  --danger: #ff6b5e;      /* form validation errors */

  --font-display: "Oswald", "Arial Narrow", sans-serif;
  --font-body: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, …;  /* data — the sets-and-reps grid on the program card */

  --radius: 4px;          /* raise for a softer look */
  --speed: 220ms;         /* global transition duration */
}
```

One group is deliberately outside that scheme. The `--paper-*` tokens and `--plate-red` colour the
program card in the starter-kit section, which stands in for a physical printed training sheet — it
is meant to stay light when the rest of the page is dark, so it does not follow a rebrand of `--bg`
and `--text`. Rebrand it by editing those tokens directly. `--plate-red` is the colour of a 25 kg
Olympic plate and appears exactly once, as the margin rule down the card.

Swapping the fonts also means updating the Google Fonts `<link>` in `index.html`'s `<head>`. If
you go light instead of dark, change `color-scheme: dark` in the same block so form controls and
scrollbars follow.

Keep adding tokens rather than typing literal values elsewhere — that's the one rule that keeps
the rebrand-in-one-place property true.

### Changing the logo

The barbell mark exists in **four** places. Update all of them or they drift apart:

| Where | Form |
| --- | --- |
| `assets/logo.svg` | Standalone file, literal hex fills |
| `assets/favicon.svg` | Rounded tile for the browser tab, literal hex fills |
| `index.html` header | Inlined `<svg class="brand-mark">` |
| `index.html` footer | The same markup a second time |

The two inline copies use classes instead of fills — `.bar` and `.plate-inner` take `--text`,
`.plate-outer` takes `--accent` (`styles.css` section 5) — which is why the header logo recolours
with the theme and the two standalone files don't.

### Adding a contact-form field

Validation is table-driven, so a new field is two edits:

1. **`index.html`** — add the input inside the contact form, plus an error paragraph whose `id`
   is the input's `id` with `Error` appended:

   ```html
   <label for="referral">How did you hear about us?</label>
   <input id="referral" name="referral" type="text" aria-describedby="referralError" />
   <p class="error" id="referralError"></p>
   ```

   Wrap both in a `<div class="field">` like the existing ones — `validateField` toggles the
   `invalid` class on the input's `parentElement`, so the red border comes from that wrapper.

2. **`script.js` section 6** — add a matching entry to the `rules` array:

   ```js
   {
     id: "referral",
     test: function (v) { return v.trim() !== ""; },
     message: "Let us know how you found us.",
   },
   ```

The `id` is the join between the two files — it has to match the input, the error paragraph
minus `Error`, and the rule. Return `true` unconditionally from `test` to make a field optional,
the way `message` already does. Errors show on blur and clear as you type.

### Animating a new element

Add `class="reveal"` and the `IntersectionObserver` in `script.js` section 3 picks it up — the
element fades and rises in the first time it scrolls into view. Siblings revealed in the same
batch stagger automatically, so a whole grid only needs the class on each card.

Don't set `opacity: 0` in your own CSS to do this. Hiding is scoped to `.js .reveal`
(`styles.css` section 16) and the `js` class is only added by an inline script in `<head>`, so
with JavaScript off nothing is ever hidden. Bypassing that pattern risks blanking content for
anyone JS fails on.

Both layers also honour `prefers-reduced-motion`: the CSS neutralises transitions and the JS
skips counters, carousel autoplay and the observer entirely. New motion needs handling in
whichever layer introduces it.

## Wiring it up for real

1. **The contact form and the starter-kit form are both live** and post to
   [FormSubmit](https://formsubmit.co), which relays to the address in `ENQUIRY_ENDPOINT` at the top
   of `script.js` — shared by sections 6 and 8, so it only has to be changed once. Two things to
   know:

   - **The first submission must be confirmed.** FormSubmit emails an activation link to that
     address on the very first POST. Until someone clicks it, submissions are accepted by the
     browser and never delivered.
   - **The address is in the page source**, where scrapers can read it. After activating,
     FormSubmit issues an alias (`formsubmit.co/ajax/<hash>`) that reaches the same inbox
     without publishing it. Swap it into `ENQUIRY_ENDPOINT`; nothing else changes.

   A failed send never shows the success message — it tells the visitor to email
   `CONTACT_FALLBACK` instead, so a silent failure can't swallow an enquiry.

   The starter-kit form additionally sends FormSubmit's `_autoresponse`, which is what mails the
   reader the link to `assets/first-session-guide.html`. That is the only reason the confirmation
   panel can honestly say the plan is on its way — **delete the field and the panel starts lying.**
   If the POST fails, the panel is never shown; the visitor gets the guide link inline instead,
   since the guide is a static page and their copy does not depend on the request succeeding.

2. **The newsletter signup still only `console.log`s** its payload (`script.js` section 7). It
   needs the same treatment before launch — and it is worth deciding whether it should exist at
   all, since it now competes with the starter-kit form for the same low-commitment reader.
3. **Images** — every photo is a `picsum.photos` placeholder. Replace the `src` values in
   `index.html` with real gym and coach photography at the same aspect ratios (programs are 4:3,
   coaches 4:5, hero 16:10 or wider). The map block in the contact section is a styled `div` —
   drop a Google Maps embed iframe in its place.

4. **`assets/og-image.png` bakes in one of those placeholder photos**, so it needs re-rendering
   once real photography lands — it is a screenshot of an HTML card at a 1200×630 viewport, not a
   hand-made image.
5. **`assets/first-session-guide.html` is real, usable programming**, but it is generic beginner
   programming rather than this gym's actual on-ramp. A coach should read it before it goes out
   under their name, and the closing note already tells readers it is guidance, not medical advice.

Coach names, member quotes, prices, the timetable and the "1,200+ members" line under the
starter-kit form are all illustrative — replace with the real thing. The membership prices in
particular now appear in three places: the pricing cards, the FAQ answer, and the `hasOfferCatalog`
block in the JSON-LD.
