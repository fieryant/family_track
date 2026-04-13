// Seed data — used as fallback when Supabase is not configured

export const seedUnitTypes = [
  { id: 'ut-weight', name: 'weight', label: 'Weight', sort_order: 1 },
  { id: 'ut-volume', name: 'volume', label: 'Volume', sort_order: 2 },
  { id: 'ut-count',  name: 'count',  label: 'Count',  sort_order: 3 },
  { id: 'ut-length', name: 'length', label: 'Length', sort_order: 4 },
]

export const seedUnits = [
  // Weight
  { id: 'u-g',  unit_type_id: 'ut-weight', symbol: 'g',  label: 'Gram',       base_factor: 1,    sort_order: 1 },
  { id: 'u-kg', unit_type_id: 'ut-weight', symbol: 'kg', label: 'Kilogram',   base_factor: 1000, sort_order: 2 },
  { id: 'u-pl', unit_type_id: 'ut-weight', symbol: 'pl', label: 'Palla',      base_factor: 5000, sort_order: 3 },
  // Volume
  { id: 'u-ml', unit_type_id: 'ut-volume', symbol: 'ml', label: 'Milliliter', base_factor: 1,    sort_order: 1 },
  { id: 'u-l',  unit_type_id: 'ut-volume', symbol: 'L',  label: 'Liter',      base_factor: 1000, sort_order: 2 },
  // Count
  { id: 'u-pc', unit_type_id: 'ut-count',  symbol: 'pc', label: 'Piece',      base_factor: 1,    sort_order: 1 },
  { id: 'u-hl', unit_type_id: 'ut-count',  symbol: 'hl', label: 'Hali', base_factor: 4,  sort_order: 2 },
  { id: 'u-dz', unit_type_id: 'ut-count',  symbol: 'dz', label: 'Dozen',    base_factor: 12,   sort_order: 3 },
  // Length
  { id: 'u-cm', unit_type_id: 'ut-length', symbol: 'cm', label: 'Centimeter', base_factor: 1,    sort_order: 1 },
  { id: 'u-m',  unit_type_id: 'ut-length', symbol: 'm',  label: 'Meter',      base_factor: 100,  sort_order: 2 },
]
export const seedCategories = [
  { id: 'cat-produce',  name: 'Produce',       icon: '🥬', sort_order: 1 },
  { id: 'cat-dairy',    name: 'Dairy & Eggs',   icon: '🥛', sort_order: 2 },
  { id: 'cat-meat',     name: 'Meat & Fish',    icon: '🥩', sort_order: 3 },
  { id: 'cat-bakery',   name: 'Bakery',         icon: '🍞', sort_order: 4 },
  { id: 'cat-beverages',name: 'Beverages',      icon: '🥤', sort_order: 5 },
  { id: 'cat-snacks',   name: 'Snacks',         icon: '🍿', sort_order: 6 },
  { id: 'cat-spices',   name: 'Spices & Sauces',icon: '🌶️', sort_order: 7 },
  { id: 'cat-grains',   name: 'Grains & Pasta', icon: '🍚', sort_order: 8 },
  { id: 'cat-frozen',   name: 'Frozen',         icon: '🧊', sort_order: 9 },
  { id: 'cat-household',name: 'Household',      icon: '🧹', sort_order: 10 },
  { id: 'cat-personal', name: 'Personal Care',  icon: '🧴', sort_order: 11 },
]

export const seedItems = [
  // Produce
  { id: 'item-tomato',    category_id: 'cat-produce', name: 'Tomatoes',      default_unit_type: 'weight', is_active: true, sort_order: 1 },
  { id: 'item-onion',     category_id: 'cat-produce', name: 'Onions',        default_unit_type: 'weight', is_active: true, sort_order: 2 },
  { id: 'item-potato',    category_id: 'cat-produce', name: 'Potatoes',      default_unit_type: 'weight', is_active: true, sort_order: 3 },
  { id: 'item-garlic',    category_id: 'cat-produce', name: 'Garlic',        default_unit_type: 'count',  is_active: true, sort_order: 4 },
  { id: 'item-lemon',     category_id: 'cat-produce', name: 'Lemons',        default_unit_type: 'count',  is_active: true, sort_order: 5 },
  { id: 'item-banana',    category_id: 'cat-produce', name: 'Bananas',       default_unit_type: 'count',  is_active: true, sort_order: 6 },
  { id: 'item-apple',     category_id: 'cat-produce', name: 'Apples',        default_unit_type: 'weight', is_active: true, sort_order: 7 },
  { id: 'item-carrot',    category_id: 'cat-produce', name: 'Carrots',       default_unit_type: 'weight', is_active: true, sort_order: 8 },
  { id: 'item-cucumber',  category_id: 'cat-produce', name: 'Cucumbers',     default_unit_type: 'count',  is_active: true, sort_order: 9 },
  { id: 'item-pepper',    category_id: 'cat-produce', name: 'Bell Peppers',  default_unit_type: 'count',  is_active: true, sort_order: 10 },

  // Dairy & Eggs
  { id: 'item-milk',      category_id: 'cat-dairy', name: 'Milk',           default_unit_type: 'volume', is_active: true, sort_order: 1 },
  { id: 'item-eggs',      category_id: 'cat-dairy', name: 'Eggs',           default_unit_type: 'count',  is_active: true, sort_order: 2 },
  { id: 'item-cheese',    category_id: 'cat-dairy', name: 'Cheese',         default_unit_type: 'weight', is_active: true, sort_order: 3 },
  { id: 'item-yogurt',    category_id: 'cat-dairy', name: 'Yogurt',         default_unit_type: 'volume', is_active: true, sort_order: 4 },
  { id: 'item-butter',    category_id: 'cat-dairy', name: 'Butter',         default_unit_type: 'weight', is_active: true, sort_order: 5 },

  // Meat & Fish
  { id: 'item-chicken',   category_id: 'cat-meat', name: 'Chicken',        default_unit_type: 'weight', is_active: true, sort_order: 1 },
  { id: 'item-beef',      category_id: 'cat-meat', name: 'Beef',           default_unit_type: 'weight', is_active: true, sort_order: 2 },
  { id: 'item-fish',      category_id: 'cat-meat', name: 'Fish',           default_unit_type: 'weight', is_active: true, sort_order: 3 },

  // Bakery
  { id: 'item-bread',     category_id: 'cat-bakery', name: 'Bread',        default_unit_type: 'count',  is_active: true, sort_order: 1 },

  // Beverages
  { id: 'item-water',     category_id: 'cat-beverages', name: 'Water',     default_unit_type: 'volume', is_active: true, sort_order: 1 },
  { id: 'item-juice',     category_id: 'cat-beverages', name: 'Juice',     default_unit_type: 'volume', is_active: true, sort_order: 2 },
  { id: 'item-tea',       category_id: 'cat-beverages', name: 'Tea',       default_unit_type: 'count',  is_active: true, sort_order: 3 },
  { id: 'item-coffee',    category_id: 'cat-beverages', name: 'Coffee',    default_unit_type: 'weight', is_active: true, sort_order: 4 },

  // Snacks
  { id: 'item-chips',     category_id: 'cat-snacks', name: 'Chips',        default_unit_type: 'count',  is_active: true, sort_order: 1 },
  { id: 'item-biscuits',  category_id: 'cat-snacks', name: 'Biscuits',     default_unit_type: 'count',  is_active: true, sort_order: 2 },

  // Spices & Sauces
  { id: 'item-salt',      category_id: 'cat-spices', name: 'Salt',         default_unit_type: 'weight', is_active: true, sort_order: 1 },
  { id: 'item-oil',       category_id: 'cat-spices', name: 'Cooking Oil',  default_unit_type: 'volume', is_active: true, sort_order: 2 },
  { id: 'item-soy-sauce', category_id: 'cat-spices', name: 'Soy Sauce',    default_unit_type: 'volume', is_active: true, sort_order: 3 },

  // Grains & Pasta
  { id: 'item-rice',      category_id: 'cat-grains', name: 'Rice',         default_unit_type: 'weight', is_active: true, sort_order: 1 },
  { id: 'item-pasta',     category_id: 'cat-grains', name: 'Pasta',        default_unit_type: 'weight', is_active: true, sort_order: 2 },
  { id: 'item-flour',     category_id: 'cat-grains', name: 'Flour',        default_unit_type: 'weight', is_active: true, sort_order: 3 },

  // Household
  { id: 'item-detergent', category_id: 'cat-household', name: 'Detergent', default_unit_type: 'count',  is_active: true, sort_order: 1 },
  { id: 'item-tissue',    category_id: 'cat-household', name: 'Tissue',    default_unit_type: 'count',  is_active: true, sort_order: 2 },
  { id: 'item-soap',      category_id: 'cat-household', name: 'Dish Soap', default_unit_type: 'volume', is_active: true, sort_order: 3 },

  // Personal Care
  { id: 'item-shampoo',   category_id: 'cat-personal', name: 'Shampoo',    default_unit_type: 'volume', is_active: true, sort_order: 1 },
  { id: 'item-toothpaste',category_id: 'cat-personal', name: 'Toothpaste', default_unit_type: 'count',  is_active: true, sort_order: 2 },
]

// Unit presets keyed by default_unit_type
const weightPresets = [
  { label: '100g', amount: 100, unit: 'g', sort_order: 1 },
  { label: '250g', amount: 250, unit: 'g', sort_order: 2 },
  { label: '500g', amount: 500, unit: 'g', sort_order: 3 },
  { label: '1 kg', amount: 1000, unit: 'g', sort_order: 4 },
  { label: '2 kg', amount: 2000, unit: 'g', sort_order: 5 },
  { label: '5 kg', amount: 5000, unit: 'g', sort_order: 6 },
]

const volumePresets = [
  { label: '250ml', amount: 250, unit: 'ml', sort_order: 1 },
  { label: '500ml', amount: 500, unit: 'ml', sort_order: 2 },
  { label: '1 L',   amount: 1000, unit: 'ml', sort_order: 3 },
  { label: '2 L',   amount: 2000, unit: 'ml', sort_order: 4 },
  { label: '5 L',   amount: 5000, unit: 'ml', sort_order: 5 },
]

const countPresets = [
  { label: '1 pc',  amount: 1,  unit: 'pc', sort_order: 1 },
  { label: '2 pcs', amount: 2,  unit: 'pc', sort_order: 2 },
  { label: '3 pcs', amount: 3,  unit: 'pc', sort_order: 3 },
  { label: '6 pcs', amount: 6,  unit: 'pc', sort_order: 4 },
  { label: '12 pcs',amount: 12, unit: 'pc', sort_order: 5 },
]

const presetsByType = {
  weight: weightPresets,
  volume: volumePresets,
  count:  countPresets,
}

export function buildUnitPresetsForItem(itemId, unitType) {
  const presets = presetsByType[unitType] || countPresets
  return presets.map((preset, index) => ({
    id: `preset-${itemId}-${index + 1}`,
    item_id: itemId,
    ...preset,
  }))
}

// Generate unit_presets for every item
export const seedUnitPresets = seedItems.flatMap(item => {
  return buildUnitPresetsForItem(item.id, item.default_unit_type)
})
