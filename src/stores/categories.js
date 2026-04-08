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

  return { categories, loading, sorted, byId, fetch }
})
