-- Replace text unit columns with uuid FKs referencing units table
-- Applies to: unit_presets, shop_list_items, purchase_history

-- unit_presets
ALTER TABLE public.unit_presets
  DROP COLUMN IF EXISTS unit,
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

-- shop_list_items
ALTER TABLE public.shop_list_items
  DROP COLUMN IF EXISTS requested_unit,
  ADD COLUMN IF NOT EXISTS requested_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

ALTER TABLE public.shop_list_items
  DROP COLUMN IF EXISTS bought_unit,
  ADD COLUMN IF NOT EXISTS bought_unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;

-- purchase_history
ALTER TABLE public.purchase_history
  DROP COLUMN IF EXISTS unit,
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL;
