import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedUnitTypes } from '../lib/seedData'
import type { UnitType } from '../types'

export const useUnitTypesStore = defineStore('unitTypes', () => {
  const unitTypes = ref<UnitType[]>([])
  const loading = ref(false)

  const sorted = computed(() =>
    [...unitTypes.value].sort((a, b) => a.sort_order - b.sort_order)
  )

  const byId = computed(() => {
    const map: Record<string, UnitType> = {}
    unitTypes.value.forEach(ut => { map[ut.id] = ut })
    return map
  })

  async function fetch() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase!
          .from('unit_types')
          .select('*')
          .order('sort_order')
        if (error) throw error
        unitTypes.value = data
      } else {
        unitTypes.value = seedUnitTypes
      }
    } catch (e) {
      console.error('Failed to fetch unit types:', e)
      unitTypes.value = seedUnitTypes
    } finally {
      loading.value = false
    }
  }

  async function create({ name, label }: { name: string; label: string }): Promise<UnitType> {
    const trimmedName = name?.trim()
    const trimmedLabel = label?.trim()
    if (!trimmedName || !trimmedLabel) throw new Error('Name and label are required')

    const maxOrder = unitTypes.value.reduce((m, ut) => Math.max(m, ut.sort_order ?? 0), 0)
    const newItem: UnitType = {
      id: `ut-${Date.now()}`,
      name: trimmedName,
      label: trimmedLabel,
      sort_order: maxOrder + 1,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('unit_types')
        .insert({ name: newItem.name, label: newItem.label, sort_order: newItem.sort_order })
        .select('*')
        .single()
      if (error) throw error
      unitTypes.value.push(data)
      return data
    }

    unitTypes.value.push(newItem)
    return newItem
  }

  async function update(id: string, { name, label }: { name?: string; label?: string }): Promise<UnitType> {
    const idx = unitTypes.value.findIndex(ut => ut.id === id)
    if (idx === -1) throw new Error('Unit type not found')

    const patch = {
      name: name?.trim() ?? unitTypes.value[idx].name,
      label: label?.trim() ?? unitTypes.value[idx].label,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('unit_types')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      unitTypes.value[idx] = data
      return data
    }

    unitTypes.value[idx] = { ...unitTypes.value[idx], ...patch }
    return unitTypes.value[idx]
  }

  async function remove(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('unit_types').delete().eq('id', id)
      if (error) throw error
    }
    unitTypes.value = unitTypes.value.filter(ut => ut.id !== id)
  }

  return { unitTypes, loading, sorted, byId, fetch, create, update, remove }
})
