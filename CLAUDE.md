# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**family_track** is a Vue 3 + Vite shopping list SPA for families. Two modes:
- **Listing Mode**: Add items throughout the month as they run low
- **Shopping Mode**: Check off items at the market and log amounts purchased

## Commands

```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Type-check + production build → dist/
npm run type-check # TypeScript check only (vue-tsc --noEmit)
npm run preview    # Preview production build
```

## Environment

Copy to `.env.local` for Supabase backend:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

Without these, the app silently falls back to `src/lib/seedData.ts` — no broken UI.

## Architecture

### Dual-Mode Runtime

Every store checks `isSupabaseConfigured` (from `src/lib/supabase.ts`) before calling Supabase. Missing env vars → automatic fallback to in-memory seed data. This pattern must be preserved in all store actions:

```ts
if (isSupabaseConfigured) {
  const { data, error } = await supabase!.from('items').select()
  if (error) throw error
  items.value = data
} else {
  items.value = seedData.items
}
```

Write operations generate client-side IDs (prefixed strings like `cat-timestamp`) in offline mode vs. server UUIDs in Supabase mode.

### Pinia Stores (`src/stores/`)

| Store | Purpose | Key Computed | Key Methods |
|-------|---------|--------------|-------------|
| `auth.ts` | User auth session | `isAuthenticated` | `initialize()`, `signIn()`, `signUp()`, `signOut()` |
| `categories.ts` | Master category list | `sorted`, `byId` | `fetch()`, `create()`, `update()`, `remove()` |
| `items.ts` | Master item catalog | `byCategory`, `byId` | `search()`, `presetsForItem()`, `saveCustomPreset()` |
| `units.ts` | Unit definitions | `sorted`, `byId` | `fetch()`, `forType(unitTypeId)` |
| `unitTypes.ts` | Unit type groups (weight/volume/count/length) | `sorted`, `byId` | `fetch()` |
| `shopList.ts` | Active session items | `groupedByCategory`, `summary` | `addItem()`, `updateStatus()`, `carryPendingToSession()` |
| `session.ts` | Shopping session lifecycle | `hasActiveSession` | `fetchActive()`, `createSession()`, `completeSession()` |
| `lists.ts` | Shared family lists | `currentList` | `createList()`, `joinList()`, `addMemberByEmail()` |

### Router (`src/router/index.ts`)

Routes with auth guards:
- `/login` — LoginView (public)
- `/` — HomeView (main shopping list)
- `/add` — AddItemView
- `/item/:id` — ItemDetailView
- `/history` — HistoryView (past sessions with purchase log)
- `/lists` — ListsView (create/join shared lists)
- `/settings` — SettingsView hub
- `/settings/categories`, `/settings/units`, `/settings/unit-types`, `/settings/items` — admin views

**Guard logic**: unauthenticated → `/login`; authenticated on `/login` → `/`; no active list selected → `/lists`. All guards are skipped when Supabase is not configured.

### Component Conventions

All components use `<script setup>` (Composition API). No Options API anywhere. The `<script setup>` block must always be at the top.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
const props = defineProps<{ items: Item[] }>()
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

Multiple migration files under `supabase/`:
- `migration.sql` — core tables: `categories`, `unit_types`, `units`, `items`, `unit_presets`, `shop_sessions`, `shop_list_items`, `purchase_history`
- `lists_migration.sql` — `shopping_lists` + `list_members` tables; adds `list_id` FK to `shop_sessions`
- `rls.sql` / `lists_rls.sql` — Row Level Security policies (list membership gates all session/item access)
- `lists_functions.sql` — `add_list_member_by_email()` RPC (security definer, owner-only)

Key status values for `shop_list_items.status`: `pending` / `bought` / `partial` / `removed`

`purchase_history` is an immutable log — never update rows, only insert on session completion.

When adding seed items to `src/lib/seedData.ts`, maintain the UUID-style `id` and `sort_order` fields.