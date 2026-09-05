# The Next Gen Store — Merchant Dashboard

The merchant-facing dashboard for an AI-powered growth platform. Merchants use it
to monitor customers, products, AI-surfaced growth opportunities, revenue impact
and agent activity.

This is **step 1**: the application shell and its component system. There is no
AI logic, database, payment integration, email delivery or storefront yet — every
page takes data as props and renders a real empty state until that data exists.

## Getting started

```bash
npm run dev
```

Then open <http://localhost:3000>. `/` redirects to `/overview`.

## Stack

- **Next.js 16** (App Router, Turbopack) with React 19
- **TypeScript** in strict mode
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`
- **lucide-react** for icons

## Design system

Classic Corporate: Deep Navy `#0F172A` text on Crisp White `#FFFFFF`, with Sky
Blue `#0284C7` reserved for primary actions. Hierarchy comes from borders,
spacing and type weight rather than shadows, gradients or large radii.

Every token lives in the `@theme` block at the top of [`app/globals.css`](app/globals.css) —
colours, the font stack and the radius scale. Components reference tokens
(`text-navy`, `bg-brand-600`, `border-line`), never raw hex, so the system can be
re-themed from that one file.

### Typeface

The design calls for **Satoshi**, which ships from Fontshare rather than Google
Fonts. **Plus Jakarta Sans** stands in for it — the same geometric skeleton, tall
x-height and low stroke contrast — self-hosted by `next/font`.

To switch to the real family, drop `Satoshi-Variable.woff2` into `app/fonts/` and
change the single export in [`lib/fonts.ts`](lib/fonts.ts) to `next/font/local`.
Nothing else needs to change; `--font-sans` already lists `"Satoshi"` first.

## Structure

```
app/
  layout.tsx              Root layout — font variable, metadata
  page.tsx                Redirects / to /overview
  (dashboard)/            Route group: adds the shell without a URL segment
    layout.tsx
    overview/             /overview
    customers/            /customers
    products/             /products
    growth/
      opportunities/      /growth/opportunities
      actions/            /growth/actions
    analytics/            /analytics
    audit-logs/           /audit-logs
    settings/             /settings

components/
  layout/                 Sidebar, header, mobile drawer, page frame
  ui/                     Button, Badge, Card, Table, EmptyState, MetricCard,
                          Input, Select, Switch, Avatar, Popover, Toolbar
  overview/ customers/ products/ growth/ audit-logs/ analytics/ settings/
                          One view component per section
  demo/                   Removable demo-data layer (see below)

lib/
  nav.ts                  Single source of truth for navigation and page titles
  labels.ts               Domain enum → display label + badge tone
  format.ts               INR currency, dates, grouping
  fonts.ts  merchant.ts  utils.ts  placeholder-data.ts

types/index.ts            Customer, Product, Opportunity, AgentAction, AuditLogEntry
```

### How to extend it

- **Add a section**: add one entry to `NAV_ITEMS` in `lib/nav.ts` and one
  `page.tsx`. The sidebar, page title and breadcrumb follow automatically.
- **Connect real data**: pages are Server Components that currently pass empty
  collections (`<CustomersView customers={[]} />`). Fetch in the page, pass the
  result down — no component contracts change.
- **Add a status or type**: extend the union in `types/index.ts`, then add its
  label and badge tone in `lib/labels.ts`. Filter dropdowns are generated from
  those maps, so they pick it up for free.

## Demo data

The header carries a **Demo data** switch. When it is on *and* a page has no real
rows, views substitute illustrative rows from
[`lib/placeholder-data.ts`](lib/placeholder-data.ts) so the dashboard can be
reviewed at realistic density. Real data always wins over demo data.

It starts **on**; set `DEMO_ENABLED_BY_DEFAULT` to `false` in
[`components/demo/demo-data.ts`](components/demo/demo-data.ts) to land on genuine
empty states, or flip the switch in the header.

To retire the layer entirely: delete `components/demo/` and
`lib/placeholder-data.ts`, drop `<DemoToggle />` from
`components/layout/header.tsx`, and remove the `useDemo*` calls from each view.

## Not built yet

Deliberately absent, and marked as such in the UI where a merchant would look for
them: AI decision logic, the store database, payment integration, email and
notification delivery, the customer storefront, authentication, and analytics
charts. Controls that would trigger one of these (Approve/Dismiss on an
opportunity, Save on Settings, Sign out) are rendered but disabled rather than
simulating a result.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build + typecheck
npm run lint    # eslint
```
