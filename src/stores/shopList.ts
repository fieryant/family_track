import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useSessionStore } from './session'
import { useCategoriesStore } from './categories'
import type { ShopListItem, CategoryGroup, ShopListStatus } from '../types'

export const useShopListStore = defineStore('shopList', () => {
  const listItems = ref<ShopListItem[]>([])
  const loading = ref(false)
  const shoppingMode = ref(false)

  const groupedByCategory = computed((): CategoryGroup[] => {
    const categoriesStore = useCategoriesStore()
    const groups: Record<string, CategoryGroup> = {}

    listItems.value.forEach(item => {
      const catId = item._categoryId ?? 'uncategorized'
      if (!groups[catId]) {
        const cat = categoriesStore.byId[catId]
        groups[catId] = {
          category: cat ?? { id: catId, name: 'Other', icon: '📦', sort_order: 999 },
          items: [],
        }
      }
      groups[catId].items.push(item)
    })

    return Object.values(groups).sort(
      (a, b) => a.category.sort_order - b.category.sort_order
    )
  })

  const summary = computed(() => {
    const total = listItems.value.length
    const bought = listItems.value.filter(i => i.status === 'bought').length
    const partial = listItems.value.filter(i => i.status === 'partial').length
    const pending = listItems.value.filter(i => i.status === 'pending').length
    const removed = listItems.value.filter(i => i.status === 'removed').length
    return { total, bought, partial, pending, removed }
  })

  // Shape of a raw DB row joined with item + unit labels
  type RawRow = ShopListItem & {
    item: { name: string; category_id: string | null; unit_type_id: string | null } | null
    requested_unit: { label: string } | null
    bought_unit_rel: { label: string } | null
  }

  function mapRow(d: RawRow): ShopListItem {
    return {
      ...d,
      _name: d.item?.name ?? 'Unknown',
      _categoryId: d.item?.category_id ?? null,
      _unitTypeId: d.item?.unit_type_id ?? null,
      _requestedUnitLabel: d.requested_unit?.label ?? '',
      _boughtUnitLabel: d.bought_unit_rel?.label ?? null,
    }
  }

  async function fetch() {
    const sessionStore = useSessionStore()
    if (!sessionStore.activeSession) return

    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!
          .from('shop_list_items')
          .select(`
            *,
            item:items(name, category_id, unit_type_id),
            requested_unit:units!requested_unit_id(label),
            bought_unit_rel:units!bought_unit_id(label)
          `)
          .eq('session_id', sessionStore.activeSession.id)
          .order('added_at')

        if (error) throw error
        listItems.value = (data as unknown as RawRow[]).map(mapRow)
      }
    } catch (e) {
      console.error('Failed to fetch shop list:', e)
    } finally {
      loading.value = false
    }
  }

  async function addItem({
    itemId,
    itemName,
    categoryId,
    unitTypeId,
    amount,
    unitId,
  }: {
    itemId: string
    itemName: string
    categoryId: string | null
    unitTypeId: string | null
    amount: number
    unitId: string
  }): Promise<ShopListItem | undefined> {
    const sessionStore = useSessionStore()
    if (!sessionStore.activeSession) return

    const exists = listItems.value.find(i => i.item_id === itemId)
    if (exists) return exists

    const newItem: ShopListItem = {
      id: 'sli-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      session_id: sessionStore.activeSession.id,
      item_id: itemId,
      requested_amount: amount,
      requested_unit_id: unitId,
      status: 'pending',
      bought_amount: null,
      bought_unit_id: null,
      note: null,
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _name: itemName,
      _categoryId: categoryId,
      _unitTypeId: unitTypeId,
      _requestedUnitLabel: unitId,  // placeholder; caller should resolve label if needed
      _boughtUnitLabel: null,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('shop_list_items')
        .insert({
          session_id: newItem.session_id,
          item_id: itemId,
          requested_amount: amount,
          requested_unit_id: unitId,
        })
        .select(`
          *,
          item:items(name, category_id, unit_type_id),
          requested_unit:units!requested_unit_id(label),
          bought_unit_rel:units!bought_unit_id(label)
        `)
        .single()

      if (error) throw error
      const mapped = mapRow(data as unknown as RawRow)
      listItems.value.push(mapped)
      return mapped
    }

    listItems.value.push(newItem)
    return newItem
  }

  async function updateStatus(
    listItemId: string,
    status: ShopListStatus,
    boughtAmount: number | null = null,
    boughtUnitId: string | null = null,
    price: number | null = null
  ) {
    const idx = listItems.value.findIndex(i => i.id === listItemId)
    if (idx === -1) return

    listItems.value[idx] = {
      ...listItems.value[idx],
      status,
      bought_amount: boughtAmount,
      bought_unit_id: boughtUnitId,
      price,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      const update: Record<string, unknown> = { status, price }
      if (boughtAmount !== null) update.bought_amount = boughtAmount
      if (boughtUnitId !== null) update.bought_unit_id = boughtUnitId

      await supabase!.from('shop_list_items').update(update).eq('id', listItemId)
    }
  }

  async function updateRequested(listItemId: string, amount: number, unitId: string) {
    const idx = listItems.value.findIndex(i => i.id === listItemId)
    if (idx === -1) return

    listItems.value[idx] = {
      ...listItems.value[idx],
      requested_amount: amount,
      requested_unit_id: unitId,
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      await supabase!
        .from('shop_list_items')
        .update({ requested_amount: amount, requested_unit_id: unitId })
        .eq('id', listItemId)
    }
  }

  async function removeItem(listItemId: string) {
    listItems.value = listItems.value.filter(i => i.id !== listItemId)
    if (isSupabaseConfigured) {
      await supabase!.from('shop_list_items').delete().eq('id', listItemId)
    }
  }

  async function carryPendingToSession(sessionId: string) {
    const toCarry = listItems.value.flatMap(i => {
      if (i.status === 'pending') return [{ item: i, amount: i.requested_amount }]
      if (i.status === 'partial') {
        const remaining = i.requested_amount - (i.bought_amount ?? 0)
        if (remaining > 0) return [{ item: i, amount: remaining }]
      }
      return []
    })

    if (toCarry.length === 0) {
      listItems.value = []
      return
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('shop_list_items')
        .insert(
          toCarry.map(({ item, amount }) => ({
            session_id: sessionId,
            item_id: item.item_id,
            requested_amount: amount,
            requested_unit_id: item.requested_unit_id,
          }))
        )
        .select(`
          *,
          item:items(name, category_id, unit_type_id),
          requested_unit:units!requested_unit_id(label),
          bought_unit_rel:units!bought_unit_id(label)
        `)

      if (error) throw error
      listItems.value = (data as unknown as RawRow[]).map(mapRow)
      return
    }

    listItems.value = toCarry.map(({ item, amount }) => ({
      ...item,
      id: 'sli-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      session_id: sessionId,
      requested_amount: amount,
      status: 'pending' as ShopListStatus,
      bought_amount: null,
      bought_unit_id: null,
      price: null,
      updated_at: new Date().toISOString(),
    }))
  }

  function clearList() {
    listItems.value = []
  }

  function toggleShoppingMode() {
    shoppingMode.value = !shoppingMode.value
  }

  return {
    listItems,
    loading,
    shoppingMode,
    groupedByCategory,
    summary,
    fetch,
    addItem,
    updateRequested,
    updateStatus,
    removeItem,
    carryPendingToSession,
    clearList,
    toggleShoppingMode,
  }
})
