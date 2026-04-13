import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedUnits } from '../lib/seedData'
import type { Unit } from '../types'

export const useUnitsStore = defineStore('units', () => {
  const units = ref<Unit[]>([])
  const loading = ref(false)

  const sorted = computed(() =>
    [...units.value].sort((a, b) => {
      if (a.unit_type_id !== b.unit_type_id) return a.unit_type_id.localeCompare(b.unit_type_id)
      return a.sort_order - b.sort_order
    })
  )

  const byId = computed(() => {
    const map: Record<string, Unit> = {}
    units.value.forEach(u => { map[u.id] = u })
    return map
  })

  function forType(unitTypeId: string): Unit[] {
    return units.value
      .filter(u => u.unit_type_id === unitTypeId)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  async function fetch() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!
          .from('units')
          .select('*')
          .order('sort_order')
        if (error) throw error
        units.value = data
      } else {
        units.value = seedUnits
      }
    } catch (e) {
      console.error('Failed to fetch units:', e)
      units.value = seedUnits
    } finally {
      loading.value = false
    }
  }

  async function create({
    unitTypeId,
    symbol,
    label,
    baseFactor = 1,
  }: {
    unitTypeId: string
    symbol: string
    label: string
    baseFactor?: number
  }): Promise<Unit> {
    if (!unitTypeId || !symbol?.trim() || !label?.trim()) {
      throw new Error('Unit type, symbol, and label are required')
    }
    const typeUnits = units.value.filter(u => u.unit_type_id === unitTypeId)
    const maxOrder = typeUnits.reduce((m, u) => Math.max(m, u.sort_order ?? 0), 0)

    const newItem: Unit = {
      id: `u-${Date.now()}`,
      unit_type_id: unitTypeId,
      symbol: symbol.trim(),
      label: label.trim(),
      base_factor: Number(baseFactor) || 1,
      sort_order: maxOrder + 1,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('units')
        .insert({
          unit_type_id: newItem.unit_type_id,
          symbol: newItem.symbol,
          label: newItem.label,
          base_factor: newItem.base_factor,
          sort_order: newItem.sort_order,
        })
        .select('*')
        .single()
      if (error) throw error
      units.value.push(data)
      return data
    }

    units.value.push(newItem)
    return newItem
  }

  async function update(
    id: string,
    { symbol, label, baseFactor, unitTypeId }: { symbol?: string; label?: string; baseFactor?: number; unitTypeId?: string }
  ): Promise<Unit> {
    const idx = units.value.findIndex(u => u.id === id)
    if (idx === -1) throw new Error('Unit not found')

    const patch = {
      symbol: symbol?.trim() ?? units.value[idx].symbol,
      label: label?.trim() ?? units.value[idx].label,
      base_factor: baseFactor != null ? Number(baseFactor) : units.value[idx].base_factor,
      unit_type_id: unitTypeId ?? units.value[idx].unit_type_id,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('units')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      units.value[idx] = data
      return data
    }

    units.value[idx] = { ...units.value[idx], ...patch }
    return units.value[idx]
  }

  async function remove(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('units').delete().eq('id', id)
      if (error) throw error
    }
    units.value = units.value.filter(u => u.id !== id)
  }

  return { units, loading, sorted, byId, forType, fetch, create, update, remove }
})
