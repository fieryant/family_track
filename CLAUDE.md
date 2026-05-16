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
| `pantry.ts` | Home inventory tracking | `byItemId` | `fetch()`, `setAmount()`, `applyPurchases()` |
| `translations.ts` | Generic entity translations | `byEntity` | `fetchFor(entityType)`, `upsert()`, `removeFor()`, `get()` |
| `locale.ts` | UI display language preference | `currentLocale` | `setLocale(locale)` |

### Router (`src/router/index.ts`)

Routes with auth guards:
- `/login` — LoginView (public)
- `/` — HomeView (main shopping list)
- `/add` — AddItemView
- `/item/:id` — ItemDetailView
- `/history` — HistoryView (past sessions with purchase log)
- `/lists` — ListsView (create/join shared lists)
- `/pantry` — PantryView (home inventory)
- `/settings` — SettingsView hub
- `/settings/categories`, `/settings/units`, `/settings/unit-types`, `/settings/items` — admin views
- `/settings/language` — locale picker (English / বাংলা)

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

Timestamped migrations under `supabase/migrations/`:
- `20260408053702_initial_family_market_schema.sql` — core tables: `categories`, `unit_types`, `units`, `items`, `unit_presets`, `shop_sessions`, `shop_list_items`, `purchase_history`
- `20260408053943_public_app_rls_policies.sql` — Row Level Security policies
- `20260415070705_add_shopping_lists.sql` — `shopping_lists` + `list_members` tables; adds `list_id` FK to `shop_sessions`
- `20260415070743_lists_rls_policies.sql` — list-scoped RLS (list membership gates all session/item access)
- `20260415070932_fix_list_members_rls_recursion.sql` / `20260415071314_fix_shopping_lists_select_policy.sql` — RLS corrections
- `20260415071734_add_list_member_by_email_fn.sql` — `add_list_member_by_email()` RPC (security definer, owner-only)
- `20260425192315_pantry_migration.sql` — `pantry_items` table for home inventory tracking
- `20260516000001_translations.sql` — generic `translations` table; backfills existing item names as English
- `20260516000002_translations_rls.sql` — RLS policies for translations (authenticated read/write)

Key status values for `shop_list_items.status`: `pending` / `bought` / `partial` / `removed`

`purchase_history` is an immutable log — never update rows, only insert on session completion.

Domain types are in `src/types/index.ts`: `Category`, `UnitType`, `Unit`, `Item`, `UnitPreset`, `ShopSession`, `ShopListItem`, `ShoppingList`, `ListMember`, `PantryItem`, `Translation`, `Locale`, `TranslatableEntity`.

`ShopListItem` and `PurchaseHistory` both carry an optional `price?: number | null` (per-unit price at time of purchase). Include it when inserting purchase history rows.

`src/lib/supabase.ts` exports `supabase` (nullable — `SupabaseClient | null`) and `isSupabaseConfigured` (boolean). Always gate on `isSupabaseConfigured` before using the client; never assume `supabase` is non-null.

When adding seed items to `src/lib/seedData.ts`, maintain the UUID-style `id` and `sort_order` fields. Also add corresponding entries to `seedTranslations` for both `en` and `bn` locales.

### Multi-language (i18n)

Item names support English (`en`) and Bengali (`bn`). The pattern is extensible to categories, units, etc. via the same `translations` table.

- **Table**: `translations(entity_type, entity_id, locale, field, value)` — generic, no per-table FK. `entity_type` is `'item' | 'category' | 'unit' | 'unit_type'`.
- **Locale preference**: stored in `localStorage` under `family_track.locale`, managed by `src/stores/locale.ts`.
- **Rendering**: always use `localizedName(entity, locale)` from `src/lib/i18nName.ts` — never render `item.name` directly in templates.
- **Search**: `items.ts:search()` matches across **all** locales regardless of UI locale — typing in either language finds the item.
- **Cascade on delete**: no DB FK, so each store's `remove()` must call `translationsStore.removeFor(entityType, id)` after deleting the parent row.
- **Seeding**: `seedTranslations` in `src/lib/seedData.ts` provides both `en` and `bn` entries for all 36 seed items; the translations store filters by `entity_type` on load.

## Testing

No test framework is configured. There are no test scripts in `package.json`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
