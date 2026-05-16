import { z } from 'zod'
import { supabase } from '../supabase.js'
import { getListId, resolveActiveSession, searchItemsByName, resolveUnit } from '../helpers.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

type ToolContent = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }

function ok(data: unknown): ToolContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string): ToolContent {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

const statusEnum = z.enum(['pending', 'bought', 'partial', 'removed'])

export function registerShoppingTools(server: McpServer) {
  // list_shopping_items
  server.tool(
    'list_shopping_items',
    'Get all items in the current active shopping session, optionally filtered by status. Results are grouped by category.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      status_filter: z
        .array(statusEnum)
        .optional()
        .describe('Only return items with these statuses'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)
        const sessionId = await resolveActiveSession(listId)

        let query = supabase
          .from('shop_list_items')
          .select(`
            id, session_id, item_id, requested_amount, requested_unit_id,
            bought_amount, bought_unit_id, status, note, price,
            items(id, name, category_id, categories(id, name, sort_order)),
            requested_unit:units!shop_list_items_requested_unit_id_fkey(id, symbol, label),
            bought_unit:units!shop_list_items_bought_unit_id_fkey(id, symbol, label)
          `)
          .eq('session_id', sessionId)

        if (input.status_filter && input.status_filter.length > 0) {
          query = query.in('status', input.status_filter)
        }

        const { data, error } = await query
        if (error) return err(`Failed to fetch shopping items: ${error.message}`)

        // Group by category
        const grouped: Record<string, { category: unknown; items: unknown[] }> = {}
        for (const row of data ?? []) {
          const item = (row.items as unknown) as { id: string; name: string; category_id: string | null; categories: { id: string; name: string; sort_order: number } | null } | null
          const catId = item?.categories?.id ?? 'uncategorized'
          const catName = item?.categories?.name ?? 'Uncategorized'
          if (!grouped[catId]) {
            grouped[catId] = {
              category: { id: catId, name: catName, sort_order: item?.categories?.sort_order ?? 999 },
              items: [],
            }
          }
          grouped[catId].items.push(row)
        }

        const result = Object.values(grouped).sort(
          (a, b) =>
            ((a.category as { sort_order: number }).sort_order ?? 999) -
            ((b.category as { sort_order: number }).sort_order ?? 999),
        )

        return ok({ session_id: sessionId, list_id: listId, grouped_by_category: result })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // add_item_to_shopping_list
  server.tool(
    'add_item_to_shopping_list',
    'Add an item to the active shopping session. Resolve item by id or by searching the name. Resolves unit by id or symbol.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      item_id: z.string().uuid().optional().describe('Item UUID (takes precedence over item_name)'),
      item_name: z.string().optional().describe('Item name to search for if item_id is not provided'),
      amount: z.number().positive().describe('Requested amount'),
      unit_id: z.string().uuid().optional().describe('Unit UUID'),
      unit_symbol: z.string().optional().describe('Unit symbol/label (e.g. "kg", "litre") if unit_id not known'),
      note: z.string().optional().describe('Optional note for this item'),
      create_if_missing: z
        .boolean()
        .optional()
        .default(false)
        .describe('Create a new item if not found by name search'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)
        const sessionId = await resolveActiveSession(listId)

        // Resolve item
        let itemId = input.item_id
        if (!itemId) {
          if (!input.item_name) return err('Either item_id or item_name is required')
          const results = await searchItemsByName(input.item_name, 1)
          if (results.length > 0) {
            itemId = (results[0] as { id: string }).id
          } else if (input.create_if_missing) {
            const { data: newItem, error: createErr } = await supabase
              .from('items')
              .insert({ name: input.item_name, is_active: true })
              .select('id')
              .single()
            if (createErr) return err(`Failed to create item: ${createErr.message}`)
            itemId = (newItem as { id: string }).id
          } else {
            return err(`Item not found: "${input.item_name}". Set create_if_missing=true to create it.`)
          }
        }

        // Resolve unit
        let unitId = input.unit_id
        if (!unitId && input.unit_symbol) {
          const unit = await resolveUnit(input.unit_symbol)
          if (!unit) return err(`Unit not found: "${input.unit_symbol}"`)
          unitId = unit.id
        }

        // Check for existing non-removed entry
        const { data: existing } = await supabase
          .from('shop_list_items')
          .select('id, status')
          .eq('session_id', sessionId)
          .eq('item_id', itemId)
          .neq('status', 'removed')
          .maybeSingle()

        if (existing) {
          return err(
            `Item already in list (shop_list_item_id: ${(existing as { id: string }).id}, status: ${(existing as { status: string }).status}). Use update_shopping_item_quantity to change amount.`,
          )
        }

        const insertRow: Record<string, unknown> = {
          session_id: sessionId,
          item_id: itemId,
          requested_amount: input.amount,
          status: 'pending',
        }
        if (unitId) insertRow.requested_unit_id = unitId
        if (input.note) insertRow.note = input.note

        const { data: inserted, error: insertErr } = await supabase
          .from('shop_list_items')
          .insert(insertRow)
          .select('id, item_id, requested_amount, requested_unit_id, status, note')
          .single()

        if (insertErr) return err(`Failed to add item: ${insertErr.message}`)
        return ok({ success: true, shop_list_item: inserted })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // update_shopping_item_status
  server.tool(
    'update_shopping_item_status',
    'Update the status of a shopping list item (pending, bought, partial, removed). Optionally record bought amount, unit, and price.',
    {
      shop_list_item_id: z.string().uuid().describe('UUID of the shop_list_items row'),
      status: statusEnum.describe('New status'),
      bought_amount: z.number().positive().optional().describe('Amount actually purchased'),
      bought_unit_id: z.string().uuid().optional().describe('Unit UUID for bought amount'),
      bought_unit_symbol: z.string().optional().describe('Unit symbol/label if bought_unit_id is unknown'),
      price: z.number().nonnegative().optional().describe('Per-unit price at time of purchase'),
      note: z.string().optional().describe('Optional note'),
    },
    async (input) => {
      try {
        const updates: Record<string, unknown> = { status: input.status }

        if (input.bought_amount !== undefined) updates.bought_amount = input.bought_amount
        if (input.note !== undefined) updates.note = input.note
        if (input.price !== undefined) updates.price = input.price

        let boughtUnitId = input.bought_unit_id
        if (!boughtUnitId && input.bought_unit_symbol) {
          const unit = await resolveUnit(input.bought_unit_symbol)
          if (!unit) return err(`Unit not found: "${input.bought_unit_symbol}"`)
          boughtUnitId = unit.id
        }
        if (boughtUnitId) updates.bought_unit_id = boughtUnitId

        const { data, error } = await supabase
          .from('shop_list_items')
          .update(updates)
          .eq('id', input.shop_list_item_id)
          .select()
          .single()

        if (error) return err(`Update failed: ${error.message}`)
        return ok({ success: true, shop_list_item: data })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // update_shopping_item_quantity
  server.tool(
    'update_shopping_item_quantity',
    'Update the requested amount (and optionally unit) for a pending shopping list item.',
    {
      shop_list_item_id: z.string().uuid().describe('UUID of the shop_list_items row'),
      amount: z.number().positive().describe('New requested amount'),
      unit_id: z.string().uuid().optional().describe('New unit UUID'),
      unit_symbol: z.string().optional().describe('Unit symbol/label if unit_id is unknown'),
    },
    async (input) => {
      try {
        const updates: Record<string, unknown> = { requested_amount: input.amount }

        let unitId = input.unit_id
        if (!unitId && input.unit_symbol) {
          const unit = await resolveUnit(input.unit_symbol)
          if (!unit) return err(`Unit not found: "${input.unit_symbol}"`)
          unitId = unit.id
        }
        if (unitId) updates.requested_unit_id = unitId

        const { data, error } = await supabase
          .from('shop_list_items')
          .update(updates)
          .eq('id', input.shop_list_item_id)
          .select()
          .single()

        if (error) return err(`Update failed: ${error.message}`)
        return ok({ success: true, shop_list_item: data })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // remove_shopping_item
  server.tool(
    'remove_shopping_item',
    'Hard-delete an item from the shopping list.',
    {
      shop_list_item_id: z.string().uuid().describe('UUID of the shop_list_items row to delete'),
    },
    async (input) => {
      try {
        const { error } = await supabase
          .from('shop_list_items')
          .delete()
          .eq('id', input.shop_list_item_id)

        if (error) return err(`Delete failed: ${error.message}`)
        return ok({ success: true, deleted_id: input.shop_list_item_id })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )
}
