<script setup lang="ts">
import { ref } from 'vue'
import { useListsStore } from '../stores/lists'
import type { ShoppingList } from '../types'

const props = defineProps<{ list: ShoppingList }>()
const emit = defineEmits<{ close: [] }>()

const listsStore = useListsStore()

const copied = ref(false)
const email = ref('')
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const inviteSuccess = ref(false)

async function copyCode() {
  await navigator.clipboard.writeText(props.list.invite_code)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function sendInvite() {
  const addr = email.value.trim()
  if (!addr) return
  inviting.value = true
  inviteError.value = null
  inviteSuccess.value = false

  const err = await listsStore.addMemberByEmail(props.list.id, addr)
  inviting.value = false
  if (err) {
    inviteError.value = err
  } else {
    inviteSuccess.value = true
    email.value = ''
    setTimeout(() => { inviteSuccess.value = false }, 3000)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 class="mb-1 text-base font-bold text-white">Share "{{ list.name }}"</h3>
        <p class="mb-5 text-xs text-slate-400">Invite by email or share the code below.</p>

        <!-- Email invite -->
        <div v-if="list._role === 'owner'">
          <label class="mb-1.5 block text-xs font-medium text-slate-400">Invite by email</label>
          <div class="flex gap-2">
            <input
              v-model="email"
              type="email"
              placeholder="family@example.com"
              class="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              @keydown.enter="sendInvite"
            />
            <button
              type="button"
              :disabled="!email.trim() || inviting"
              class="shrink-0 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
              @click="sendInvite"
            >
              <span v-if="inviting">…</span>
              <span v-else>Add</span>
            </button>
          </div>
          <p v-if="inviteError" class="mt-2 text-xs text-red-400">{{ inviteError }}</p>
          <p v-if="inviteSuccess" class="mt-2 text-xs text-emerald-400">Added successfully!</p>
        </div>

        <!-- Divider -->
        <div class="my-5 flex items-center gap-3">
          <div class="h-px flex-1 bg-white/10"></div>
          <span class="text-[11px] text-slate-500">or share invite code</span>
          <div class="h-px flex-1 bg-white/10"></div>
        </div>

        <!-- Code display -->
        <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800 px-5 py-4">
          <span class="flex-1 text-center font-mono text-3xl font-bold tracking-[0.25em] text-cyan-300">
            {{ list.invite_code }}
          </span>
          <button
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium transition"
            :class="copied ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
            @click="copyCode"
          >
            <svg v-if="!copied" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>

        <p class="mt-3 text-center text-[11px] text-slate-500">
          Anyone with this code can join and edit this list.
        </p>

        <button
          type="button"
          class="mt-5 w-full rounded-xl border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          @click="emit('close')"
        >
          Done
        </button>
      </div>
    </div>
  </Teleport>
</template>
