<template>
  <teleport to="body">
    <transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="show" id="session-complete-modal" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-4 backdrop-blur-sm sm:items-center" @click.self="$emit('close')">
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-8 scale-95 opacity-0" enter-to-class="translate-y-0 scale-100 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 scale-100 opacity-100" leave-to-class="translate-y-8 scale-95 opacity-0">
          <div class="w-full max-w-lg max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-3xl">
            <div class="mb-4 text-5xl">✅</div>
            <h3 class="mb-2 text-xl font-bold text-white">Complete Shopping?</h3>
            <p class="mb-6 text-sm text-slate-400">This will end the current session and save all bought items to your purchase history.</p>

            <div class="mb-4 rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-left">
              <div class="flex items-center justify-between py-1 text-sm">
                <span class="text-slate-300">Bought</span>
                <span class="font-bold text-emerald-300">{{ summary.bought }}</span>
              </div>
              <div class="flex items-center justify-between py-1 text-sm">
                <span class="text-slate-300">Partial</span>
                <span class="font-bold text-sky-300">{{ summary.partial }}</span>
              </div>
              <div class="flex items-center justify-between py-1 text-sm">
                <span class="text-slate-300">Still pending</span>
                <span class="font-bold text-amber-300">{{ summary.pending }}</span>
              </div>
            </div>

            <p v-if="summary.pending > 0" class="mb-4 text-sm text-amber-300">⚠️ {{ summary.pending }} pending item(s) will not be saved to history.</p>

            <div class="flex gap-3">
              <button type="button" class="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="$emit('close')">Cancel</button>
              <button id="confirm-complete-btn" type="button" class="flex-1 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300" @click="$emit('confirm')">Complete Session</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
  summary: { type: Object, default: () => ({ bought: 0, partial: 0, pending: 0 }) },
})

defineEmits(['close', 'confirm'])
</script>
