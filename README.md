# Barbell Brigade

A single-page marketing site for **Barbell Brigade**, a strength and conditioning gym aimed at
people who want to get fit — beginners first, no experience assumed.

Built with plain HTML, CSS and vanilla JavaScript. No build step, no dependencies.

## Run it

**Easiest — VS Code Live Server:**

1. Install the *Live Server* extension (`ritwickdey.LiveServer`).
2. Right-click `index.html` → **Open with Live Server**.

**Or just open the file:** double-click `index.html`. Everything works except the Google Fonts
and placeholder images, which need an internet connection.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All page markup — nav, hero, stats, programs, coaches, pricing, schedule, testimonials, contact, footer |
| `styles.css` | Design tokens + all styling, organised into 17 numbered sections |
| `script.js` | Mobile nav, scroll spy, reveal animations, stat counters, carousel, form validation |
| `assets/logo.svg` | Standalone barbell logo (also inlined in the header so CSS can recolour it) |
| `assets/favicon.svg` | Rounded-square version of the mark for the browser tab |

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

## Wiring it up for real

Two things are placeholders and need swapping before launch:

1. **Forms** — both the contact form and newsletter signup currently `console.log` their payload.
   Point them at your form handler (Formspree, Netlify Forms, or your own endpoint) in
   `script.js` sections 6 and 7.
2. **Images** — every photo is a `picsum.photos` placeholder. Replace the `src` values in
   `index.html` with real gym and coach photography at the same aspect ratios (programs are 4:3,
   coaches 4:5, hero 16:10 or wider). The map block in the contact section is a styled `div` —
   drop a Google Maps embed iframe in its place.

Coach names, member quotes, prices and the timetable are all illustrative — replace with the
real thing.
