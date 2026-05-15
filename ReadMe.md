# Family Track

A Vue 3 shopping list app built for families. Track what you need to buy throughout the month, then work through the list at the market — all synced across the family in real time via Supabase.

---

## Features

### Shopping List (Home)
- Add items to a shared list as they run low throughout the month
- Items are grouped by category for easy scanning
- Each item shows the requested amount and unit (e.g. 2 kg, 500 ml, 3 count)
- Quick-pick unit presets per item (e.g. 100g / 500g / 1kg / 2kg for rice)

### Shopping Mode
- Mark items as **bought**, **partial** (got less than needed), or **removed**
- Partial purchases record the actual amount bought alongside the requested amount
- Pending items from a previous session carry forward automatically when a new session starts
- Complete a session to clear the list and log everything to purchase history

### Pantry
- Tracks home inventory levels for each item
- Updated automatically when a session is completed based on what was purchased
- Manually adjust stock levels at any time

### History
- Full log of past shopping sessions
- Shows what was bought, how much, and the price paid per item

### Shared Family Lists
- Create a list and invite family members by email
- All members see the same live shopping list and session state
- Join an existing list with a list code

### Item & Category Management (Settings)
- Manage the master item catalog — add, edit, or deactivate items
- Organise items into categories with icons and custom sort order
- Define unit types (weight, volume, count, length) and units
- Set per-item unit presets for fast amount entry

### Offline / Demo Mode
- Works fully without a Supabase backend — falls back to built-in seed data
- No broken UI, no error screens — useful for local development and demos

---

## Tech Stack

- **Vue 3** — Composition API, `<script setup>` throughout
- **Pinia** — state management
- **Vue Router** — client-side routing with auth guards
- **Supabase** — auth, Postgres database, Row Level Security
- **Tailwind CSS v4** — dark glassmorphism UI, zero config
- **TypeScript** — end-to-end types via `vue-tsc`

---

## Getting Started

```bash
npm install
npm run dev       # http://localhost:5173
```

To connect a Supabase backend, create `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

Run migrations in order from `supabase/migrations/` to set up the database schema.

Without `.env.local`, the app runs in demo mode with seed data — no setup required.

---

## Scripts

```bash
npm run dev         # Dev server
npm run build       # Type-check + production build → dist/
npm run type-check  # TypeScript check only
npm run preview     # Preview production build
```
5zwi9QsvZAwWvDOD