<template>
  <teleport to="body">
    <transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="show" id="partial-buy-modal" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-4 backdrop-blur-sm sm:items-center" @click.self="$emit('close')">
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-8 scale-95 opacity-0" enter-to-class="translate-y-0 scale-100 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 scale-100 opacity-100" leave-to-class="translate-y-8 scale-95 opacity-0">
          <div class="w-full max-w-lg max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-3xl">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-white">Partial Buy</h3>
              <p class="mt-1 text-sm text-slate-400">{{ item?._name }} — requested {{ item?.requested_amount }} {{ item?.requested_unit }}</p>
            </div>

            <div class="mb-6">
              <label class="mb-3 block text-sm font-medium text-slate-300">How much did you buy?</label>
              <div class="flex gap-3">
                <input
                  id="partial-amount-input"
                  v-model.number="amount"
                  class="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Amount bought"
                />
                <input
                  id="partial-unit-input"
                  v-model="unit"
                  class="w-28 rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                  type="text"
                  :placeholder="item?.requested_unit || 'unit'"
                />
              </div>
            </div>

            <div class="flex gap-3">
              <button type="button" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="$emit('close')">Cancel</button>
              <button id="confirm-partial-btn" type="button" class="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40" :disabled="!amount" @click="confirm">Confirm</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirm'])

const amount = ref(null)
const unit = ref('')

watch(() => props.item, (item) => {
  amount.value = null
  unit.value = item?.requested_unit || ''
})

function confirm() {
  if (amount.value > 0) {
    emit('confirm', {
      amount: amount.value,
      unit: unit.value || props.item?.requested_unit || 'pc',
    })
  }
}
</script>
