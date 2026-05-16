import { z } from 'zod'
import { supabase } from '../supabase.js'
import { getListId, resolveUnit } from '../helpers.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

type ToolContent = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }

function ok(data: unknown): ToolContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string): ToolContent {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

export function registerPantryTools(server: McpServer) {
  // get_pantry
  server.tool(
    'get_pantry',
    'Get the full home pantry inventory. Optionally filter for low-stock items below a threshold.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      low_stock_threshold: z
        .number()
        .nonnegative()
        .optional()
        .describe('If set, only return items with amount <= this value'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)

        let query = supabase
          .from('pantry_items')
          .select(`
            id, list_id, item_id, amount, unit_id, updated_at,
            items(id, name, category_id, categories(id, name, sort_order)),
            units(id, symbol, label)
          `)
          .eq('list_id', listId)
          .order('updated_at', { ascending: false })

        if (input.low_stock_threshold !== undefined) {
          query = query.lte('amount', input.low_stock_threshold)
        }

        const { data, error } = await query
        if (error) return err(`Failed to fetch pantry: ${error.message}`)

        return ok({ count: (data ?? []).length, pantry: data ?? [] })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // set_pantry_amount
  server.tool(
    'set_pantry_amount',
    'Set the pantry amount for an item (upsert). If amount <= 0, the pantry row is deleted.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      item_id: z.string().uuid().describe('Item UUID'),
      amount: z.number().describe('New amount (use 0 or negative to remove)'),
      unit_id: z.string().uuid().optional().describe('Unit UUID'),
      unit_symbol: z.string().optional().describe('Unit symbol/label if unit_id is unknown'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)

        if (input.amount <= 0) {
          const { error } = await supabase
            .from('pantry_items')
            .delete()
            .eq('list_id', listId)
            .eq('item_id', input.item_id)

          if (error) return err(`Failed to remove pantry item: ${error.message}`)
          return ok({ success: true, action: 'deleted', item_id: input.item_id })
        }

        let unitId = input.unit_id
        if (!unitId && input.unit_symbol) {
          const unit = await resolveUnit(input.unit_symbol)
          if (!unit) return err(`Unit not found: "${input.unit_symbol}"`)
          unitId = unit.id
        }

        const upsertRow: Record<string, unknown> = {
          list_id: listId,
          item_id: input.item_id,
          amount: input.amount,
          updated_at: new Date().toISOString(),
        }
        if (unitId) upsertRow.unit_id = unitId

        const { data, error } = await supabase
          .from('pantry_items')
          .upsert(upsertRow, { onConflict: 'list_id,item_id' })
          .select()
          .single()

        if (error) return err(`Failed to upsert pantry item: ${error.message}`)
        return ok({ success: true, action: 'upserted', pantry_item: data })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // adjust_pantry_amount
  server.tool(
    'adjust_pantry_amount',
    'Add or subtract from the current pantry amount for an item. Clamps to 0 (never negative). Deletes the row if result is 0.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      item_id: z.string().uuid().describe('Item UUID'),
      delta: z.number().describe('Amount to add (positive) or subtract (negative)'),
      unit_id_if_new: z
        .string()
        .uuid()
        .optional()
        .describe('Unit UUID to use if creating a new pantry row'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)

        // Fetch current
        const { data: existing, error: fetchErr } = await supabase
          .from('pantry_items')
          .select('id, amount, unit_id')
          .eq('list_id', listId)
          .eq('item_id', input.item_id)
          .maybeSingle()

        if (fetchErr) return err(`Failed to fetch pantry item: ${fetchErr.message}`)

        const current = existing as { id: string; amount: number; unit_id: string | null } | null
        const currentAmount = current?.amount ?? 0
        const newAmount = Math.max(0, currentAmount + input.delta)

        if (newAmount === 0) {
          if (current) {
            const { error } = await supabase.from('pantry_items').delete().eq('id', current.id)
            if (error) return err(`Failed to delete pantry item: ${error.message}`)
          }
          return ok({ success: true, action: 'deleted', item_id: input.item_id, new_amount: 0 })
        }

        const upsertRow: Record<string, unknown> = {
          list_id: listId,
          item_id: input.item_id,
          amount: newAmount,
          updated_at: new Date().toISOString(),
        }
        const unitId = current?.unit_id ?? input.unit_id_if_new
        if (unitId) upsertRow.unit_id = unitId

        const { data, error } = await supabase
          .from('pantry_items')
          .upsert(upsertRow, { onConflict: 'list_id,item_id' })
          .select()
          .single()

        if (error) return err(`Failed to update pantry item: ${error.message}`)
        return ok({
          success: true,
          action: current ? 'updated' : 'created',
          previous_amount: currentAmount,
          new_amount: newAmount,
          pantry_item: data,
        })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // remove_pantry_item
  server.tool(
    'remove_pantry_item',
    'Remove an item entirely from the pantry inventory.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      item_id: z.string().uuid().describe('Item UUID to remove from pantry'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)

        const { error } = await supabase
          .from('pantry_items')
          .delete()
          .eq('list_id', listId)
          .eq('item_id', input.item_id)

        if (error) return err(`Failed to remove pantry item: ${error.message}`)
        return ok({ success: true, deleted: true, list_id: listId, item_id: input.item_id })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )
}
