import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

let initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  async function initialize(): Promise<void> {
    if (initPromise) return initPromise

    initPromise = (async () => {
      if (!isSupabaseConfigured) {
        loading.value = false
        return
      }

      const { data: { session } } = await supabase!.auth.getSession()
      user.value = session?.user ?? null

      supabase!.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })

      loading.value = false
    })()

    return initPromise
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    return data
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase!.auth.signUp({ email, password })
    if (error) throw error
    return data
  }

  async function signOut(): Promise<void> {
    await supabase!.auth.signOut()
    user.value = null
  }

  return { user, loading, isAuthenticated, initialize, signIn, signUp, signOut }
})
