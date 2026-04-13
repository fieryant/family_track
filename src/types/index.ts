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
  unit_type_id: string | null
  is_active: boolean
  sort_order: number
}

export interface UnitPreset {
  id: string
  item_id: string
  label: string
  amount: number
  unit_id: string  // UUID FK → units(id)
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
  unit: string  // resolved symbol for display (joined from units)
}

export type ShopListStatus = 'pending' | 'bought' | 'partial' | 'removed'

export interface ShopListItem {
  id: string
  session_id: string
  item_id: string
  requested_amount: number
  requested_unit_id: string   // UUID FK → units(id)
  status: ShopListStatus
  bought_amount: number | null
  bought_unit_id: string | null  // UUID FK → units(id)
  note: string | null
  added_at: string
  updated_at: string
  // Denormalised fields joined/resolved at fetch time
  _name: string
  _categoryId: string | null
  _unitTypeId: string | null
  _requestedUnitSymbol: string
  _boughtUnitSymbol: string | null
}

export interface CategoryGroup {
  category: Category
  items: ShopListItem[]
}
