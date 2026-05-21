import { supabase, DEFAULT_LIST_ID } from './supabase.js'

export function getListId(id?: string): string {
  const resolved = id ?? DEFAULT_LIST_ID
  if (!resolved) throw new Error('list_id is required (or set DEFAULT_LIST_ID in .env)')
  return resolved
}

export async function resolveActiveSession(listId: string): Promise<string> {
  const { data, error } = await supabase
    .from('shop_sessions')
    .select('id')
    .eq('is_active', true)
    .eq('list_id', listId)
    .maybeSingle()

  if (error) throw new Error(`Session lookup failed: ${error.message}`)
  if (data) return (data as { id: string }).id

  const { data: newSession, error: insertErr } = await supabase
    .from('shop_sessions')
    .insert({ is_active: true, list_id: listId })
    .select('id')
    .single()

  if (insertErr) throw new Error(`Session create failed: ${insertErr.message}`)
  return (newSession as { id: string }).id
}

export async function searchItemsByName(query: string, limit = 10) {
  const q = query.toLowerCase().trim()

  const { data: tRows } = await supabase
    .from('translations')
    .select('entity_id')
    .eq('entity_type', 'item')
    .ilike('value', `%${q}%`)
    .limit(limit)

  const idsFromTranslations = ((tRows ?? []) as Array<{ entity_id: string }>).map((r) => r.entity_id)

  const { data: nameRows } = await supabase
    .from('items')
    .select('id')
    .ilike('name', `%${q}%`)
    .eq('is_active', true)
    .limit(limit)

  const allIds = [
    ...new Set([
      ...idsFromTranslations,
      ...((nameRows ?? []) as Array<{ id: string }>).map((r) => r.id),
    ]),
  ].slice(0, limit)

  if (allIds.length === 0) return []

  const { data: items, error } = await supabase
    .from('items')
    .select(`
      id, name, category_id, unit_type_id, is_active, sort_order,
      translations(locale, field, value),
      unit_presets(id, label, amount, unit_id, sort_order)
    `)
    .in('id', allIds)
    .eq('is_active', true)

  if (error) throw new Error(`Item search failed: ${error.message}`)
  return items ?? []
}

export async function resolveUnit(symbolOrLabel: string) {
  const { data } = await supabase
    .from('units')
    .select('id, symbol, label, unit_type_id')
    .or(`symbol.ilike.${symbolOrLabel},label.ilike.${symbolOrLabel}`)
    .limit(1)
    .maybeSingle()
  return data as { id: string; symbol: string; label: string; unit_type_id: string } | null
}
