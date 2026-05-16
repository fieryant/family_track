<template>
  <div
    :id="'sli-' + item.id"
    :class="[
      'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
      shoppingMode ? 'cursor-pointer active:scale-[0.99]' : '',
      item.status === 'bought'
        ? 'border-emerald-400/20 bg-emerald-400/10'
        : item.status === 'partial'
          ? 'border-sky-400/20 bg-sky-400/10'
          : item.status === 'removed'
            ? 'border-white/5 bg-white/3 opacity-50'
            : 'border-white/10 bg-slate-900/80 hover:border-white/15 hover:bg-slate-800/80',
    ]"
    @click="handleClick"
  >
    <div class="shrink-0">
      <div
        v-if="shoppingMode"
        :class="[
          'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
          item.status === 'bought' ? 'border-emerald-400 bg-emerald-400 text-white' : 'border-white/15 bg-transparent',
        ]"
      >
        <svg v-if="item.status === 'bought'" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span v-else :class="statusDotClasses(item.status)"></span>
    </div>

    <div class="min-w-0 flex-1">
      <span :class="['block text-sm font-semibold', item.status === 'bought' || item.status === 'removed' ? 'text-slate-400 line-through' : 'text-slate-100']">
        {{ displayName }}
      </span>
      <span class="text-xs text-slate-400">
        {{ item.requested_amount }} {{ item._requestedUnitLabel }}
        <template v-if="item.status === 'partial' && item.bought_amount">
          → {{ item.bought_amount }} {{ item._boughtUnitLabel }}
        </template>
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <span :class="statusBadgeClasses(item.status)">{{ item.status }}</span>
      <div class="flex items-center gap-1">
        <button
          v-if="shoppingMode && item.status === 'pending'"
          type="button"
          class="inline-flex h-7 items-center justify-center rounded-full border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-slate-200 transition hover:border-sky-400/30 hover:bg-sky-400/10 hover:text-sky-200"
          title="Partial buy"
          @click.stop="$emit('partial', item)"
        >
          ½
        </button>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300"
          title="Remove"
          @click.stop="$emit('remove', item.id)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ShopListItem, ShopListStatus } from '../types'
import { useItemsStore } from '../stores/items'
import { useLocaleStore } from '../stores/locale'
import { localizedName } from '../lib/i18nName'

const props = defineProps<{
  item: ShopListItem
  shoppingMode: boolean
}>()

const emit = defineEmits(['toggle', 'partial', 'remove'])

const itemsStore = useItemsStore()
const localeStore = useLocaleStore()

const displayName = computed(() => {
  const fullItem = itemsStore.byId[props.item.item_id]
  return fullItem ? localizedName(fullItem, localeStore.currentLocale) : props.item._name
})

function statusDotClasses(status: ShopListStatus) {
  const base = 'mt-1 block h-2 w-2 rounded-full'
  if (status === 'bought') return `${base} bg-emerald-400`
  if (status === 'partial') return `${base} bg-sky-400`
  if (status === 'removed') return `${base} bg-slate-500`
  return `${base} bg-amber-400`
}

function statusBadgeClasses(status: ShopListStatus) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide'
  if (status === 'bought') return `${base} bg-emerald-400/10 text-emerald-300`
  if (status === 'partial') return `${base} bg-sky-400/10 text-sky-300`
  if (status === 'removed') return `${base} bg-white/5 text-slate-500`
  return `${base} bg-amber-400/10 text-amber-300`
}

function handleClick() {
  if (props.shoppingMode) {
    emit('toggle', props.item.id)
  }
}
</script>
