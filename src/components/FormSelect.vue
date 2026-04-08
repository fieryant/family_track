<template>
  <label class="block space-y-2">
    <span class="text-sm font-medium text-slate-200">{{ label }}</span>
    <select
      :value="modelValue"
      class="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <slot />
    </select>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
})

defineEmits(['update:modelValue'])
</script>
