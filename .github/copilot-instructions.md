# family_track: Workspace Instructions for AI Agents

## 📋 Project Overview

**family_track** is a Vue 3 + Vite shopping list app for families. It has two modes:
- **Listing Mode**: Throughout the month, add items as they run low
- **Shopping Mode**: At market, check off items and log amounts purchased

**Key Tech Stack:**
- Vue 3 + `<script setup>` (no TypeScript)
- Vite for build & dev
- Supabase backend (PostgreSQL) with in-memory fallback
- Pinia for state management
- Tailwind CSS v4 (zero-config via `@tailwindcss/vite`)
- Vue Router 4 with lazy-loaded routes

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview built bundle
npm run preview
```

### Environment Setup
If connecting to Supabase, add to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** App gracefully falls back to seed data if env vars are missing. No broken UI when offline.

---

## 🏗️ Architecture

### State Management (Pinia Stores)
All stores in `src/stores/` use Composition API pattern with dual-mode support (Supabase + fallback):

| Store | Purpose | Key Computed | Key Methods |
|-------|---------|--------------|------------|
| `categories.js` | Master category list | `sorted`, `byId` | `fetchCategories()` |
| `items.js` | Master item catalog | `byCategory`, `byId` | `searchItems()`, `presetsForItem()` |
| `shopList.js` | Active session items | `groupedByCategory` | `addItem()`, `updateStatus()`, `removeItem()` |
| `session.js` | Active shopping session | `duration` | `createSession()`, `complete()` |

**Pattern:** Check `lib/supabase.js` → `isSupabaseConfigured` before making DB calls. If false, use store's in-memory seed data.

### API Layer (`lib/supabase.js`)
- Exports `supabase` client (may be null if not configured)
- Exports `isSupabaseConfigured` boolean flag
- Stores check this flag before calling Supabase methods

### Router (`router/index.js`)
- 4 lazy-loaded routes: **Home** → **AddItem** → **ItemDetail** (`:id` param) → **History**
- Route transitions handled at `App.vue` level (300ms smooth fade)
- Use dynamic imports: `() => import()`

---

## 🎨 Component Architecture

### Shared Utility Components (`src/components/`)
These are reusable across views. Follow this naming pattern:

| Component | Function | Usage |
|-----------|----------|-------|
| **Modal.vue** | Teleported backdrop + transitions | Wrap dialog content |
| **FormInput.vue** | Labeled text input with cyan focus ring | Form fields |
| **FormSelect.vue** | Labeled dropdown/select | Category/unit selection |
| **Toast.vue** | Dismissible notification | Success/error alerts |
| **EmptyState.vue** | Fallback UI for empty lists | No items display |

### Domain Components
- **CategoryFilter.vue** — Tab filter for categories
- **CategoryGroup.vue** — Collapsible category header (manages expanded state locally)
- **ItemCard.vue** — Individual item display in catalog
- **ShopListItem.vue** — Shopping session item row with status/quantity

### Dialog Components
Specialized modals for workflows:
- `CreateItemDialog.vue` — Add new item (uses Modal, FormInput, FormSelect)
- `PartialBuyDialog.vue` — Record partial purchase
- `SessionCompleteDialog.vue` — End shopping session

### Component Development Pattern
```vue
<script setup>
import { ref, computed } from 'vue'

// Props with validation
const props = defineProps({
  items: { type: Array, required: true },
  title: String,
})

// Local state
const isOpen = ref(false)

// Computed
const filtered = computed(() => props.items.filter(...))

// Methods
const handleClick = () => { /* ... */ }
</script>

<template>
  <!-- Always use Tailwind for styling -->
  <div class="flex gap-2 rounded-2xl bg-slate-900 p-4">
    <slot />
  </div>
</template>
```

---

## 🎨 Styling & Dark Theme

### Tailwind CSS v4
- **Config:** Zero-config via `@tailwindcss/vite` in `vite.config.js`
- **Entry:** `@import "tailwindcss"` in `src/assets/main.css`
- **No separate tailwind.config.js** needed

### Design System
- **Dark Theme**: `color-scheme: dark` at `:root`
- **Color Palette:**
  - Base: `slate-950` (darkest), `slate-900`, `slate-800`
  - Accents: `cyan-400` (primary), `fuchsia-400` (secondary)
  - Neutral text: `slate-300`, `slate-400`, `white/80`

- **Typography:** Inter font (Google Fonts preloaded in `index.html`)
- **Layout:** `max-w-screen-sm` constraint, `px-4` padding, `gap-2/3/4` spacing
- **Effects:** 
  - Glassmorphism: `backdrop-blur-xl border border-white/10`
  - Shadows: `shadow-2xl` with `black/40` opacity
  - Corners: `rounded-2xl` for modals/cards
- **Responsive:** `grid-cols-3` bottom nav, `safe-area-inset-bottom` for notches

### Tailwind Usage Examples
```vue
<!-- Conditional classes with computed -->
<div :class="[
  'p-4 rounded-2xl transition-colors',
  isActive ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300'
]" />

<!-- Common patterns -->
<div class="flex gap-2 items-center justify-between" />
<div class="grid gap-3 grid-cols-2 md:grid-cols-3" />
<div class="backdrop-blur-xl border border-white/10 rounded-2xl" />
```

---

## 💾 Database & Seed Data

### Database Schema
See [supabase/migration.sql](supabase/migration.sql) for full schema. Key tables:
- `categories` — Item categories with icons
- `items` — Master item list
- `unit_presets` — Measurement shortcuts per item (e.g., "1kg", "500ml")
- `shop_sessions` — One active session per month
- `shop_list_items` — Items in current session (with status: pending/bought/partial/removed)
- `purchase_history` — Immutable log for analytics

### Seed Data (`lib/seedData.js`)
Pre-populates 11 categories (fruits, vegetables, dairy, etc.) and 30+ items. Use when Supabase is unavailable.

**When adding new seed items:**
```js
{
  id: 'unique-uuid',
  category_id: 'existing-category-id',
  name: 'Item Name',
  default_unit_type: 'weight', // weight | volume | count | length
  is_active: true,
  sort_order: 10
}
```

---

## 🔧 Development Workflow

### No TypeScript or Linting Setup
- Pure `.js` and `.vue` files
- Prop validation via object notation (no TSC)
- No ESLint/Prettier configured (but can be added)

### Dual-Mode Runtime
App detects Supabase configuration at startup:
```js
// In any store
if (isSupabaseConfigured) {
  // Call Supabase
  await supabase.from('items').select()
} else {
  // Use seed data fallback
  return seedData.items
}
```

### Debugging Tips
1. **Supabase Connection Issues?**
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
   - App will silently fall back to seed data if missing
   - Check browser console for Supabase client errors

2. **Component Not Rendering?**
   - Verify `<script setup>` usage (no `export default`)
   - Check prop names match parent usage (case-sensitive)
   - Tailwind classes require full class names (no dynamic concatenation without safelist)

3. **State Not Updating?**
   - Pinia stores use `ref()` → reactivity guaranteed
   - Confirm store actions are awaited if async

### Build & Performance
- **Vite dev server:** ~100ms rebuilds
- **Lazy routes:** Smaller initial bundle, faster first load
- **Tailwind purging:** Only used classes included in production bundle
- **Font optimization:** Google Fonts preconnected for fast load

---

## 📂 File Organization

```
src/
├── App.vue              # Root with route transitions
├── main.js              # Entry point
├── router/index.js      # Route definitions (lazy-loaded)
├── stores/              # Pinia stores (categories, items, shopList, session)
├── components/          # Vue components (modals, forms, cards, filters)
├── views/               # Page components (Home, AddItem, ItemDetail, History)
├── assets/main.css      # Global styles + Tailwind import
└── lib/
    ├── supabase.js      # Supabase client (conditional)
    └── seedData.js      # Fallback data
```

---

## ⚠️ Common Pitfalls

1. **Forgetting to import stores** — Always use `useStore()` composable pattern
2. **Breaking seed data format** — Maintain UUID and `sort_order` fields
3. **Typos in Tailwind classes** — Won't apply if misspelled; use exact class names
4. **Not checking `isSupabaseConfigured`** — Will crash if env vars missing and Supabase is called
5. **Mixed composition patterns** — Use `<script setup>` everywhere; avoid Options API

---

## 🎯 Quick Commands for Common Tasks

```bash
# Add a new component
# Create in src/components/, export from setup
# Use in parent with: import YourComponent from '@/components/YourComponent.vue'

# Add a new view/route
# 1. Create in src/views/
# 2. Add to router/index.js with lazy import: () => import('@/views/NewView.vue')
# 3. Link in navigation

# Add new Pinia store
# 1. Create in src/stores/newStore.js
# 2. Use in component: const store = useNewStore()

# Update seed data
# Edit src/lib/seedData.js, restart dev server

# Deploy to production
npm run build        # Creates dist/
# Deploy dist/ to hosting (Vercel, Netlify, etc.)
```

---

## 📚 References
- [Vue 3 Docs](https://vuejs.org)
- [Vite Docs](https://vitejs.dev)
- [Pinia Docs](https://pinia.vuejs.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- Local schema: [supabase/migration.sql](supabase/migration.sql)
- Seed data: [src/lib/seedData.js](../src/lib/seedData.js)
