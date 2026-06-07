# PaveWorks — Pavement Design Workbook (Nepal)

A comprehensive, one-stop pavement design tool for Nepal — from traffic and CBR
through to **Flexible**, **Rigid** and **Combined** pavement design — implementing
the major methods used in the region:

| Method | Scope |
| --- | --- |
| **Nepal DoR 2021** | Flexible — Guidelines for the Design of Flexible Pavement (2nd Rev.) |
| **TRL Overseas Road Note 31** | Flexible — structural catalogue (T1–T8 × S1–S6) |
| **IRC 37-2018** | Flexible — mechanistic-empirical (fatigue & rutting) |
| **IRC 58-2015** | Rigid — plain jointed (stress, fatigue, dowel & tie bars) |
| **AASHTO 1993** | Flexible (SN) & Rigid (slab thickness) |

There are **two independent deliverables**:

1. **Web app** (this repo) — a modern, interactive workbench with live results,
   a pavement cross-section visualiser, charts, and **PDF + Excel export**.
2. **Standalone Excel workbook** — a self-contained `.xlsx` with live formulas,
   usable entirely in Excel (bundled at `public/downloads/Pavement-Design-Workbook.xlsx`
   and downloadable from the app's *Results* page).

## Features

- **Traffic** — cumulative ESAL / MSA, VDF, growth, ORN 31 traffic class.
- **Subgrade** — design CBR (mean / percentile), resilient modulus MR, modulus of
  subgrade reaction k, ORN 31 subgrade class.
- **Materials** — layer moduli, AASHTO layer coefficients, concrete Ec & flexural strength.
- **Flexible** — DoR 2021, ORN 31 catalogue, IRC 37 M-E check, AASHTO SN.
- **Rigid** — IRC 58 (Westergaard / IITRIGID stress + Bradbury temperature + CFD +
  dowel/tie) and AASHTO 1993 slab thickness.
- **Combined** — AASHTO overlay design (flexible & rigid).
- **Results** — side-by-side comparison, PDF report and Excel export.
- Light / dark theme, project state persisted in the browser.

> All equation-based outputs (AASHTO SN/D, IRC 37 fatigue/rutting, IRC 58 stress &
> cumulative fatigue damage, traffic, MR, k) are computed exactly and covered by unit
> tests. ORN 31 / DoR catalogue thicknesses are **indicative** and must be confirmed
> against the official charts / IITPAVE / IITRIGID before construction.

## Tech stack

React 18 · TypeScript · Vite 6 · Tailwind CSS · Zustand · React Router · Recharts ·
Framer Motion · jsPDF · SheetJS · Vitest. 100% client-side — no backend.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run test       # run the calculation-engine unit tests
```

## Project structure

```
src/
  lib/            # tested calculation engine (pure, cited functions)
    traffic.ts  subgrade.ts  materials.ts
    flexible-aashto.ts  flexible-irc37.ts  flexible-orn31.ts  flexible-dor.ts
    rigid-aashto.ts  rigid-irc58.ts  combined.ts
    __tests__/    # Vitest worked-example tests
  store/          # Zustand project state + derived values + results
  components/     # UI primitives, cross-section, charts, layout
  pages/          # Project, Traffic, Subgrade, Materials, Flexible, Rigid, Combined, Results, About
  lib/export/     # PDF (jsPDF) and Excel (SheetJS) export
public/
  downloads/Pavement-Design-Workbook.xlsx   # the standalone Excel workbook
  _redirects                                # SPA fallback for Cloudflare Pages
```

## Deploy to Cloudflare Pages

This is a static SPA — deploy via **Cloudflare Pages** (Git integration):

1. Push this repo to GitHub (done).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Select this repository.
4. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. **Save and Deploy.** Every push to `main` auto-deploys.

### Custom domain

Pages → your project → **Custom domains → Set up a custom domain** → enter your
domain/subdomain. Cloudflare adds the `CNAME` automatically when the domain is on
your Cloudflare account; otherwise add the shown `CNAME` at your DNS provider.

The included `public/_redirects` (`/* /index.html 200`) makes client-side routing
work on Pages.

## License

[MIT](./LICENSE). Engineering design aid — verify every design against the governing
standard before construction.
