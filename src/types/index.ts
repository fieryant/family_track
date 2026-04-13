export interface Category {
  id: string
  name: string
  icon: string
  sort_order: number
}

export interface UnitType {
  id: string
  name: string
  label: string
  sort_order: number
}

export interface Unit {
  id: string
  unit_type_id: string
  symbol: string
  label: string
  base_factor: number
  sort_order: number
}

export interface Item {
  id: string
  category_id: string | null
  name: string
  /** Present in Supabase mode (UUID FK to unit_types) */
  unit_type_id?: string
  /** Present in seed/local mode (text name, e.g. 'weight') */
  default_unit_type?: string
  is_active: boolean
  sort_order: number
}

export interface UnitPreset {
  id: string
  item_id: string
  label: string
  amount: number
  unit: string
  sort_order: number
}

export interface ShopSession {
  id: string
  started_at: string
  completed_at: string | null
  is_active: boolean
  /** Populated after fetching session items */
  _itemCount?: number
  _items?: SessionItem[]
}

export interface SessionItem {
  name: string
  amount: number
  unit: string
}

export type ShopListStatus = 'pending' | 'bought' | 'partial' | 'removed'

export interface ShopListItem {
  id: string
  session_id: string
  item_id: string
  requested_amount: number
  requested_unit: string
  status: ShopListStatus
  bought_amount: number | null
  bought_unit: string | null
  note: string | null
  added_at: string
  updated_at: string
  // Denormalised fields joined from items
  _name: string
  _categoryId: string | null
  _unitType: string
}

export interface CategoryGroup {
  category: Category
  items: ShopListItem[]
}
