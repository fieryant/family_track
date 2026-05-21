<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { isSupabaseConfigured } from '../lib/supabase'

const router = useRouter()

const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
const isSupported = computed(() => !!SpeechRecognition && isSupabaseConfigured)
</script>

<template>
  <div v-if="isSupported" class="fixed bottom-24 right-4 z-40">
    <button
      class="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-xl hover:bg-cyan-500/30 hover:scale-105 transition-all duration-200"
      aria-label="Open AI assistant"
      @click="router.push('/assistant')"
    >
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  </div>
</template>
