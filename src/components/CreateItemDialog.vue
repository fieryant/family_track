<template>
  <Modal :show="show" @close="$emit('close')">
    <div class="mb-6 text-center">
      <h3 class="text-xl font-bold text-white">Create custom item</h3>
      <p class="mt-1 text-sm text-slate-400">Add something new to the catalog, then set the quantity.</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <FormInput
        v-model="name"
        label="Item name"
        placeholder="e.g. Avocados"
        type="text"
        maxlength="80"
        autofocus
      />

      <FormSelect v-model="categoryId" label="Category">
        <option :value="null">Uncategorized</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
      </FormSelect>

      <FormSelect v-model="unitType" label="Unit type">
        <option value="count">Count</option>
        <option value="weight">Weight</option>
        <option value="volume">Volume</option>
      </FormSelect>

      <p v-if="error" class="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{{ error }}</p>

      <div class="flex gap-3 pt-2">
        <button type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="$emit('close')">Cancel</button>
        <button type="submit" class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canSubmit || loading">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ loading ? 'Creating...' : 'Create item' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'
import FormInput from './FormInput.vue'
import FormSelect from './FormSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  prefillName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const name = ref('')
const categoryId = ref(null)
const unitType = ref('count')

const canSubmit = computed(() => name.value.trim().length > 0)

watch(() => props.show, (newVal) => {
  if (newVal && props.prefillName) {
    name.value = props.prefillName
  }
})

defineExpose({
  reset() {
    name.value = ''
    categoryId.value = null
    unitType.value = 'count'
  },
})

function handleSubmit() {
  if (!canSubmit.value || props.loading) return
  emit('submit', { 
    name: name.value.trim(), 
    categoryId: categoryId.value, 
    unitType: unitType.value 
  })
}
</script>
