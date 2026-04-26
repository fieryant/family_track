import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ShopSession, SessionItem } from '../types'

export const useSessionStore = defineStore('session', () => {
  const activeSession = ref<ShopSession | null>(null)
  const pastSessions = ref<ShopSession[]>([])
  const loading = ref(false)
  const sessionItemsById = ref<Record<string, SessionItem[]>>({})
  const loadingSessionItems = ref<Record<string, boolean>>({})

  const hasActiveSession = computed(() => !!activeSession.value)

  async function fetchActive() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { useListsStore } = await import('./lists')
        const listsStore = useListsStore()
        if (!listsStore.currentListId) return

        const { data, error } = await supabase!
          .from('shop_sessions')
          .select('*')
          .eq('is_active', true)
          .eq('list_id', listsStore.currentListId)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        if (data) {
          activeSession.value = data
        } else {
          await createSession()
        }
      } else {
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
      const { useListsStore } = await import('./lists')
      const listsStore = useListsStore()
      const { data, error } = await supabase!
        .from('shop_sessions')
        .insert({ is_active: true, list_id: listsStore.currentListId })
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

  async function completeSession(boughtItems: Array<{
    item_id: string
    bought_amount: number | null
    requested_amount: number
    bought_unit_id: string | null
    requested_unit_id: string
    price?: number | null
    _name?: string
    _requestedUnitLabel?: string
    _boughtUnitLabel?: string | null
  }>) {
    if (!activeSession.value) return

    if (isSupabaseConfigured) {
      await supabase!
        .from('shop_sessions')
        .update({ is_active: false, completed_at: new Date().toISOString() })
        .eq('id', activeSession.value.id)

      if (boughtItems.length > 0) {
        const historyRecords = boughtItems.map(item => ({
          session_id: activeSession.value!.id,
          item_id: item.item_id,
          amount: item.bought_amount ?? item.requested_amount,
          unit_id: item.bought_unit_id ?? item.requested_unit_id,
          price: item.price ?? null,
        }))
        await supabase!.from('purchase_history').insert(historyRecords)

        const { usePantryStore } = await import('./pantry')
        const pantryStore = usePantryStore()
        if (pantryStore.pantryItems.length === 0) await pantryStore.fetch()
        await pantryStore.applyPurchases(historyRecords)
      }

      const completedItems: SessionItem[] = boughtItems.map(item => ({
        name: item._name ?? 'Unknown',
        amount: item.bought_amount ?? item.requested_amount,
        unit: item._boughtUnitLabel ?? item._requestedUnitLabel ?? '',
        price: item.price ?? null,
      }))

      pastSessions.value.unshift({
        ...activeSession.value,
        completed_at: new Date().toISOString(),
        is_active: false,
        _itemCount: boughtItems.length,
        _items: completedItems,
      })

      sessionItemsById.value[activeSession.value.id] = completedItems
      await createSession()
    } else {
      const completedItems: SessionItem[] = boughtItems.map(item => ({
        name: item._name ?? 'Unknown',
        amount: item.bought_amount ?? item.requested_amount,
        unit: item._boughtUnitLabel ?? item._requestedUnitLabel ?? '',
        price: item.price ?? null,
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
      const { useListsStore } = await import('./lists')
      const listsStore = useListsStore()
      if (!listsStore.currentListId) return

      const { data, error } = await supabase!
        .from('shop_sessions')
        .select('*')
        .eq('is_active', false)
        .eq('list_id', listsStore.currentListId)
        .order('completed_at', { ascending: false })
        .limit(20)
      if (error) throw error
      pastSessions.value = data
    }
  }

  async function fetchSessionItems(sessionId: string): Promise<SessionItem[]> {
    if (!sessionId) return []
    if (sessionItemsById.value[sessionId]) return sessionItemsById.value[sessionId]

    if (!isSupabaseConfigured) {
      const localSession = pastSessions.value.find(s => s.id === sessionId)
      const items = localSession?._items ?? []
      sessionItemsById.value[sessionId] = items
      return items
    }

    loadingSessionItems.value = { ...loadingSessionItems.value, [sessionId]: true }

    try {
      const { data, error } = await supabase!
        .from('purchase_history')
        .select(`amount, unit_id, price, unit:units(label), item:items(name)`)
        .eq('session_id', sessionId)
        .order('bought_at', { ascending: true })

      if (error) throw error

      const items: SessionItem[] = (data ?? []).map((entry: {
        amount: number
        unit_id: string
        price: number | null
        unit: { label: string }[] | { label: string } | null
        item: { name: string }[] | { name: string } | null
      }) => ({
        name: (Array.isArray(entry.item) ? entry.item[0]?.name : entry.item?.name) ?? 'Unknown',
        amount: entry.amount,
        unit: (Array.isArray(entry.unit) ? entry.unit[0]?.label : entry.unit?.label) ?? '',
        price: entry.price ?? null,
      }))

      sessionItemsById.value = { ...sessionItemsById.value, [sessionId]: items }

      const sessionIdx = pastSessions.value.findIndex(s => s.id === sessionId)
      if (sessionIdx !== -1) {
        pastSessions.value[sessionIdx] = { ...pastSessions.value[sessionIdx], _itemCount: items.length }
      }

      return items
    } catch (e) {
      console.error('Failed to fetch session items:', e)
      return []
    } finally {
      loadingSessionItems.value = { ...loadingSessionItems.value, [sessionId]: false }
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
