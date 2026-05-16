<script setup lang="ts">
import { useLocaleStore } from '../../stores/locale'
import type { Locale } from '../../types'

const localeStore = useLocaleStore()

const locales: { value: Locale; label: string; sublabel: string }[] = [
  { value: 'en', label: 'English', sublabel: 'Default language' },
  { value: 'bn', label: 'বাংলা', sublabel: 'Bengali' },
]
</script>

<template>
  <div class="w-full space-y-4">
    <div class="flex items-center gap-3">
      <router-link to="/settings" class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-800/60 text-slate-400 transition hover:text-slate-100">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </router-link>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-slate-100">Language</h1>
        <p class="text-xs text-slate-400">Item names display language</p>
      </div>
    </div>

    <div class="space-y-2">
      <button
        v-for="locale in locales"
        :key="locale.value"
        type="button"
        class="flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition active:scale-[0.98]"
        :class="localeStore.currentLocale === locale.value
          ? 'border-cyan-400/30 bg-cyan-400/10'
          : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/70'"
        @click="localeStore.setLocale(locale.value)"
      >
        <div class="flex-1">
          <p class="font-semibold" :class="localeStore.currentLocale === locale.value ? 'text-cyan-200' : 'text-slate-100'">
            {{ locale.label }}
          </p>
          <p class="text-xs text-slate-400">{{ locale.sublabel }}</p>
        </div>
        <svg
          v-if="localeStore.currentLocale === locale.value"
          class="h-5 w-5 shrink-0 text-cyan-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>
