<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useListsStore } from '../stores/lists'
import { useLocaleStore } from '../stores/locale'
import { useShopListStore } from '../stores/shopList'
import { usePantryStore } from '../stores/pantry'

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking'

interface Message {
  role: 'user' | 'assistant'
  text: string
  actions?: string[]
}

const listsStore = useListsStore()
const localeStore = useLocaleStore()
const shopListStore = useShopListStore()
const pantryStore = usePantryStore()

const state = ref<AssistantState>('idle')
const messages = ref<Message[]>([])
const textInput = ref('')
const errorMessage = ref<string | null>(null)
const threadEl = ref<HTMLElement | null>(null)

let recognition: InstanceType<typeof SpeechRecognition> | null = null

const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
const isSupported = computed(() => !!SpeechRecognition && isSupabaseConfigured)

const localeToSpeechLang: Record<string, string> = {
  en: 'en-US',
  bn: 'bn-BD',
}

const stateLabel = computed(() => {
  if (state.value === 'listening') return 'Listening…'
  if (state.value === 'processing') return 'Processing…'
  if (state.value === 'speaking') return 'Speaking…'
  return isSupported.value ? 'Tap mic or type a command' : 'Voice not available — type a command'
})

async function scrollToBottom() {
  await nextTick()
  if (threadEl.value) {
    threadEl.value.scrollTop = threadEl.value.scrollHeight
  }
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
  if (!text.trim()) return
  state.value = 'processing'
  errorMessage.value = null
  messages.value.push({ role: 'user', text })
  await scrollToBottom()

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

    await Promise.all([shopListStore.fetch(), pantryStore.fetch()])

    messages.value.push({
      role: 'assistant',
      text: data.response_text ?? 'Done!',
      actions: data.actions_taken ?? [],
    })
    await scrollToBottom()
    speak(data.response_text ?? '')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Something went wrong'
    errorMessage.value = msg
    state.value = 'idle'
    messages.value.push({ role: 'assistant', text: `Error: ${msg}` })
    await scrollToBottom()
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
      messages.value.push({ role: 'assistant', text: `Mic error: ${event.error}` })
      scrollToBottom()
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

function handleMicClick() {
  if (state.value === 'idle') startListening()
  else if (state.value === 'listening') stopListening()
  else if (state.value === 'speaking') {
    window.speechSynthesis?.cancel()
    state.value = 'idle'
  }
}

function handleSend() {
  const text = textInput.value.trim()
  if (!text || state.value === 'processing') return
  textInput.value = ''
  sendToAssistant(text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

onUnmounted(() => {
  recognition?.stop()
  window.speechSynthesis?.cancel()
})
</script>

<template>
  <div class="flex flex-col h-[calc(100dvh-12.5rem)] w-full">
    <!-- Thread -->
    <div
      ref="threadEl"
      class="flex-1 overflow-y-auto space-y-3 pb-4 px-1"
    >
      <!-- Empty state -->
      <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div class="h-20 w-20 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
          <svg class="h-10 w-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
        <div>
          <p class="text-slate-200 font-medium">AI Assistant</p>
          <p class="text-slate-500 text-sm mt-1">Ask me to add items, check your pantry,<br>or manage your shopping list.</p>
        </div>
        <div class="flex flex-wrap justify-center gap-2 max-w-xs">
          <button
            v-for="hint in ['Add milk to the list', 'What\'s in my pantry?', 'Clear bought items']"
            :key="hint"
            class="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
            @click="sendToAssistant(hint)"
          >
            {{ hint }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <template v-else>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div :class="[
            'max-w-[80%] rounded-2xl px-4 py-3',
            msg.role === 'user'
              ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-100'
              : 'bg-slate-800/80 border border-white/10 text-slate-100'
          ]">
            <p class="text-sm leading-relaxed">{{ msg.text }}</p>
            <div v-if="msg.actions && msg.actions.length" class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="action in msg.actions"
                :key="action"
                class="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-slate-400"
              >
                {{ action }}
              </span>
            </div>
          </div>
        </div>

        <!-- Processing indicator -->
        <div v-if="state === 'processing'" class="flex justify-start">
          <div class="bg-slate-800/80 border border-white/10 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
            <span class="h-2 w-2 rounded-full bg-fuchsia-400 animate-bounce" style="animation-delay: 0ms"></span>
            <span class="h-2 w-2 rounded-full bg-fuchsia-400 animate-bounce" style="animation-delay: 150ms"></span>
            <span class="h-2 w-2 rounded-full bg-fuchsia-400 animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </template>
    </div>

    <!-- Input area -->
    <div class="shrink-0 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-3 space-y-3">
      <!-- State label -->
      <p class="text-center text-xs text-slate-500">{{ stateLabel }}</p>

      <!-- Mic button -->
      <div class="flex justify-center">
        <button
          :class="[
            'relative flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all duration-200',
            state === 'idle'
              ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 hover:bg-cyan-500/30 hover:scale-105'
              : state === 'listening'
                ? 'bg-red-500/30 border border-red-400/60 text-red-400 scale-110'
                : state === 'processing'
                  ? 'bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-400 cursor-wait'
                  : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400',
          ]"
          :disabled="state === 'processing' || !isSupported"
          :aria-label="
            state === 'idle' ? 'Start voice command'
            : state === 'listening' ? 'Listening — tap to stop'
            : state === 'processing' ? 'Processing…'
            : 'Speaking — tap to stop'
          "
          @click="handleMicClick"
        >
          <!-- Idle: mic -->
          <svg v-if="state === 'idle'" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>

          <!-- Listening: pulsing stop -->
          <span v-else-if="state === 'listening'" class="relative flex h-7 w-7 items-center justify-center">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-30"></span>
            <svg class="h-6 w-6 relative" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </span>

          <!-- Processing: spinner -->
          <span v-else-if="state === 'processing'" class="h-7 w-7 animate-spin rounded-full border-2 border-fuchsia-400/30 border-t-fuchsia-400"></span>

          <!-- Speaking: wave -->
          <svg v-else class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      </div>

      <!-- Text input -->
      <div class="flex gap-2">
        <input
          v-model="textInput"
          type="text"
          placeholder="Or type a command…"
          class="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-400/40 focus:bg-white/8 transition"
          :disabled="state === 'processing'"
          @keydown="handleKeydown"
        />
        <button
          class="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 transition"
          :disabled="!textInput.trim() || state === 'processing'"
          @click="handleSend"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
