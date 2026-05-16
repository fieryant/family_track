<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useListsStore } from '../stores/lists'
import { useLocaleStore } from '../stores/locale'
import { useShopListStore } from '../stores/shopList'
import { usePantryStore } from '../stores/pantry'

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking'

const listsStore = useListsStore()
const localeStore = useLocaleStore()
const shopListStore = useShopListStore()
const pantryStore = usePantryStore()

const state = ref<AssistantState>('idle')
const toast = ref<{ message: string; actions: string[] } | null>(null)
const errorMessage = ref<string | null>(null)

let recognition: InstanceType<typeof SpeechRecognition> | null = null
let toastTimeout: ReturnType<typeof setTimeout> | null = null

const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
const isSupported = computed(() => !!SpeechRecognition && isSupabaseConfigured)

const localeToSpeechLang: Record<string, string> = {
  en: 'en-US',
  bn: 'bn-BD',
}

function showToast(message: string, actions: string[]) {
  toast.value = { message, actions }
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => { toast.value = null }, 6000)
}

function speak(text: string) {
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = localeToSpeechLang[localeStore.currentLocale] ?? 'en-US'
  utterance.rate = 1.0
  utterance.onend = () => { state.value = 'idle' }
  utterance.onerror = () => { state.value = 'idle' }
  state.value = 'speaking'
  window.speechSynthesis.speak(utterance)
}

async function sendToAssistant(text: string) {
  state.value = 'processing'
  errorMessage.value = null

  try {
    const { data: { session } } = await supabase!.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const listId = listsStore.currentListId
    if (!listId) throw new Error('No list selected')

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const res = await fetch(`${supabaseUrl}/functions/v1/voice-assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string,
      },
      body: JSON.stringify({
        text,
        list_id: listId,
        locale: localeStore.currentLocale,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error ?? 'Assistant request failed')
    }

    const data = await res.json()

    await Promise.all([
      shopListStore.fetch(),
      pantryStore.fetch(),
    ])

    showToast(data.response_text ?? 'Done!', data.actions_taken ?? [])
    speak(data.response_text ?? '')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong'
    errorMessage.value = msg
    state.value = 'idle'
    showToast(`Error: ${msg}`, [])
  }
}

function startListening() {
  if (!SpeechRecognition || state.value !== 'idle') return

  window.speechSynthesis?.cancel()
  recognition = new SpeechRecognition()
  recognition.lang = localeToSpeechLang[localeStore.currentLocale] ?? 'en-US'
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.continuous = false

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript.trim()
    if (transcript) sendToAssistant(transcript)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error !== 'no-speech') {
      errorMessage.value = `Mic error: ${event.error}`
      showToast(`Mic error: ${event.error}`, [])
    }
    state.value = 'idle'
  }

  recognition.onend = () => {
    if (state.value === 'listening') state.value = 'idle'
  }

  state.value = 'listening'
  recognition.start()
}

function stopListening() {
  recognition?.stop()
  state.value = 'idle'
}

function handleButtonClick() {
  if (state.value === 'idle') startListening()
  else if (state.value === 'listening') stopListening()
  else if (state.value === 'speaking') {
    window.speechSynthesis?.cancel()
    state.value = 'idle'
  }
}

onUnmounted(() => {
  recognition?.stop()
  window.speechSynthesis?.cancel()
  if (toastTimeout) clearTimeout(toastTimeout)
})
</script>

<template>
  <div v-if="isSupported" class="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
    <!-- Toast notification -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="toast"
        class="max-w-[240px] rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-xl shadow-xl"
      >
        <p class="text-sm text-slate-100 leading-snug">{{ toast.message }}</p>
        <button
          class="mt-1 text-xs text-slate-500 hover:text-slate-300 transition"
          @click="toast = null"
        >
          dismiss
        </button>
      </div>
    </transition>

    <!-- Mic button -->
    <button
      :class="[
        'relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200',
        state === 'idle'
          ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/30 hover:scale-105'
          : state === 'listening'
            ? 'bg-red-500/30 border border-red-400/60 text-red-400 scale-110'
            : state === 'processing'
              ? 'bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-400 cursor-wait'
              : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400',
      ]"
      :disabled="state === 'processing'"
      :aria-label="
        state === 'idle' ? 'Start voice command'
        : state === 'listening' ? 'Listening — tap to stop'
        : state === 'processing' ? 'Processing…'
        : 'Speaking — tap to stop'
      "
      @click="handleButtonClick"
    >
      <!-- Idle: mic icon -->
      <svg v-if="state === 'idle'" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>

      <!-- Listening: pulsing stop icon -->
      <span v-else-if="state === 'listening'" class="relative flex h-6 w-6 items-center justify-center">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-30"></span>
        <svg class="h-5 w-5 relative" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      </span>

      <!-- Processing: spinner -->
      <span v-else-if="state === 'processing'" class="h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-400/30 border-t-fuchsia-400"></span>

      <!-- Speaking: wave icon -->
      <svg v-else class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    </button>

    <!-- State label -->
    <span
      v-if="state !== 'idle'"
      class="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-400 backdrop-blur border border-white/10"
    >
      {{ state === 'listening' ? 'Listening…' : state === 'processing' ? 'Processing…' : 'Speaking…' }}
    </span>
  </div>
</template>
