# Mailer CRM

Private tool for running Shift Solutions' shared EDDM postcard business: campaigns, spot sales, a lightweight CRM, dynamic QR codes, and an advertiser results portal. The full product spec lives in the Shift Solutions project (`mailer-crm-spec.md`).

**Stack:** Next.js 16 (App Router, Cache Components) · Supabase (Postgres + Auth) · Tailwind 4 · Zod · Vercel

## Status

| Phase | Scope | State |
|---|---|---|
| 1 | Foundation, card formats, campaigns, spot board, financials | **Done** |
| 2 | CRM: contacts, activities, follow-ups, CSV import | Next |
| 3 | QR codes and `/q/[slug]` redirect | — |
| 4 | Client portal and emails | — |
| 5 | Stats, goals, streak, `/book`, Stripe | — |

### What Phase 1 includes

- **Database:** every table from the spec (so later phases need no breaking migrations), RLS on all of them, a `campaign_financials` view, and seed data for both card formats.
- **Admin auth:** Supabase email + password. `src/proxy.ts` refreshes the session and redirects signed-out visitors; `requireAdmin()` in `src/lib/auth.ts` is the real gate and runs in every page, Server Action, and route handler.
- **Card formats** (`/formats`): create/edit formats and their spots (code, side, size, inches, default price, house spot, position on the card), with a to-scale layout preview.
- **Campaigns** (`/campaigns`): create from a format (a database trigger copies the format's spots), edit, delete.
- **Campaign page:** to-scale spot board (front and back), a click-to-edit drawer (status, business, category, list/sold price, payment, creative status), a sortable spot table, financials with the red/green breakeven bar, go/no-go against `min_spots_to_go`, a date timeline with countdowns, and a CSV export for production.
- **Dashboard** (`/`): active campaigns with breakeven bars, spots sold, revenue, and days to the sales deadline.

Selling a spot to a new business name creates a contact for it, and any sale moves that contact to "customer," so Phase 2's CRM starts with real data.

## Setup

### 1. Supabase

1. Create a Supabase project.
2. Apply the migrations in `supabase/migrations/` in order. Either:
   - `npx supabase link --project-ref <ref>` then `npx supabase db push`, or
   - paste each file into the SQL editor and run it.
3. **Authentication → Users → Add user:** create Ryan's account with email and password.
4. Make that user the admin (SQL editor):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'ryan@shiftsolutions.io';
   ```
5. **Authentication → Sign In / Providers:** turn off "Allow new users to sign up." RLS already blocks non-admins from every table, but there's no reason to allow signups.

### 2. Local development

```bash
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 3. Vercel

1. Import the GitHub repo in Vercel (framework preset: Next.js).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
3. Deploy.

**Before printing any QR code (Phase 3):** point a subdomain you control, such as `q.helloshiftsolutions.com`, at Vercel with a CNAME. Printed codes must never point at a `*.vercel.app` URL. Also confirm Vercel's current terms for commercial use on the Hobby plan.

## Tests

```bash
npm test            # unit tests: financial math, payment rules, money parsing, CSV
npm run typecheck
npm run lint
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/phase1_checks.sql
```

The SQL checks cover acceptance tests 5 (breakeven and profit match a hand calculation) and 6 (a 9×12 campaign gets exactly 15 spots with the right sizes and prices). They run in a transaction and roll back; use a local or branch database.

## Notes and decisions

- **Money is stored in integer cents** everywhere. Forms take dollars.
- **Revenue** counts sold spots at their sold price; **collected** counts every payment received.
- **Payment status is derived** from the amount received (0 → unpaid, less than price → partial, full → paid), except "refunded," which is kept as entered. "Mark paid in full" records the sold price.
- **Spot positions** (`x_in`, `y_in`, inches from the top-left of a side) drive the spot board. The seeded positions are a reasonable starting layout; edit them in `/formats` to match the print file. Campaigns keep their own copy, so editing a format doesn't change existing campaigns.
- **6.25×11 community card:** seeded with C1–C8 on the front and C9–C15 plus the house spot (H1) on the back. Change sides in `/formats` if the real layout differs.
- **Cache Components is on** (Next 16 default). Pages render a static shell and stream their data behind `<Suspense>`, which is why each page has a small sync wrapper around an async data component.
