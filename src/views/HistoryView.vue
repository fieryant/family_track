<template>
  <div id="history-view" class="space-y-4 w-full">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-white">Shopping History</h2>
      <p class="mt-1 text-sm text-slate-400">Review past sessions and check how each trip ended.</p>
    </div>

    <div v-if="sessionStore.pastSessions.length > 0" class="space-y-3">
      <div
        v-for="session in sessionStore.pastSessions"
        :key="session.id"
        :id="'session-' + session.id"
        class="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-sm shadow-black/10 transition hover:border-white/15 hover:bg-slate-800/80"
        @click="toggleSession(session.id)"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <span class="block text-sm font-semibold text-white">{{ formatDate(session.completed_at || session.started_at) }}</span>
            <span class="text-xs text-slate-400">
              {{ session._itemCount || '—' }} items
            </span>
          </div>
          <svg class="h-4.5 w-4.5 shrink-0 text-slate-400 transition-transform duration-200" :class="expandedSession === session.id ? 'rotate-180' : 'rotate-0'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <transition enter-active-class="overflow-hidden transition-all duration-300 ease-out" enter-from-class="max-h-0 opacity-0" enter-to-class="max-h-[200px] opacity-100" leave-active-class="overflow-hidden transition-all duration-200 ease-in" leave-from-class="max-h-[200px] opacity-100" leave-to-class="max-h-0 opacity-0">
          <div v-if="expandedSession === session.id" class="mt-4 border-t border-white/10 pt-4">
            <p class="text-sm leading-6 text-slate-300">
              Started: {{ formatDate(session.started_at) }}<br>
              Completed: {{ formatDate(session.completed_at) }}
            </p>

            <div class="mt-3 space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Items bought</p>

              <p v-if="sessionStore.loadingSessionItems[session.id]" class="text-sm text-slate-400">
                Loading items...
              </p>

              <ul
                v-else-if="sessionItems(session.id).length > 0"
                class="space-y-1.5"
              >
                <li
                  v-for="(entry, idx) in sessionItems(session.id)"
                  :key="`${session.id}-${entry.name}-${idx}`"
                  class="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-3 py-2"
                >
                  <span class="text-sm text-slate-200">{{ entry.name }}</span>
                  <span class="text-xs font-semibold text-cyan-200">{{ entry.amount }} {{ entry.unit }}</span>
                </li>
              </ul>

              <p v-else class="text-sm text-slate-400">No purchased items recorded for this session.</p>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-16 text-center">
      <svg class="mb-5 h-20 w-20 text-slate-500 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      <h3 class="text-lg font-semibold text-slate-200">No history yet</h3>
      <p class="mt-2 max-w-sm text-sm text-slate-400">Complete a shopping session to see it here</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSessionStore } from '../stores/session'

const sessionStore = useSessionStore()
const expandedSession = ref(null)

async function toggleSession(id) {
  if (expandedSession.value === id) {
    expandedSession.value = null
    return
  }

  expandedSession.value = id
  await sessionStore.fetchSessionItems(id)
}

function sessionItems(sessionId) {
  return sessionStore.sessionItemsById[sessionId] || []
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  sessionStore.fetchPastSessions()
})
</script>
