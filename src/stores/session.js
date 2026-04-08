import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export const useSessionStore = defineStore('session', () => {
  const activeSession = ref(null)
  const pastSessions = ref([])
  const loading = ref(false)
  const sessionItemsById = ref({})
  const loadingSessionItems = ref({})

  const hasActiveSession = computed(() => !!activeSession.value)

  // Fetch or create the active session
  async function fetchActive() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('shop_sessions')
          .select('*')
          .eq('is_active', true)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        if (data) {
          activeSession.value = data
        } else {
          await createSession()
        }
      } else {
        // Local mode — create an in-memory session
        if (!activeSession.value) {
          activeSession.value = {
            id: 'session-' + Date.now(),
            started_at: new Date().toISOString(),
            completed_at: null,
            is_active: true,
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch session:', e)
      activeSession.value = {
        id: 'session-' + Date.now(),
        started_at: new Date().toISOString(),
        completed_at: null,
        is_active: true,
      }
    } finally {
      loading.value = false
    }
  }

  async function createSession() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('shop_sessions')
        .insert({ is_active: true })
        .select()
        .single()
      if (error) throw error
      activeSession.value = data
    } else {
      activeSession.value = {
        id: 'session-' + Date.now(),
        started_at: new Date().toISOString(),
        completed_at: null,
        is_active: true,
      }
    }
  }

  async function completeSession(boughtItems) {
    if (!activeSession.value) return

    if (isSupabaseConfigured) {
      // Mark session as completed
      await supabase
        .from('shop_sessions')
        .update({
          is_active: false,
          completed_at: new Date().toISOString(),
        })
        .eq('id', activeSession.value.id)

      // Log bought items to purchase_history
      if (boughtItems.length > 0) {
        const historyRecords = boughtItems.map(item => ({
          session_id: activeSession.value.id,
          item_id: item.item_id,
          amount: item.bought_amount || item.requested_amount,
          unit: item.bought_unit || item.requested_unit,
        }))
        await supabase.from('purchase_history').insert(historyRecords)
      }

      // Store completed session in pastSessions
      const completedItems = boughtItems.map(item => ({
        name: item._name || 'Unknown',
        amount: item.bought_amount || item.requested_amount,
        unit: item.bought_unit || item.requested_unit,
      }))

      pastSessions.value.unshift({
        ...activeSession.value,
        completed_at: new Date().toISOString(),
        is_active: false,
        _itemCount: boughtItems.length,
        _items: completedItems,
      })

      sessionItemsById.value[activeSession.value.id] = completedItems

      // Create new session
      await createSession()
    } else {
      // Local mode
      const completedItems = boughtItems.map(item => ({
        name: item._name || 'Unknown',
        amount: item.bought_amount || item.requested_amount,
        unit: item.bought_unit || item.requested_unit,
      }))

      pastSessions.value.unshift({
        ...activeSession.value,
        completed_at: new Date().toISOString(),
        is_active: false,
        _itemCount: boughtItems.length,
        _items: completedItems,
      })
      sessionItemsById.value[activeSession.value.id] = completedItems
      activeSession.value = {
        id: 'session-' + Date.now(),
        started_at: new Date().toISOString(),
        completed_at: null,
        is_active: true,
      }
    }
  }

  async function fetchPastSessions() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('shop_sessions')
        .select('*')
        .eq('is_active', false)
        .order('completed_at', { ascending: false })
        .limit(20)
      if (error) throw error
      pastSessions.value = data
    }
    // In local mode, pastSessions is populated by completeSession
  }

  async function fetchSessionItems(sessionId) {
    if (!sessionId) return []
    if (sessionItemsById.value[sessionId]) {
      return sessionItemsById.value[sessionId]
    }

    if (!isSupabaseConfigured) {
      const localSession = pastSessions.value.find(s => s.id === sessionId)
      const items = localSession?._items || []
      sessionItemsById.value[sessionId] = items
      return items
    }

    loadingSessionItems.value = {
      ...loadingSessionItems.value,
      [sessionId]: true,
    }

    try {
      const { data, error } = await supabase
        .from('purchase_history')
        .select(`
          amount,
          unit,
          item:items(name)
        `)
        .eq('session_id', sessionId)
        .order('bought_at', { ascending: true })

      if (error) throw error

      const items = (data || []).map(entry => ({
        name: entry.item?.name || 'Unknown',
        amount: entry.amount,
        unit: entry.unit,
      }))

      sessionItemsById.value = {
        ...sessionItemsById.value,
        [sessionId]: items,
      }

      const sessionIdx = pastSessions.value.findIndex(s => s.id === sessionId)
      if (sessionIdx !== -1) {
        pastSessions.value[sessionIdx] = {
          ...pastSessions.value[sessionIdx],
          _itemCount: items.length,
        }
      }

      return items
    } catch (e) {
      console.error('Failed to fetch session items:', e)
      return []
    } finally {
      loadingSessionItems.value = {
        ...loadingSessionItems.value,
        [sessionId]: false,
      }
    }
  }

  return {
    activeSession,
    pastSessions,
    loading,
    sessionItemsById,
    loadingSessionItems,
    hasActiveSession,
    fetchActive,
    createSession,
    completeSession,
    fetchPastSessions,
    fetchSessionItems,
  }
})
