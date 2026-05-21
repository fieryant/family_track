export type ShopListStatus = 'pending' | 'bought' | 'partial' | 'removed'
export type Locale = 'en' | 'bn'

export interface ItemRow {
  id: string
  name: string
  category_id: string | null
  unit_type_id: string | null
  is_active: boolean
  sort_order: number
  translations?: Array<{ locale: string; field: string; value: string }>
  unit_presets?: Array<{ id: string; label: string; amount: number; unit_id: string; sort_order: number }>
}
