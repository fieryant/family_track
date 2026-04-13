import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedCategories } from '../lib/seedData'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const loading = ref(false)

  const sorted = computed(() =>
    [...categories.value].sort((a, b) => a.sort_order - b.sort_order)
  )

  const byId = computed(() => {
    const map = {}
    categories.value.forEach(c => { map[c.id] = c })
    return map
  })

  async function fetch() {
    loading.value = true
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order')
        if (error) throw error
        categories.value = data
      } else {
        categories.value = seedCategories
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e)
      categories.value = seedCategories
    } finally {
      loading.value = false
    }
  }

  async function create({ name, icon = '' }) {
    const trimmedName = name?.trim()
    if (!trimmedName) throw new Error('Category name is required')

    const maxOrder = categories.value.reduce((m, c) => Math.max(m, c.sort_order ?? 0), 0)
    const newItem = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      icon: icon.trim(),
      sort_order: maxOrder + 1,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newItem.name, icon: newItem.icon, sort_order: newItem.sort_order })
        .select('*')
        .single()
      if (error) throw error
      categories.value.push(data)
      return data
    }

    categories.value.push(newItem)
    return newItem
  }

  async function update(id, { name, icon }) {
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Category not found')

    const patch = {
      name: name?.trim() ?? categories.value[idx].name,
      icon: icon != null ? icon.trim() : categories.value[idx].icon,
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('categories')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      categories.value[idx] = data
      return data
    }

    categories.value[idx] = { ...categories.value[idx], ...patch }
    return categories.value[idx]
  }

  async function remove(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    }
    categories.value = categories.value.filter(c => c.id !== id)
  }

  return { categories, loading, sorted, byId, fetch, create, update, remove }
})
