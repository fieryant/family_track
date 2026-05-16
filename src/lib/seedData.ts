import type { UnitType, Unit, Category, Item, UnitPreset, Translation } from '../types'

// Seed data — used as fallback when Supabase is not configured

export const seedUnitTypes: UnitType[] = [
  { id: 'ut-weight', name: 'weight', label: 'Weight', sort_order: 1 },
  { id: 'ut-volume', name: 'volume', label: 'Volume', sort_order: 2 },
  { id: 'ut-count',  name: 'count',  label: 'Count',  sort_order: 3 },
  { id: 'ut-length', name: 'length', label: 'Length', sort_order: 4 },
]

export const seedUnits: Unit[] = [
  // Weight
  { id: 'u-g',  unit_type_id: 'ut-weight', symbol: 'g',  label: 'Gram',       base_factor: 1,    sort_order: 1 },
  { id: 'u-kg', unit_type_id: 'ut-weight', symbol: 'kg', label: 'Kilogram',   base_factor: 1000, sort_order: 2 },
  { id: 'u-pl', unit_type_id: 'ut-weight', symbol: 'pl', label: 'Palla',      base_factor: 5000, sort_order: 3 },
  // Volume
  { id: 'u-ml', unit_type_id: 'ut-volume', symbol: 'ml', label: 'Milliliter', base_factor: 1,    sort_order: 1 },
  { id: 'u-l',  unit_type_id: 'ut-volume', symbol: 'L',  label: 'Liter',      base_factor: 1000, sort_order: 2 },
  // Count
  { id: 'u-pc', unit_type_id: 'ut-count',  symbol: 'pc', label: 'Piece',      base_factor: 1,    sort_order: 1 },
  { id: 'u-hl', unit_type_id: 'ut-count',  symbol: 'hl', label: 'Hali',       base_factor: 4,    sort_order: 2 },
  { id: 'u-dz', unit_type_id: 'ut-count',  symbol: 'dz', label: 'Dozen',      base_factor: 12,   sort_order: 3 },
  // Length
  { id: 'u-cm', unit_type_id: 'ut-length', symbol: 'cm', label: 'Centimeter', base_factor: 1,    sort_order: 1 },
  { id: 'u-m',  unit_type_id: 'ut-length', symbol: 'm',  label: 'Meter',      base_factor: 100,  sort_order: 2 },
]

export const seedCategories: Category[] = [
  { id: 'cat-produce',   name: 'Produce',        icon: '🥬', sort_order: 1 },
  { id: 'cat-dairy',     name: 'Dairy & Eggs',    icon: '🥛', sort_order: 2 },
  { id: 'cat-meat',      name: 'Meat & Fish',     icon: '🥩', sort_order: 3 },
  { id: 'cat-bakery',    name: 'Bakery',          icon: '🍞', sort_order: 4 },
  { id: 'cat-beverages', name: 'Beverages',       icon: '🥤', sort_order: 5 },
  { id: 'cat-snacks',    name: 'Snacks',          icon: '🍿', sort_order: 6 },
  { id: 'cat-spices',    name: 'Spices & Sauces', icon: '🌶️', sort_order: 7 },
  { id: 'cat-grains',    name: 'Grains & Pasta',  icon: '🍚', sort_order: 8 },
  { id: 'cat-frozen',    name: 'Frozen',          icon: '🧊', sort_order: 9 },
  { id: 'cat-household', name: 'Household',       icon: '🧹', sort_order: 10 },
  { id: 'cat-personal',  name: 'Personal Care',   icon: '🧴', sort_order: 11 },
]

export const seedItems: Item[] = [
  // Produce
  { id: 'item-tomato',    category_id: 'cat-produce',    name: 'Tomatoes',     unit_type_id: 'ut-weight', is_active: true, sort_order: 1 },
  { id: 'item-onion',     category_id: 'cat-produce',    name: 'Onions',       unit_type_id: 'ut-weight', is_active: true, sort_order: 2 },
  { id: 'item-potato',    category_id: 'cat-produce',    name: 'Potatoes',     unit_type_id: 'ut-weight', is_active: true, sort_order: 3 },
  { id: 'item-garlic',    category_id: 'cat-produce',    name: 'Garlic',       unit_type_id: 'ut-count',  is_active: true, sort_order: 4 },
  { id: 'item-lemon',     category_id: 'cat-produce',    name: 'Lemons',       unit_type_id: 'ut-count',  is_active: true, sort_order: 5 },
  { id: 'item-banana',    category_id: 'cat-produce',    name: 'Bananas',      unit_type_id: 'ut-count',  is_active: true, sort_order: 6 },
  { id: 'item-apple',     category_id: 'cat-produce',    name: 'Apples',       unit_type_id: 'ut-weight', is_active: true, sort_order: 7 },
  { id: 'item-carrot',    category_id: 'cat-produce',    name: 'Carrots',      unit_type_id: 'ut-weight', is_active: true, sort_order: 8 },
  { id: 'item-cucumber',  category_id: 'cat-produce',    name: 'Cucumbers',    unit_type_id: 'ut-count',  is_active: true, sort_order: 9 },
  { id: 'item-pepper',    category_id: 'cat-produce',    name: 'Bell Peppers', unit_type_id: 'ut-count',  is_active: true, sort_order: 10 },
  // Dairy & Eggs
  { id: 'item-milk',      category_id: 'cat-dairy',      name: 'Milk',         unit_type_id: 'ut-volume', is_active: true, sort_order: 1 },
  { id: 'item-eggs',      category_id: 'cat-dairy',      name: 'Eggs',         unit_type_id: 'ut-count',  is_active: true, sort_order: 2 },
  { id: 'item-cheese',    category_id: 'cat-dairy',      name: 'Cheese',       unit_type_id: 'ut-weight', is_active: true, sort_order: 3 },
  { id: 'item-yogurt',    category_id: 'cat-dairy',      name: 'Yogurt',       unit_type_id: 'ut-volume', is_active: true, sort_order: 4 },
  { id: 'item-butter',    category_id: 'cat-dairy',      name: 'Butter',       unit_type_id: 'ut-weight', is_active: true, sort_order: 5 },
  // Meat & Fish
  { id: 'item-chicken',   category_id: 'cat-meat',       name: 'Chicken',      unit_type_id: 'ut-weight', is_active: true, sort_order: 1 },
  { id: 'item-beef',      category_id: 'cat-meat',       name: 'Beef',         unit_type_id: 'ut-weight', is_active: true, sort_order: 2 },
  { id: 'item-fish',      category_id: 'cat-meat',       name: 'Fish',         unit_type_id: 'ut-weight', is_active: true, sort_order: 3 },
  // Bakery
  { id: 'item-bread',     category_id: 'cat-bakery',     name: 'Bread',        unit_type_id: 'ut-count',  is_active: true, sort_order: 1 },
  // Beverages
  { id: 'item-water',     category_id: 'cat-beverages',  name: 'Water',        unit_type_id: 'ut-volume', is_active: true, sort_order: 1 },
  { id: 'item-juice',     category_id: 'cat-beverages',  name: 'Juice',        unit_type_id: 'ut-volume', is_active: true, sort_order: 2 },
  { id: 'item-tea',       category_id: 'cat-beverages',  name: 'Tea',          unit_type_id: 'ut-count',  is_active: true, sort_order: 3 },
  { id: 'item-coffee',    category_id: 'cat-beverages',  name: 'Coffee',       unit_type_id: 'ut-weight', is_active: true, sort_order: 4 },
  // Snacks
  { id: 'item-chips',     category_id: 'cat-snacks',     name: 'Chips',        unit_type_id: 'ut-count',  is_active: true, sort_order: 1 },
  { id: 'item-biscuits',  category_id: 'cat-snacks',     name: 'Biscuits',     unit_type_id: 'ut-count',  is_active: true, sort_order: 2 },
  // Spices & Sauces
  { id: 'item-salt',      category_id: 'cat-spices',     name: 'Salt',         unit_type_id: 'ut-weight', is_active: true, sort_order: 1 },
  { id: 'item-oil',       category_id: 'cat-spices',     name: 'Cooking Oil',  unit_type_id: 'ut-volume', is_active: true, sort_order: 2 },
  { id: 'item-soy-sauce', category_id: 'cat-spices',     name: 'Soy Sauce',    unit_type_id: 'ut-volume', is_active: true, sort_order: 3 },
  // Grains & Pasta
  { id: 'item-rice',      category_id: 'cat-grains',     name: 'Rice',         unit_type_id: 'ut-weight', is_active: true, sort_order: 1 },
  { id: 'item-pasta',     category_id: 'cat-grains',     name: 'Pasta',        unit_type_id: 'ut-weight', is_active: true, sort_order: 2 },
  { id: 'item-flour',     category_id: 'cat-grains',     name: 'Flour',        unit_type_id: 'ut-weight', is_active: true, sort_order: 3 },
  // Household
  { id: 'item-detergent', category_id: 'cat-household',  name: 'Detergent',    unit_type_id: 'ut-count',  is_active: true, sort_order: 1 },
  { id: 'item-tissue',    category_id: 'cat-household',  name: 'Tissue',       unit_type_id: 'ut-count',  is_active: true, sort_order: 2 },
  { id: 'item-soap',      category_id: 'cat-household',  name: 'Dish Soap',    unit_type_id: 'ut-volume', is_active: true, sort_order: 3 },
  // Personal Care
  { id: 'item-shampoo',   category_id: 'cat-personal',   name: 'Shampoo',      unit_type_id: 'ut-volume', is_active: true, sort_order: 1 },
  { id: 'item-toothpaste',category_id: 'cat-personal',   name: 'Toothpaste',   unit_type_id: 'ut-count',  is_active: true, sort_order: 2 },
]

interface PresetTemplate {
  label: string
  amount: number
  unit: string   // symbol used to look up the unit_id from the provided units array
  sort_order: number
}

const weightPresets: PresetTemplate[] = [
  { label: '100g', amount: 100,  unit: 'g', sort_order: 1 },
  { label: '250g', amount: 250,  unit: 'g', sort_order: 2 },
  { label: '500g', amount: 500,  unit: 'g', sort_order: 3 },
  { label: '1 kg', amount: 1000, unit: 'g', sort_order: 4 },
  { label: '2 kg', amount: 2000, unit: 'g', sort_order: 5 },
  { label: '5 kg', amount: 5000, unit: 'g', sort_order: 6 },
]

const volumePresets: PresetTemplate[] = [
  { label: '250ml', amount: 250,  unit: 'ml', sort_order: 1 },
  { label: '500ml', amount: 500,  unit: 'ml', sort_order: 2 },
  { label: '1 L',   amount: 1000, unit: 'ml', sort_order: 3 },
  { label: '2 L',   amount: 2000, unit: 'ml', sort_order: 4 },
  { label: '5 L',   amount: 5000, unit: 'ml', sort_order: 5 },
]

const countPresets: PresetTemplate[] = [
  { label: '1 pc',   amount: 1,  unit: 'pc', sort_order: 1 },
  { label: '2 pcs',  amount: 2,  unit: 'pc', sort_order: 2 },
  { label: '3 pcs',  amount: 3,  unit: 'pc', sort_order: 3 },
  { label: '6 pcs',  amount: 6,  unit: 'pc', sort_order: 4 },
  { label: '12 pcs', amount: 12, unit: 'pc', sort_order: 5 },
]

const presetsByTypeName: Record<string, PresetTemplate[]> = {
  weight: weightPresets,
  volume: volumePresets,
  count:  countPresets,
}

/**
 * Build UnitPreset records for an item.
 * @param itemId      The item's id
 * @param unitTypeName  The unit type's name ('weight' | 'volume' | 'count' | 'length')
 * @param units       Units belonging to this type — used to resolve symbol → unit_id
 */
export function buildUnitPresetsForItem(
  itemId: string,
  unitTypeName: string,
  units: Unit[],
): UnitPreset[] {
  const templates = presetsByTypeName[unitTypeName] ?? countPresets
  return templates
    .map((template, index) => {
      const unit = units.find(u => u.symbol === template.unit)
      if (!unit) return null
      return {
        id: `preset-${itemId}-${index + 1}`,
        item_id: itemId,
        label: template.label,
        amount: template.amount,
        unit_id: unit.id,
        sort_order: template.sort_order,
      }
    })
    .filter((p): p is UnitPreset => p !== null)
}

const bnNames: Record<string, string> = {
  'item-tomato':     'টমেটো',
  'item-onion':      'পেঁয়াজ',
  'item-potato':     'আলু',
  'item-garlic':     'রসুন',
  'item-lemon':      'লেবু',
  'item-banana':     'কলা',
  'item-apple':      'আপেল',
  'item-carrot':     'গাজর',
  'item-cucumber':   'শসা',
  'item-pepper':     'ক্যাপসিকাম',
  'item-milk':       'দুধ',
  'item-eggs':       'ডিম',
  'item-cheese':     'পনির',
  'item-yogurt':     'দই',
  'item-butter':     'মাখন',
  'item-chicken':    'মুরগি',
  'item-beef':       'গরুর মাংস',
  'item-fish':       'মাছ',
  'item-bread':      'পাউরুটি',
  'item-water':      'পানি',
  'item-juice':      'জুস',
  'item-tea':        'চা',
  'item-coffee':     'কফি',
  'item-chips':      'চিপস',
  'item-biscuits':   'বিস্কুট',
  'item-salt':       'লবণ',
  'item-oil':        'রান্নার তেল',
  'item-soy-sauce':  'সয়া সস',
  'item-rice':       'চাল',
  'item-pasta':      'পাস্তা',
  'item-flour':      'আটা',
  'item-detergent':  'ডিটারজেন্ট',
  'item-tissue':     'টিস্যু',
  'item-soap':       'ডিশ সাবান',
  'item-shampoo':    'শ্যাম্পু',
  'item-toothpaste': 'টুথপেস্ট',
}

export const seedTranslations: Translation[] = seedItems.flatMap(item => {
  const rows: Translation[] = [
    { entity_type: 'item', entity_id: item.id, locale: 'en', field: 'name', value: item.name },
  ]
  const bn = bnNames[item.id]
  if (bn) rows.push({ entity_type: 'item', entity_id: item.id, locale: 'bn', field: 'name', value: bn })
  return rows
})

export const seedUnitPresets: UnitPreset[] = seedItems.flatMap(item => {
  const unitType = seedUnitTypes.find(ut => ut.id === item.unit_type_id)
  const units = seedUnits.filter(u => u.unit_type_id === item.unit_type_id)
  return buildUnitPresetsForItem(item.id, unitType?.name ?? 'count', units)
})
