import { z } from 'zod'
import { supabase } from '../supabase.js'
import { searchItemsByName } from '../helpers.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

type ToolContent = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }

function ok(data: unknown): ToolContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string): ToolContent {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

export function registerCatalogTools(server: McpServer) {
  // search_items
  server.tool(
    'search_items',
    'Search the item catalog by name (supports both English and Bengali). Returns matching items with translations and unit presets.',
    {
      query: z.string().describe('Search term (English or Bengali)'),
      limit: z.number().int().min(1).max(50).optional().default(10).describe('Max results to return'),
    },
    async (input) => {
      try {
        const items = await searchItemsByName(input.query, input.limit ?? 10)
        return ok({ count: items.length, items })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // get_categories
  server.tool(
    'get_categories',
    'List all product categories ordered by sort_order.',
    {},
    async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, icon, sort_order, translations(locale, field, value)')
          .order('sort_order')

        if (error) return err(`Failed to fetch categories: ${error.message}`)
        return ok({ count: (data ?? []).length, categories: data ?? [] })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // get_units
  server.tool(
    'get_units',
    'List all units of measurement. Optionally filter by unit_type_id.',
    {
      unit_type_id: z.string().uuid().optional().describe('Filter units to a specific unit type'),
    },
    async (input) => {
      try {
        let query = supabase
          .from('units')
          .select('id, symbol, label, unit_type_id, sort_order, unit_types(name)')
          .order('sort_order')

        if (input.unit_type_id) {
          query = query.eq('unit_type_id', input.unit_type_id)
        }

        const { data, error } = await query
        if (error) return err(`Failed to fetch units: ${error.message}`)
        return ok({ count: (data ?? []).length, units: data ?? [] })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // get_item_detail
  server.tool(
    'get_item_detail',
    'Get full detail for a single item including translations, unit presets, and category.',
    {
      item_id: z.string().uuid().describe('UUID of the item'),
    },
    async (input) => {
      try {
        const { data, error } = await supabase
          .from('items')
          .select(`
            id, name, category_id, unit_type_id, is_active, sort_order,
            categories(id, name),
            unit_types(id, name),
            translations(locale, field, value),
            unit_presets(id, label, amount, unit_id, sort_order, units(symbol, label))
          `)
          .eq('id', input.item_id)
          .maybeSingle()

        if (error) return err(`Item lookup failed: ${error.message}`)
        if (!data) return err(`Item not found: ${input.item_id}`)
        return ok(data)
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )
}
