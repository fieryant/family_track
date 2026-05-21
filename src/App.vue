<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import VoiceAssistant from './components/VoiceAssistant.vue'
import { useAuthStore } from './stores/auth'
import { isSupabaseConfigured } from './lib/supabase'

const route = useRoute()
const authStore = useAuthStore()

const showChrome = computed(() =>
  !isSupabaseConfigured || (authStore.isAuthenticated && route.name !== 'login')
)
</script>

<template>
  <div class="relative min-h-dvh text-slate-100">
    <div class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"></div>

    <!-- Loading screen while auth initialises -->
    <div
      v-if="isSupabaseConfigured && authStore.loading"
      class="flex min-h-dvh items-center justify-center"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="text-4xl">🛒</div>
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"></div>
      </div>
    </div>

    <template v-else>
      <AppHeader v-if="showChrome" />
      <main
        :class="[
          'flex w-full max-w-screen-sm px-4 mx-auto justify-center',
          showChrome
            ? 'min-h-[calc(100dvh-4.5rem)] pb-28 pt-4'
            : 'min-h-dvh',
        ]"
      >
        <router-view v-slot="{ Component }">
          <transition
            mode="out-in"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="translate-y-3 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="-translate-y-2 opacity-0"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <VoiceAssistant v-if="showChrome && route.name !== 'assistant'" />

      <nav
        v-if="showChrome"
        id="bottom-nav"
        class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
      >
        <div class="mx-auto grid w-full max-w-2xl grid-cols-5 gap-2 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <router-link v-slot="{ href, navigate, isActive }" to="/" custom>
            <a
              id="nav-home"
              :href="href"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                isActive ? 'bg-cyan-400/10 text-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="navigate"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>List</span>
            </a>
          </router-link>

          <router-link v-slot="{ href, navigate, isActive }" to="/add" custom>
            <a
              id="nav-add"
              :href="href"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                isActive ? 'bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_0_1px_rgba(232,121,249,0.18)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="navigate"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>Add</span>
            </a>
          </router-link>

          <router-link v-slot="{ href, navigate, isActive }" to="/history" custom>
            <a
              id="nav-history"
              :href="href"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                isActive ? 'bg-emerald-400/10 text-emerald-300 shadow-[0_0_0_1px_rgba(52,211,153,0.18)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="navigate"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>History</span>
            </a>
          </router-link>

          <router-link v-slot="{ href, navigate, isActive }" to="/pantry" custom>
            <a
              id="nav-pantry"
              :href="href"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                isActive ? 'bg-indigo-400/10 text-indigo-300 shadow-[0_0_0_1px_rgba(129,140,248,0.18)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="navigate"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8"/><path d="M7 2v3a3 3 0 0 0 .8 2.05L9 8.5V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8.5l1.2-1.45A3 3 0 0 0 17 5V2"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
              <span>Pantry</span>
            </a>
          </router-link>

          <router-link v-slot="{ href, navigate, isActive }" to="/settings" custom>
            <a
              id="nav-settings"
              :href="href"
              :class="[
                'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition',
                isActive ? 'bg-amber-400/10 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ]"
              @click="navigate"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Settings</span>
            </a>
          </router-link>
        </div>
      </nav>
    </template>
  </div>
</template>
