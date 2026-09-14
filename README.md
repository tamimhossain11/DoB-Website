# Dreams of Bangladesh — website

Website for Dreams of Bangladesh. Vite + React + Tailwind CSS v4.

## Pages

| URL                    | Source                          |
| ---------------------- | ------------------------------- |
| `/`                    | `index.html` → `src/main.jsx`   |
| `/wice-press-release`  | `wice-press-release/index.html` → `src/press.jsx` |

This is a Vite **multi-page** build (`build.rollupOptions.input` in `vite.config.js`), not a
client-side router — each page is a real HTML file, so the press release has a shareable,
indexable URL and needs no SPA rewrite rules on the host.

### WICE Press Release page

Hosts `public/DOB_WICE_2026_Press_Release_A4.pdf` with download + open-in-tab actions, an
inline PDF viewer on desktop, a rendered image fallback on mobile, and the full Bengali text
transcribed into HTML (so the release is searchable and screen-reader accessible — PDFs are
opaque to both). The transcription lives in `src/data/press.js`; **if the PDF is revised,
update that file to match.**

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # serve the production build
```

> **Note:** this machine has `NODE_ENV=production` exported in the shell, which makes
> `npm install` silently skip devDependencies (Vite and Tailwind). If `vite: command not
> found` appears, install with:
>
> ```bash
> NODE_ENV=development npm install --include=dev
> ```

## Editing content

All copy, stats, projects, competitions, roster, sponsor tiers and contact details live in
one file:

```
src/data/content.js
```

Change text there — no component edits needed. Entries marked `// VERIFY` are drawn from
public reporting about the team and **should be confirmed against your own records before
launch**, in particular:

- the placement and "only Asian team" claim for NASA HERC
- competition years, host cities and standings
- the Best Innovator Award attribution
- team size, founding year, email address and social links

The leadership roster is placeholder — replace names/roles, and optionally add
`photo: '/team/name.jpg'` to any member to show a portrait instead of initials.

## Brand

Colours are sampled from the logo and defined as Tailwind theme tokens in `src/index.css`:

| Token        | Hex       | Use                          |
| ------------ | --------- | ---------------------------- |
| `flag`       | `#006A4E` | primary green                |
| `leaf`       | `#00603C` | green, hover/darker          |
| `forest`     | `#04241A` | dark section background      |
| `ink`        | `#06170F` | darkest ground, body text    |
| `mint`       | `#7FD1AE` | light green on dark          |
| `crimson`    | `#CC0024` | logo red                     |
| `vermilion`  | `#E01A32` | accent red                   |
| `paper`      | `#F7F5EF` | cream page background        |
| `parchment`  | `#EFEBE0` | alternate light section      |

Type: **Fraunces** (display), **Inter** (UI), **JetBrains Mono** (labels).

## Images

`public/logo.jpeg` is the original supplied logo. The other assets are generated from it:

- `logo-mark.png` — background removed, transparent, used in the nav/footer
- `favicon-32/180/512.png` — square app icons (flag + robot detail)
- `og-image.png` — 1200×630 social share card

If the logo is ever re-supplied at higher resolution, regenerate these to match.

## Structure

```
src/
  main.jsx                home page entry
  press.jsx               press release page entry
  App.jsx                 home section order
  index.css               theme tokens, utilities, keyframes
  data/content.js         ← all home page copy
  data/press.js           ← WICE press release transcription
  components/
    PressRelease.jsx      the press release page
    ui.jsx                Reveal / Kicker / Button / Section primitives
    Nav.jsx               sticky nav + mobile sheet + scroll spy
    Hero.jsx              headline, CTAs, marquee band
    OrbitGraphic.jsx      generative SVG planet motif
    Stats.jsx             achievement band
    Mission.jsx           mission statement + pillars
    Projects.jsx          programme accordion
    Campaigns.jsx         competition timeline + awards
    Team.jsx              divisions, roster, join CTA
    Partners.jsx          sponsor tiers + logo slots
    Footer.jsx
    ScrollProgress.jsx
```

## Still to add

- Real photography — the site is deliberately type- and diagram-led because no team or
  rover photos were supplied. Hero, projects and team sections all have natural places for
  images once you have them.
- Real sponsor logos in place of the five "Your logo" slots in `Partners.jsx`.
