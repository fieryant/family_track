import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { PantryItem } from '../types'

export const usePantryStore = defineStore('pantry', () => {
  const pantryItems = ref<PantryItem[]>([])
  const loading = ref(false)

  const byItemId = computed(() => {
    const map: Record<string, PantryItem> = {}
    pantryItems.value.forEach(p => { map[p.item_id] = p })
    return map
  })

  function getAmount(itemId: string): number {
    return byItemId.value[itemId]?.amount ?? 0
  }

  async function fetch() {
    loading.value = true
    try {
      if (!isSupabaseConfigured) {
        pantryItems.value = []
        return
      }
      const { useListsStore } = await import('./lists')
      const listsStore = useListsStore()
      if (!listsStore.currentListId) {
        pantryItems.value = []
        return
      }
      const { data, error } = await supabase!
        .from('pantry_items')
        .select('*')
        .eq('list_id', listsStore.currentListId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      pantryItems.value = data ?? []
    } catch (e) {
      console.error('Failed to fetch pantry:', e)
      pantryItems.value = []
    } finally {
      loading.value = false
    }
  }

  async function setAmount(itemId: string, amount: number, unitId: string | null): Promise<void> {
    if (!isSupabaseConfigured) {
      const idx = pantryItems.value.findIndex(p => p.item_id === itemId)
      const now = new Date().toISOString()
      if (amount <= 0) {
        if (idx !== -1) pantryItems.value.splice(idx, 1)
        return
      }
      if (idx === -1) {
        pantryItems.value.unshift({
          id: `pantry-${Date.now()}`,
          list_id: 'local',
          item_id: itemId,
          amount,
          unit_id: unitId,
          updated_at: now,
        })
      } else {
        pantryItems.value[idx] = { ...pantryItems.value[idx], amount, unit_id: unitId, updated_at: now }
      }
      return
    }

    const { useListsStore } = await import('./lists')
    const listsStore = useListsStore()
    if (!listsStore.currentListId) return

    if (amount <= 0) {
      const existing = pantryItems.value.find(p => p.item_id === itemId)
      if (existing) {
        const { error } = await supabase!.from('pantry_items').delete().eq('id', existing.id)
        if (error) {
          console.error('Failed to remove pantry entry:', error)
          return
        }
        pantryItems.value = pantryItems.value.filter(p => p.id !== existing.id)
      }
      return
    }

    const { data, error } = await supabase!
      .from('pantry_items')
      .upsert(
        { list_id: listsStore.currentListId, item_id: itemId, amount, unit_id: unitId },
        { onConflict: 'list_id,item_id' }
      )
      .select('*')
      .single()
    if (error) {
      console.error('Failed to upsert pantry entry:', error)
      return
    }
    const idx = pantryItems.value.findIndex(p => p.item_id === itemId)
    if (idx === -1) pantryItems.value.unshift(data)
    else pantryItems.value[idx] = data
  }

  async function adjust(itemId: string, delta: number, unitIdIfNew: string | null = null): Promise<void> {
    const current = byItemId.value[itemId]
    const nextAmount = (current?.amount ?? 0) + delta
    const unitId = current?.unit_id ?? unitIdIfNew
    await setAmount(itemId, Math.max(0, nextAmount), unitId)
  }

  async function remove(itemId: string): Promise<void> {
    await setAmount(itemId, 0, null)
  }

  async function applyPurchases(purchases: Array<{ item_id: string; amount: number; unit_id: string }>): Promise<void> {
    for (const p of purchases) {
      const current = byItemId.value[p.item_id]
      // Only auto-increment when units match; otherwise leave existing manual entry alone
      if (!current) {
        await setAmount(p.item_id, p.amount, p.unit_id)
      } else if (current.unit_id === p.unit_id) {
        await setAmount(p.item_id, current.amount + p.amount, p.unit_id)
      }
      // mismatched units → no-op (preserve user's manual unit choice)
    }
  }

  return { pantryItems, loading, byItemId, getAmount, fetch, setAmount, adjust, remove, applyPurchases }
})
