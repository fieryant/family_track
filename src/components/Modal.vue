<template>
  <teleport to="body">
    <transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="show" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-4 backdrop-blur-sm sm:items-center" @click.self="$emit('close')">
        <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-8 scale-95 opacity-0" enter-to-class="translate-y-0 scale-100 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 scale-100 opacity-100" leave-to-class="translate-y-8 scale-95 opacity-0">
          <div class="w-full max-w-lg max-h-[80dvh] overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 sm:rounded-3xl">
            <slot />
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>
