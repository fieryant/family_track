<template>
  <div class="relative min-h-dvh text-slate-100">
    <div class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]"></div>
    <AppHeader />
    <main class="flex min-h-[calc(100dvh-4.5rem)] w-full max-w-screen-sm px-4 mx-auto pb-28 pt-4 justify-center">
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
    <nav
      id="bottom-nav"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
    >
      <div class="mx-auto grid w-full max-w-2xl grid-cols-3 gap-4 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
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
      </div>
    </nav>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
</script>
