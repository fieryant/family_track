<template>
  <div class="flex gap-2 overflow-x-auto pb-1">
    <span
      class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer"
      :class="modelValue === null ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'"
      @click="$emit('update:modelValue', null)"
    >All</span>
    <span
      v-for="cat in categories"
      :key="cat.id"
      class="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition cursor-pointer"
      :class="modelValue === cat.id ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'"
      @click="$emit('update:modelValue', cat.id)"
    >{{ cat.icon }} {{ cat.name }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '../types'

defineProps<{
  modelValue: string | null
  categories: Category[]
}>()

defineEmits<{ 'update:modelValue': [value: string | null] }>()
</script>
