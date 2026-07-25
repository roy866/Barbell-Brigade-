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
| `index.html` | All page markup — nav, hero, stats, programs, coaches, pricing, schedule, testimonials, contact, footer |
| `styles.css` | Design tokens + all styling, organised into 17 numbered sections |
| `script.js` | Mobile nav, scroll spy, reveal animations, stat counters, carousel, form validation |
| `assets/logo.svg` | Standalone barbell logo (also inlined in the header so CSS can recolour it) |
| `assets/favicon.svg` | Rounded-square version of the mark for the browser tab |
| `assets/screenshot.jpg` | The hero shot at the top of this README |
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
- Contact form validates name, email, phone and goal inline, and focuses the first error

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

  --radius: 4px;          /* raise for a softer look */
  --speed: 220ms;         /* global transition duration */
}
```

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

1. **The contact form is live** and posts to [FormSubmit](https://formsubmit.co), which relays to
   the address in `ENQUIRY_ENDPOINT` at the top of `script.js` section 6. Two things to know:

   - **The first submission must be confirmed.** FormSubmit emails an activation link to that
     address on the very first POST. Until someone clicks it, submissions are accepted by the
     browser and never delivered.
   - **The address is in the page source**, where scrapers can read it. After activating,
     FormSubmit issues an alias (`formsubmit.co/ajax/<hash>`) that reaches the same inbox
     without publishing it. Swap it into `ENQUIRY_ENDPOINT`; nothing else changes.

   A failed send never shows the success message — it tells the visitor to email
   `CONTACT_FALLBACK` instead, so a silent failure can't swallow an enquiry.

2. **The newsletter signup still only `console.log`s** its payload (`script.js` section 7). It
   needs the same treatment before launch.
3. **Images** — every photo is a `picsum.photos` placeholder. Replace the `src` values in
   `index.html` with real gym and coach photography at the same aspect ratios (programs are 4:3,
   coaches 4:5, hero 16:10 or wider). The map block in the contact section is a styled `div` —
   drop a Google Maps embed iframe in its place.

Coach names, member quotes, prices and the timetable are all illustrative — replace with the
real thing.
