<template>
  <teleport to="body">
    <transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="show" id="unit-preset-modal" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-4 backdrop-blur-sm sm:items-center" @click.self="$emit('close')">
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-8 scale-95 opacity-0" enter-to-class="translate-y-0 scale-100 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 scale-100 opacity-100" leave-to-class="translate-y-8 scale-95 opacity-0">
          <div class="w-full max-w-lg max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-3xl">
            <div class="mb-6 text-center">
              <h3 class="text-xl font-bold text-white">{{ item?.name }}</h3>
              <p class="mt-1 text-sm text-slate-400">Choose quantity</p>
            </div>

            <div class="mb-6 grid grid-cols-3 gap-3">
              <template v-if="presets.length > 0">
                <button
                  v-for="preset in presets"
                  :key="preset.id"
                  type="button"
                  class="rounded-2xl border px-3 py-4 text-sm font-semibold transition active:scale-[0.99]"
                  :class="selectedPreset?.id === preset.id ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]' : 'border-white/10 bg-slate-800/80 text-slate-100 hover:border-white/20 hover:bg-slate-800'"
                  @click="selectPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </template>
              <div v-else class="col-span-3 rounded-2xl border border-dashed border-white/10 bg-slate-800/40 px-4 py-5 text-center text-sm text-slate-400">
                No quick presets yet. Use a custom amount below.
              </div>
            </div>

            <div class="mb-6">
              <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Or enter custom amount</p>
              <div class="flex items-end gap-3">
                <input
                  id="custom-amount-input"
                  v-model.number="customAmount"
                  class="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount"
                  @focus="selectedPreset = null"
                />
                <div class="w-28">
                  <FormSelect
                    id="custom-unit-select"
                    v-model="customUnit"
                    label=""
                    :options="unitOptionsMapped"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-3">
              <button type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="$emit('close')">Cancel</button>
              <button id="confirm-add-btn" type="button" class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!canConfirm" @click="confirm">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to List
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useItemsStore } from '../stores/items'
import { useUnitsStore } from '../stores/units'
import { useUnitTypesStore } from '../stores/unitTypes'
import FormSelect from './FormSelect.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

import type { Item, UnitPreset } from '../types'

const emit = defineEmits<{
  close: []
  confirm: [payload: { amount: number; unit: string }]
}>()
const itemsStore = useItemsStore()
const unitsStore = useUnitsStore()
const unitTypesStore = useUnitTypesStore()

onMounted(() => {
  if (!unitsStore.units.length) unitsStore.fetch()
  if (!unitTypesStore.unitTypes.length) unitTypesStore.fetch()
})

const selectedPreset = ref<UnitPreset | null>(null)
const customAmount = ref<number | null>(null)
const customUnit = ref('')

const presets = computed((): UnitPreset[] => {
  if (!props.item) return []
  return itemsStore.presetsForItem((props.item as Item).id)
})

const unitOptionsMapped = computed(() => {
  if (!props.item) return []
  const item = props.item as Item
  const unitType = item.unit_type_id
    ? unitTypesStore.byId[item.unit_type_id]
    : unitTypesStore.unitTypes.find(t => t.name === item.default_unit_type)
  if (!unitType) return []
  return unitsStore.forType(unitType.id).map(u => ({ value: u.symbol, label: u.symbol }))
})

const canConfirm = computed(() =>
  selectedPreset.value !== null || (customAmount.value !== null && customAmount.value > 0 && customUnit.value)
)

watch(() => props.item, () => {
  selectedPreset.value = null
  customAmount.value = null
  customUnit.value = unitOptionsMapped.value[0]?.value as string || ''
})

function selectPreset(preset: UnitPreset) {
  selectedPreset.value = preset
  customAmount.value = null
}

function confirm() {
  if (selectedPreset.value) {
    emit('confirm', { amount: selectedPreset.value.amount, unit: selectedPreset.value.unit })
  } else if (customAmount.value !== null && customAmount.value > 0 && customUnit.value) {
    emit('confirm', { amount: customAmount.value, unit: customUnit.value })
  }
}
</script>
