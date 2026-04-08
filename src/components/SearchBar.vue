<template>
  <div id="search-bar" class="relative mb-4">
    <svg class="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      ref="searchInput"
      class="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-11 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onInput"
      id="search-input"
    />
    <button
      v-if="modelValue"
      type="button"
      class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
      @click="$emit('update:modelValue', '')"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search items...' },
})

const emit = defineEmits(['update:modelValue'])
const searchInput = ref(null)

let debounceTimer = null
function onInput(e) {
  const val = e.target.value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', val)
  }, 200)
}

function focus() {
  searchInput.value?.focus()
}

defineExpose({ focus })
</script>
