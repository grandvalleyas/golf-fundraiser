# Multi-Sport Golf Outing Platform — Implementation Plan

> Branch: `main-v2`
> Base: `main`

## Overview

Transform the single-sport football golf outing app into a multi-sport platform supporting both Football and Women's Basketball (WBB) outings. Shared Clerk auth, same Stripe account, separate MongoDB collections per sport, sport-scoped admin dashboards.

---

## Phase 1: Branch Setup & Dependency Upgrades

### 1.1 Create branch

```bash
git checkout -b main-v2
```

### 1.2 Upgrade Next.js (14.1.0 → 16.1.6)

Security requirement: must be above 15.2.9.

This is a **major version jump** with breaking changes:

- **React 19** required (currently React 18)
- **Async dynamic APIs**: `headers()`, `cookies()`, `params`, `searchParams` are now async
- **`next.config.mjs`** → may need updates for new config shape
- App Router is stable, no structural changes needed

Update `package.json`:
```
"next": "16.1.6",
"react": "^19",
"react-dom": "^19",
"@types/react": "^19",
"@types/react-dom": "^19"
```

### 1.3 Upgrade Clerk (4.29.9 → 6.39.0)

Clerk v4 → v6 has major breaking changes:

- `authMiddleware()` → `clerkMiddleware()` with `createRouteMatcher()`
- `auth()` is now **async** → all `const { userId } = auth()` calls become `const { userId } = await auth()`
- `@clerk/clerk-sdk-node` is no longer needed — remove it
- Import paths change: `@clerk/nextjs` and `@clerk/nextjs/server`
- `SignUpButton`/`SignInButton` props changed: `redirectUrl` → `forceRedirectUrl`
- Env vars: `NEXT_PUBLIC_CLERK_SIGN_IN_URL` → `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` (check docs)

Update `package.json`:
```
"@clerk/nextjs": "6.39.0"
```
Remove:
```
"@clerk/clerk-sdk-node": "4.13.0"
```

### 1.4 Upgrade Stripe (14.5.0 → latest)

`stripe` is currently in devDependencies — move to dependencies. Update to latest stable.

### 1.5 Run `pnpm install` and fix build

After upgrading, run `pnpm build` and fix all type errors and breaking changes before proceeding.

---

## Phase 2: Sport Configuration System

### 2.1 Create `src/lib/sports.ts`

Define a sport config type and export configs for each sport:

```ts
export type SportConfig = {
  slug: string;                    // "football" | "wbb"
  name: string;                    // Display name
  title: string;                   // Event title
  description: string;             // Event description
  date: string;                    // Event date
  schedule: { time: string; label: string }[];
  location: string;
  address: string;
  cost: number;                    // Per-person registration cost in dollars
  costIncludes: string;            // What the cost covers
  attire: string;
  proceedsBenefit: string;
  contactEmail: string;
  contactPhone?: string;
  heroImage: string;               // Cloudinary URL
  galleryImages: { title: string; url: string }[];
  sponsorTiers: SponsorTier[];
  hasFirstYearAlumniFree: boolean;
  db: {
    registrations: string;         // MongoDB collection name
    sponsors: string;
  };
  stripeProductPrefix: string;     // e.g. "Football Golf Outing" or "WBB Golf Outing"
};

export type SponsorTier = {
  name: string;          // "Gold", "Silver", "Bronze"
  price: number;
  includesGolf: boolean;
  foursomeIncluded: boolean;
  extras?: string;       // e.g. "4 GV basketball long sleeve hooded shirts"
  description: string;
};
```

### 2.2 Football config

Migrate all hardcoded values from current `page.tsx` files into the football config:

- Cost: $150/person
- Sponsor: flat $200 hole sponsorship
- Date: Friday, July 17, 2026
- DB collections: `registrations`, `sponsors` (existing — keep as-is for backward compat)
- `hasFirstYearAlumniFree: true`
- All current Cloudinary image URLs

### 2.3 WBB config

From the GVSU event page:

- Cost: $125/person
- Date: Sunday, June 14, 2026
- Schedule: 8:00am registration, 9:00am shotgun, 2:00pm awards luncheon
- Location: The Meadows Golf Course, 4645 W Campus Dr., Allendale, MI 49401
- Cost includes: Golf & cart, range balls, snacks, 2 drink tickets, lunch/awards
- Attire: Golf attire/Casual/Laker gear
- Proceeds: Laker Women's Basketball team
- Contact: Amanda Parker (parkera1@gvsu.edu), Kim Schmidt (616.331.3592, schmidtk@gvsu.edu)
- `hasFirstYearAlumniFree: false` (TBD — confirm with Curtis)
- DB collections: `wbb_registrations`, `wbb_sponsors`
- Sponsor tiers:
  - Gold $800 — foursome, name on tee box/recognition at lunch, 4 GV basketball long sleeve hooded shirts
  - Silver $600 — foursome, name on tee box/recognition at lunch
  - Bronze $250 — name on tee box/recognition at lunch (no golf)
- Gallery images: placeholder/empty until WBB provides photos

### 2.4 Helper: `getSportConfig(slug: string)`

Returns the config for a given sport slug, throws 404 if not found. Used by all pages and API routes.

---

## Phase 3: Route Restructure

### 3.1 New URL structure

```
/                              → Sport selector homepage
/[sport]                       → Sport landing page
/[sport]/register              → Registration form
/[sport]/sponsor               → Sponsorship page
/[sport]/admin                 → Admin dashboard
/[sport]/success               → Post-payment confirmation
/api/[sport]/checkout           → Registration checkout (GET/POST/PUT/PATCH)
/api/[sport]/checkout/free      → Free registration
/api/[sport]/sponsor            → Sponsor CRUD
/api/[sport]/sponsor/create-checkout-session
/api/[sport]/sponsor/retrieve-session
/api/[sport]/sponsor/upgrade
/api/[sport]/admin/registrations
/api/[sport]/admin/sponsors
/api/webhook                   → Global (reads sport from Stripe metadata)
/api/cloudinary/delete          → Global (unchanged)
```

### 3.2 Move existing pages

| Current path | New path |
|---|---|
| `src/app/page.tsx` | `src/app/[sport]/page.tsx` (generalized) |
| `src/app/register/page.tsx` | `src/app/[sport]/register/page.tsx` |
| `src/app/sponsor/page.tsx` | `src/app/[sport]/sponsor/page.tsx` |
| `src/app/admin/page.tsx` | `src/app/[sport]/admin/page.tsx` |
| `src/app/success/page.tsx` | `src/app/[sport]/success/page.tsx` |

### 3.3 New homepage (`src/app/page.tsx`)

Simple sport selector page:
- Hero section with GVAS branding
- Two cards: Football and Women's Basketball
- Each card shows: sport name, event date, brief description, "View Event →" link to `/football` or `/wbb`
- No auth required (public page)

### 3.4 Validate `[sport]` param

In each `[sport]` page/layout, validate that the sport slug is valid ("football" or "wbb"). If not, redirect to 404.

---

## Phase 4: Generalize Pages

### 4.1 Sport landing page (`/[sport]/page.tsx`)

Refactor current homepage to read from `SportConfig`:
- Hero image, title, description from config
- Event details (date, time, schedule, location, cost, attire) from config
- CTA buttons link to `/{sport}/register` and `/{sport}/sponsor`
- Gallery images from config
- Proceeds text from config

### 4.2 Registration page (`/[sport]/register/page.tsx`)

Refactor current register page:
- Read `cost` from sport config instead of hardcoded `150`
- Read `hasFirstYearAlumniFree` from config
- API calls go to `/api/{sport}/checkout` instead of `/api/checkout`
- Success redirect goes to `/{sport}/register?success=true`
- Cancel redirect goes to `/{sport}/register?cancel=true`

### 4.3 Sponsor page (`/[sport]/sponsor/page.tsx`)

Refactor current sponsor page:
- Read sponsor tiers from sport config
- Football: single $200 hole sponsor tier (keep current behavior)
- WBB: Gold/Silver/Bronze tiers with different pricing and perks
- API calls go to `/api/{sport}/sponsor/*`

### 4.4 Admin page (`/[sport]/admin/page.tsx`)

Refactor current admin page:
- Fetch from `/api/{sport}/admin/registrations` and `/api/{sport}/admin/sponsors`
- Admin access check: `user.publicMetadata.role === "admin"` (keep existing)
  - Optionally scope by sport: `user.publicMetadata.sports` array includes the sport slug
  - If `sports` metadata is not set, allow access to all (backward compat for existing admins)
- Page title shows sport name

### 4.5 Success page (`/[sport]/success/page.tsx`)

Minimal — just update the "Go Home" link to `/{sport}`.

---

## Phase 5: Generalize API Routes

### 5.1 All API routes under `/api/[sport]/`

Each route:
1. Reads `sport` from the dynamic route param
2. Calls `getSportConfig(sport)` to get the config
3. Uses `config.db.registrations` / `config.db.sponsors` as the MongoDB collection name
4. Uses `config.stripeProductPrefix` in Stripe line item names

### 5.2 `/api/[sport]/checkout/route.ts`

Copy current `/api/checkout/route.ts`, modify:
- Collection name from config: `db.collection(config.db.registrations)`
- Stripe product name: `config.stripeProductPrefix + " Registration"`
- Cost references use `config.cost` instead of hardcoded 150
- Add `sport` to Stripe session metadata
- Success/cancel URLs: `/{sport}/register?success=true`

### 5.3 `/api/[sport]/checkout/free/route.ts`

Same pattern — use config for collection name.

### 5.4 `/api/[sport]/sponsor/` routes

All sponsor routes use `config.db.sponsors` collection. Add `sport` to Stripe metadata.

### 5.5 `/api/[sport]/admin/` routes

Read from sport-specific collections.

### 5.6 `/api/webhook/route.ts`

Update the global webhook:
- Read `sport` from `session.metadata.sport`
- Call `getSportConfig(sport)` to get collection names
- Route inserts/updates to the correct collections
- Fallback: if no `sport` in metadata (old sessions from before the migration), default to football collections for backward compatibility

---

## Phase 6: Middleware & Navbar Updates

### 6.1 Update middleware (`src/middleware.ts`)

Migrate from `authMiddleware` to `clerkMiddleware`:

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/:sport",
  "/api/webhook",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/:sport/sponsor",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### 6.2 Update Navbar (`src/app/Navbar.tsx`)

Make sport-aware:
- When on a sport page (`/football/*`, `/wbb/*`), show sport-specific nav links:
  - Home → `/{sport}`
  - Register → `/{sport}/register`
  - Sponsor → `/{sport}/sponsor`
- When on the root `/`, show just the GVAS logo and auth buttons
- Read sport from `usePathname()`

---

## Phase 7: MongoDB Migration

### 7.1 Existing data

The current `golf_fundraiser_2026` database has `registrations` and `sponsors` collections with live football data. **Do not rename or move these.**

Football config should reference these existing collection names:
```ts
db: {
  registrations: "registrations",
  sponsors: "sponsors",
}
```

### 7.2 WBB collections

WBB config uses new collections (created automatically by MongoDB on first insert):
```ts
db: {
  registrations: "wbb_registrations",
  sponsors: "wbb_sponsors",
}
```

### 7.3 Update `connectToDatabase()`

Remove the hardcoded `createCollection` and `createIndex` calls for `registrations`. Instead, make indexing sport-aware or move it to a setup script. At minimum, ensure indexes exist for both sets of collections.

---

## Phase 8: Admin Access for Amanda Parker

### 8.1 Clerk metadata

Once Amanda Parker creates an account, set her public metadata in Clerk dashboard:
```json
{
  "role": "admin",
  "sports": ["wbb"]
}
```

For existing admins (Curtis, Kim), update to:
```json
{
  "role": "admin",
  "sports": ["football", "wbb"]
}
```

Or if `sports` is absent, treat as access to all (backward compat).

---

## Phase 9: Stripe Configuration

### 9.1 Same Stripe account

No new Stripe account needed. Same API keys. The differentiation is in the product/line item names and the `sport` metadata field.

### 9.2 Webhook

Single webhook endpoint: `https://golf.gvathleticsociety.com/api/webhook`

Already configured in Stripe — no changes needed to the webhook URL. The route handler uses `sport` from metadata to route to the correct DB collection.

---

## Phase 10: Testing & Deployment

### 10.1 Pre-deployment checklist

- [ ] `pnpm build` passes with zero errors
- [ ] Football registration flow works end-to-end (no regressions)
- [ ] Football sponsor flow works end-to-end
- [ ] Football admin dashboard loads existing data
- [ ] WBB landing page renders correctly
- [ ] WBB registration flow works with $125 pricing
- [ ] WBB sponsor tiers (Gold/Silver/Bronze) work correctly
- [ ] WBB admin dashboard shows only WBB data
- [ ] Stripe webhook correctly routes to football vs WBB collections based on metadata
- [ ] Old Stripe sessions (no `sport` metadata) still process correctly (backward compat)
- [ ] Clerk auth works — single login across both sports
- [ ] Admin access scoping works (Amanda sees WBB only, Curtis/Kim see both)
- [ ] Navbar updates correctly per sport context
- [ ] Homepage sport selector works
- [ ] 404 for invalid sport slugs

### 10.2 Deploy

Deploy `main-v2` to Vercel. Once verified, merge to `main`.

---

## Open Questions (need answers from Curtis/Kim)

1. Does WBB have a "first-year alumni free" registration option?
2. Gold sponsor includes "4 GV basketball long sleeve hooded shirts" — do we need to collect shirt sizes in the form?
3. Does Kim need admin access to the WBB dashboard, or just Football?
4. The GVSU page shows 3 buttons: "Register", "Tee Sponsor (no golf)", "Sponsorship (with golf)". Is "Tee Sponsor" the same as Bronze ($250)? Or is it a separate category?
5. Does Amanda Parker need access to the Football admin dashboard too?

---

## File Change Summary

### New files
- `src/lib/sports.ts` — sport config definitions
- `src/app/page.tsx` — new sport selector homepage
- `src/app/[sport]/page.tsx` — sport landing page (generalized from old homepage)
- `src/app/[sport]/register/page.tsx` — generalized registration
- `src/app/[sport]/sponsor/page.tsx` — generalized sponsor
- `src/app/[sport]/admin/page.tsx` — generalized admin
- `src/app/[sport]/success/page.tsx` — generalized success
- `src/app/api/[sport]/checkout/route.ts`
- `src/app/api/[sport]/checkout/free/route.ts`
- `src/app/api/[sport]/sponsor/route.ts`
- `src/app/api/[sport]/sponsor/create-checkout-session/route.ts`
- `src/app/api/[sport]/sponsor/retrieve-session/route.ts`
- `src/app/api/[sport]/sponsor/upgrade/route.ts`
- `src/app/api/[sport]/admin/registrations/route.ts`
- `src/app/api/[sport]/admin/sponsors/route.ts`

### Modified files
- `package.json` — dependency upgrades
- `src/middleware.ts` — Clerk v6 migration + new routes
- `src/app/Navbar.tsx` — sport-aware navigation
- `src/app/layout.tsx` — updated metadata
- `src/lib/mongodb.ts` — remove hardcoded collection setup
- `src/lib/stripe.ts` — update API version if needed
- `src/app/api/webhook/route.ts` — sport-aware routing
- `src/app/not-found.tsx` — update redirect target

### Deleted files
- `src/app/register/page.tsx` (moved to `[sport]/`)
- `src/app/sponsor/page.tsx` (moved to `[sport]/`)
- `src/app/admin/page.tsx` (moved to `[sport]/`)
- `src/app/success/page.tsx` (moved to `[sport]/`)
- Remove `@clerk/clerk-sdk-node` dependency
