<template>
  <button
    type="button"
    :class="cardClasses"
    @click="$emit('click')"
  >
    <span class="text-sm font-semibold text-white">{{ item.name }}</span>
    <span class="text-xs capitalize text-slate-400">{{ item.default_unit_type }}</span>
    <span v-if="inList" class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-slate-950">✓</span>
    <span
      v-if="inList && inListAmount"
      class="absolute right-3 top-9 text-[11px] font-semibold text-emerald-200"
    >
      {{ inListAmount }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  inList: { type: Boolean, default: false },
  inListAmount: { type: String, default: '' },
})

defineEmits(['click'])

const cardClasses = computed(() => [
  'relative flex flex-col items-start gap-1.5 rounded-2xl border p-4 pr-16 text-left transition-all duration-200 active:scale-[0.98]',
  props.inList
    ? 'pointer-events-none border-emerald-400/20 bg-emerald-400/10'
    : 'border-white/10 bg-slate-900/80 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-800/80',
])
</script>
