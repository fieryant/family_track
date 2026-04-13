<template>
  <label class="block">
    <div class="text-sm font-medium text-slate-200 mb-2">{{ label }}</div>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :autofocus="autofocus"
      class="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  maxlength: { type: Number, default: undefined },
  autofocus: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>
