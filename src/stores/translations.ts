import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { seedTranslations } from '../lib/seedData'
import type { Locale, Translation, TranslatableEntity } from '../types'

export const useTranslationsStore = defineStore('translations', () => {
  // entity_type → entity_id → rows
  const byEntity = ref<Record<string, Record<string, Translation[]>>>({})

  function get(entityType: TranslatableEntity, entityId: string): Translation[] {
    return byEntity.value[entityType]?.[entityId] ?? []
  }

  function _index(rows: Translation[]) {
    for (const row of rows) {
      if (!byEntity.value[row.entity_type]) byEntity.value[row.entity_type] = {}
      const bucket = byEntity.value[row.entity_type]
      if (!bucket[row.entity_id]) bucket[row.entity_id] = []
      const existing = bucket[row.entity_id]
      const idx = existing.findIndex(x => x.locale === row.locale && x.field === row.field)
      if (idx >= 0) existing[idx] = row
      else existing.push(row)
    }
  }

  async function fetchFor(entityType: TranslatableEntity) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase!
        .from('translations')
        .select('*')
        .eq('entity_type', entityType)
      if (error) { console.error('Failed to fetch translations:', error); return }
      _index(data as Translation[])
    } else {
      _index(seedTranslations.filter(t => t.entity_type === entityType))
    }
  }

  async function upsert(
    entityType: TranslatableEntity,
    entityId: string,
    locale: Locale,
    value: string,
    field = 'name',
  ) {
    const row: Translation = { entity_type: entityType, entity_id: entityId, locale, field, value }
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('translations')
        .upsert({ entity_type: entityType, entity_id: entityId, locale, field, value, updated_at: new Date().toISOString() })
      if (error) { console.error('Failed to upsert translation:', error); return }
    }
    _index([row])
  }

  async function removeFor(entityType: TranslatableEntity, entityId: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!
        .from('translations')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
      if (error) console.error('Failed to remove translations:', error)
    }
    if (byEntity.value[entityType]) {
      delete byEntity.value[entityType][entityId]
    }
  }

  return { byEntity, get, fetchFor, upsert, removeFor }
})
