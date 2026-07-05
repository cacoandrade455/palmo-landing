# Palmo — Landing Page

Landing page for Palmo, a Brazilian marketplace connecting owners of idle
farmland with agricultural developers. Bilingual (PT/EN), static, no database.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — this version configures theme tokens in CSS
  (`app/globals.css`, via `@theme { ... }`) instead of a `tailwind.config.js`
  file. This is the current Tailwind v4 equivalent of extending
  `theme.colors` — it generates the same utility classes (`bg-primary`,
  `text-deep`, etc). See the comment at the top of `globals.css`.
- **Nunito** (matches the logo's typeface), self-hosted via `next/font/local`
  — no request to Google Fonts at build or runtime. License: SIL OFL 1.1,
  see `app/fonts/OFL-LICENSE.txt`.
- **lucide-react** for the trust-strip and footer icons.
- No database, no CMS. The waitlist form calls a server action
  (`app/actions.ts`) that currently just validates and logs — see the TODO
  there for connecting a real backend.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint     # ESLint
```

No extra configuration is needed beyond the defaults above — `next build`
and Vercel's zero-config Next.js detection handle everything.

## Project structure

```
app/
  layout.tsx        root layout: fonts, metadata, <html lang> default
  page.tsx           assembles all sections
  globals.css        Tailwind import + brand theme tokens (@theme)
  actions.ts          waitlist server action (placeholder backend)
  fonts/              self-hosted Nunito .woff2 files + OFL license
components/
  Header.tsx, Hero.tsx, HowItWorks.tsx, TrustStrip.tsx,
  PricingBanner.tsx, Waitlist.tsx, Footer.tsx, LangToggle.tsx, PlotIcon.tsx
lib/
  content.ts           PT/EN copy dictionary (all page text lives here)
  language-context.tsx client-side language provider (persists to localStorage)
  site-config.ts        WhatsApp number / Instagram URL / site URL — see below
public/
  palmo-logo.svg, palmo-logo-reverse.svg, palmo-icon.svg, palmo-app-icon.svg(+.png)
```

## Brand tokens

Defined in `app/globals.css`:

| Token | Hex | Use |
|---|---|---|
| `deep` | `#173D27` | Wordmark, headings, high-contrast text |
| `primary` | `#12994B` | Buttons, mark, primary UI, waitlist section |
| `accent` | `#F5BE2E` | The "idle plot" yellow — used sparingly for emphasis |
| `neutral` | `#E4EAE5` | Section backgrounds, cards |

The brand concept: the "o" in **palmo** is a plot of land seen from above,
split into four squares, one lit up yellow — the idle plot coming to life.
This echoes once, subtly, as a faint watermark behind the hero card
(`components/PlotIcon.tsx`) — intentionally not repeated elsewhere, per the
brand's "used sparingly" rule.

## Language

PT is the default; the toggle in the header (and the language it sets)
persists to `localStorage` under the key `palmo-lang`. All copy lives in
`lib/content.ts` as a single typed dictionary — no i18n library, no routing
split.

## Before going live — replace these 3 things

1. **WhatsApp number** — `lib/site-config.ts`, `whatsappNumber`. Digits only,
   with country code (e.g. `"5571999999999"`).
2. **Instagram URL** — `lib/site-config.ts`, `instagramUrl`.
3. **Waitlist form backend** — `app/actions.ts`. It currently only
   `console.log`s submissions. Swap in a real destination (a Google Sheet
   webhook, Airtable, Formspree, or a database) before launch, or entries
   will be lost.

Also update `siteUrl` in `lib/site-config.ts` once the real domain is live —
it feeds the Open Graph tags.

## Deploying

See the delivery notes from the build session for the exact `git`, GitHub,
and Vercel commands used to ship this project.
