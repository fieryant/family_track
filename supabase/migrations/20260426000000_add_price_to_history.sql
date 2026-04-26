ALTER TABLE shop_list_items ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS price numeric;
