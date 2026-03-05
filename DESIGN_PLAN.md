# GVAS Golf Outings — Design Redesign Plan

## Current State Assessment

### What's Wrong
- **Generic bootstrap feel** — flat cards, no visual hierarchy, everything looks the same weight
- **No typography system** — just Tailwind defaults, no font pairing, inconsistent sizing
- **Hero sections are weak** — low-opacity image with centered text, no depth or energy
- **Navbar is basic** — solid color bar, no glass/blur, no mobile hamburger menu
- **Footer is an afterthought** — single line, no useful content
- **Register/Sponsor pages are plain forms** — no visual context, no progress indication, no delight
- **Admin page** — functional but visually disconnected from the rest of the site
- **No motion** — zero transitions, hover states are minimal, page loads feel static
- **Sport landing page** — wall of text in a single card, gallery is a flat grid with no interaction
- **Color palette** — the blue HSL values are fine but underutilized; everything is the same shade

### What to Keep
- GVAS logo (Cloudinary URL)
- Blue color family (GV brand: deep blue primary `hsl(217, 70%, 40%)`)
- Existing shadcn/ui component library
- Tailwind CSS + CSS variables architecture
- All existing functionality and data flow

---

## Design Vision

**Concept: "Premium Athletic Event Platform"** — Think clean sports event sites like PGA tournament pages or university athletics fundraiser portals. Confident, spacious, with subtle motion and strong visual hierarchy.

---

## 1. Typography & Font System

**Font pairing:**
- **Headings:** `Inter` (tight tracking, bold weights) — already available via `next/font`
- **Body:** `Inter` at regular weight — clean and legible

**Scale (mobile → desktop):**
- Hero title: `text-3xl → text-6xl`, `font-extrabold`, `tracking-tight`
- Section headings: `text-xl → text-3xl`, `font-bold`
- Card titles: `text-lg → text-xl`, `font-semibold`
- Body: `text-sm → text-base`
- Captions/labels: `text-xs → text-sm`, `text-muted-foreground`

**Add to `layout.tsx`:**
```tsx
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Apply: <body className={`${inter.variable} font-sans ...`}>
```

---

## 2. Color Palette Refinement

Keep the existing CSS variables but add depth layers:

```css
/* Add to globals.css */
--gradient-start: 217 70% 35%;    /* Darker blue for gradient starts */
--gradient-end: 217 70% 50%;      /* Lighter blue for gradient ends */
--surface: 0 0% 100%;             /* Pure white card surfaces */
--surface-hover: 216 30% 97%;     /* Subtle hover state */
--success: 142 71% 45%;           /* Green for completed states */
--success-foreground: 0 0% 100%;
```

**Key principle:** White surfaces (`--surface`) floating on the light blue-gray `--background`. Creates depth without dark mode complexity.

---

## 3. Layout & Spacing System

**Global container:** Max `1200px`, generous padding (`px-6 sm:px-8 lg:px-12`)

**Vertical rhythm:** Sections separated by `py-16 sm:py-24` — let the content breathe

**Card elevation system:**
- Level 0: Flat (borders only) — table rows, list items
- Level 1: `shadow-sm` — content cards
- Level 2: `shadow-md hover:shadow-lg transition-shadow` — interactive cards (sport selector, sponsor tiers)
- Level 3: `shadow-xl` — modals, dialogs

---

## 4. Component Redesigns

### 4a. Navbar → Sticky Glass Header
- `sticky top-0 z-50 backdrop-blur-md bg-primary/90 border-b border-white/10`
- Logo left, nav links center, UserButton right
- Mobile: hamburger menu using shadcn `Sheet` (slide-in from right)
- Active link indicator: bottom border or subtle background pill
- Smooth show/hide on scroll (optional, nice-to-have)

### 4b. Homepage (Sport Selector)
- Full-viewport hero with parallax-style background, gradient overlay (`bg-gradient-to-b from-black/60 via-black/30 to-transparent`)
- Large title with subtle fade-in animation
- Sport cards below: larger, with hover scale transform (`hover:scale-[1.02] transition-transform`)
- Each card: full-bleed image top, gradient overlay at bottom with text, rounded-xl corners
- Badge showing date on each card

### 4c. Sport Landing Page
- **Hero:** Full-width, taller (`h-[70vh]`), with gradient overlay and CTA buttons with backdrop blur
- **Info section:** Replace single card with a clean multi-section layout:
  - Quick facts strip: Date | Location | Cost — horizontal on desktop, stacked on mobile
  - Schedule as a visual timeline (vertical line with dots, not a bullet list)
  - Sponsor tiers as a horizontal card row with pricing, not buried in text
- **Gallery:** Masonry-style or bento grid layout, with lightbox on click (use Dialog)
- **CTA section:** Full-width colored band at bottom with register/sponsor buttons

### 4d. Register Page
- Two-column on desktop: form left, summary card right (sticky)
- Summary card shows: sport name, cost breakdown, total — updates live
- Form sections with subtle dividers and section labels
- Preferred golfers: cleaner input group with add/remove buttons
- Payment button: large, full-width, with price shown on button
- View mode: clean card with edit button, status badge

### 4e. Sponsor Page
- Tier selection: horizontal card picker (not a dropdown) — each tier is a clickable card showing name, price, what's included
- Selected tier highlighted with ring + scale
- Form fields appear below selected tier with smooth reveal
- Existing sponsorship view: larger card with logo prominent, tier badge

### 4f. Admin Dashboard
- Already rebuilt — just needs consistent card styling and the new font
- Add subtle row hover states to tables

### 4g. Footer
- Two-column: left has logo + tagline, right has contact email + links
- Subtle top border, more padding
- Copyright at bottom

### 4h. Success Page
- Centered card with checkmark icon (lucide `CheckCircle2`)
- Confetti or subtle celebration animation (optional)
- Clear next-steps: "View your reservation" / "Back to event"

---

## 5. Motion & Transitions

**Principles:** Subtle, fast, purposeful. No gratuitous animation.

- **Page transitions:** Not needed (Next.js handles this fine)
- **Card hovers:** `transition-all duration-200` — shadow + slight scale
- **Button hovers:** Slight brightness shift, not color change
- **Form sections:** Fade-in when they appear (tier selection → form reveal)
- **Gallery images:** Subtle zoom on hover (`hover:scale-105 transition-transform`)
- **Scroll reveals:** Optional — `animate-in` on first viewport entry for sections (use `intersection-observer` or CSS `@starting-style`)

---

## 6. Mobile-First Responsive Strategy

- All layouts start mobile, expand at `sm:` (640px) and `lg:` (1024px)
- Navbar collapses to hamburger at `< sm`
- Sport cards stack vertically on mobile
- Register form goes single-column on mobile, summary card moves above form
- Gallery goes 1-col on mobile, 2-col on sm, 3-col bento on lg
- Sponsor tier cards scroll horizontally on mobile (snap scroll)

---

## 7. Implementation Order

### Phase A: Foundation (globals.css, layout, font, navbar, footer)
1. Add Inter font to layout.tsx
2. Update globals.css with new variables and base styles
3. Rewrite Navbar with glass effect + mobile hamburger
4. Rewrite Footer with two-column layout
5. Update root layout structure

### Phase B: Homepage + Sport Landing
6. Redesign homepage hero + sport cards
7. Redesign sport landing page (hero, info sections, gallery, CTA)

### Phase C: Forms (Register + Sponsor)
8. Redesign register page (two-column layout, live summary)
9. Redesign sponsor page (tier card picker, form reveal)

### Phase D: Polish
10. Success page with icon + better layout
11. Admin dashboard — consistent styling pass
12. Add hover/transition polish across all pages

---

## 8. No New Dependencies Required

Everything can be done with:
- `tailwindcss` (already installed)
- `shadcn/ui` components (already installed — Sheet for mobile nav, Badge for tags)
- `lucide-react` (already installed — icons)
- `next/font` (built into Next.js)
- `next/image` (already used)

No animation libraries needed. CSS transitions + Tailwind `animate-` utilities are sufficient.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/globals.css` | New variables, base styles, utility classes |
| `src/app/layout.tsx` | Font setup, layout structure |
| `src/app/Navbar.tsx` | Full rewrite — glass header + mobile menu |
| `src/app/page.tsx` | Redesign homepage |
| `src/app/[sport]/page.tsx` | Redesign sport landing |
| `src/app/[sport]/register/page.tsx` | Two-column layout, summary card |
| `src/app/[sport]/sponsor/page.tsx` | Tier card picker, form polish |
| `src/app/[sport]/success/page.tsx` | Icon + card layout |
| `src/app/[sport]/admin/page.tsx` | Styling consistency pass |
