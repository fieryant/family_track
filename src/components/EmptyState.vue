<template>
  <div class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-16 text-center">
    <h3 class="text-lg font-semibold text-slate-200">{{ title }}</h3>
    <p v-if="message" class="mt-2 text-sm text-slate-400">{{ message }}</p>
    <slot name="actions" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
})
</script>
