<template>
  <div :id="'cat-group-' + category.id" class="mb-3">
    <button
      type="button"
      class="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left text-slate-100 transition hover:border-white/15 hover:bg-slate-800/80"
      @click="expanded = !expanded"
    >
      <div class="flex items-center gap-3">
        <span class="text-lg">{{ category.icon }}</span>
        <span class="text-sm font-semibold">{{ category.name }}</span>
        <span class="rounded-full bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-400">{{ items.length }}</span>
      </div>
      <svg class="h-4.5 w-4.5 text-slate-400 transition-transform duration-200" :class="expanded ? 'rotate-180' : 'rotate-0'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    <transition
      enter-active-class="overflow-hidden transition-all duration-300 ease-out"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[2000px] opacity-100"
      leave-active-class="overflow-hidden transition-all duration-200 ease-in"
      leave-from-class="max-h-[2000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="expanded" class="flex flex-col gap-2 px-0 py-2">
        <slot />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps({
  category: { type: Object, required: true },
  items: { type: Array, required: true },
})

const expanded = ref(true)
</script>
