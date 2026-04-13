# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**family_track** is a Vue 3 + Vite shopping list SPA for families. Two modes:
- **Listing Mode**: Add items throughout the month as they run low
- **Shopping Mode**: Check off items at the market and log amounts purchased

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No linting, testing, or TypeScript configured.

## Environment

Copy to `.env.local` for Supabase backend:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without these, the app silently falls back to `src/lib/seedData.js` — no broken UI.

## Architecture

### Dual-Mode Runtime

Every store checks `isSupabaseConfigured` (from `src/lib/supabase.js`) before calling Supabase. Missing env vars → automatic fallback to in-memory seed data. This pattern must be preserved in all store actions:

```js
if (isSupabaseConfigured) {
  await supabase.from('items').select()
} else {
  return seedData.items
}
```

### Pinia Stores (`src/stores/`)

| Store | Purpose | Key Computed | Key Methods |
|-------|---------|--------------|-------------|
| `categories.js` | Master category list | `sorted`, `byId` | `fetchCategories()` |
| `items.js` | Master item catalog | `byCategory`, `byId` | `searchItems()`, `presetsForItem()` |
| `shopList.js` | Active session items | `groupedByCategory` | `addItem()`, `updateStatus()`, `removeItem()` |
| `session.js` | Active shopping session | `duration` | `createSession()`, `complete()` |

### Router (`src/router/index.js`)

Four lazy-loaded routes: `/` (Home), `/add` (AddItem), `/item/:id` (ItemDetail), `/history`. Route transitions handled in `App.vue`.

### Component Conventions

All components use `<script setup>` (Composition API). No Options API anywhere.

```vue
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ items: { type: Array, required: true } })
</script>
<template>
  <!-- Tailwind only, no scoped styles -->
</template>
```

**Shared utility components** (Modal, FormInput, FormSelect, Toast, EmptyState) live in `src/components/` and are the building blocks for dialog components.

### Styling

- Dark theme throughout. Base: `slate-950`/`slate-900`/`slate-800`. Accents: `cyan-400` (primary), `fuchsia-400` (secondary).
- Glassmorphism pattern: `backdrop-blur-xl border border-white/10 rounded-2xl`
- Tailwind v4 zero-config — no `tailwind.config.js`. Entry: `@import "tailwindcss"` in `src/assets/main.css`.
- Never use dynamic class name concatenation (e.g., `` `text-${color}-400` ``) — Tailwind purges unseen class names at build time.

### Database Schema

See `supabase/migration.sql` for full schema. Key tables:
- `categories`, `items`, `unit_presets` — master data
- `shop_sessions` — one active session per month
- `shop_list_items` — items in the current session (`status`: `pending`/`bought`/`partial`/`removed`)
- `purchase_history` — immutable purchase log for analytics

When adding seed items to `src/lib/seedData.js`, maintain the UUID and `sort_order` fields.
