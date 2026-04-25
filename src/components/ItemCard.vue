<template>
  <button
    type="button"
    :class="cardClasses"
    @click="$emit('click')"
  >
    <span class="flex items-center gap-2">
      <span class="text-sm font-semibold text-white">{{ item.name }}</span>
      <span
        v-if="due && !inList"
        class="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200"
      >Due</span>
    </span>
    <span class="text-xs capitalize text-slate-400">{{ getDefaultUnitLabel(item) }}</span>
    <span v-if="inList" class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-slate-950">✓</span>
    <span
      v-if="inList && inListAmount"
      class="absolute right-3 top-9 text-[11px] font-semibold text-emerald-200"
    >
      {{ inListAmount }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Item } from '../types';
import { useUnitTypesStore } from '../stores/unitTypes';

const props = defineProps<{
  item: Item
  inList: boolean
  inListAmount: string
  due?: boolean
}>()

const unitTypeStore = useUnitTypesStore()

function getDefaultUnitLabel(item: Item) {
  if (!item.unit_type_id) return '';
  console.log(item.unit_type_id, unitTypeStore.byId);
  
  return unitTypeStore.byId[item.unit_type_id]?.label ?? ''
}

defineEmits(['click'])

const cardClasses = computed(() => [
  'relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 pr-16 text-left transition-all duration-200 active:scale-[0.98]',
  props.inList
    ? 'border-emerald-400/20 bg-emerald-400/10 hover:border-emerald-400/40 hover:bg-emerald-400/15'
    : 'border-white/10 bg-slate-900/80 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-800/80',
])
</script>
