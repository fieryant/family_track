<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const signUpSuccess = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await authStore.signIn(email.value.trim(), password.value)
      router.push('/')
    } else {
      await authStore.signUp(email.value.trim(), password.value)
      signUpSuccess.value = true
    }
  } catch (e) {
    error.value = e.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  error.value = ''
  signUpSuccess.value = false
}
</script>

<template>
  <div class="flex min-h-dvh w-full flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-8">
      <div class="text-center">
        <div class="mb-4 text-5xl">🛒</div>
        <h1 class="text-2xl font-bold tracking-tight text-white">Family Market</h1>
        <p class="mt-1 text-sm text-slate-400">
          {{ mode === 'signin' ? 'Sign in to your account' : 'Create an account' }}
        </p>
      </div>

      <div
        v-if="signUpSuccess"
        class="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300"
      >
        Account created! Check your email to confirm, then sign in.
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <div class="space-y-3">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none backdrop-blur-xl transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none backdrop-blur-xl transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
        </div>

        <div
          v-if="error"
          class="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50"
        >
          {{ loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>

      <p class="text-center text-sm text-slate-400">
        {{ mode === 'signin' ? "Don't have an account?" : 'Already have an account?' }}
        <button
          type="button"
          class="ml-1 font-medium text-cyan-400 hover:text-cyan-300"
          @click="toggleMode"
        >
          {{ mode === 'signin' ? 'Sign up' : 'Sign in' }}
        </button>
      </p>
    </div>
  </div>
</template>
