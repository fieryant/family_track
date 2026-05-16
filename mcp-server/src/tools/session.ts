import { z } from 'zod'
import { supabase } from '../supabase.js'
import { getListId, resolveActiveSession } from '../helpers.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

type ToolContent = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }

function ok(data: unknown): ToolContent {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function err(message: string): ToolContent {
  return { content: [{ type: 'text' as const, text: message }], isError: true }
}

export function registerSessionTools(server: McpServer) {
  // get_active_session
  server.tool(
    'get_active_session',
    'Get the current active shopping session with a summary of item status counts.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)
        const sessionId = await resolveActiveSession(listId)

        const { data: session, error: sessErr } = await supabase
          .from('shop_sessions')
          .select('id, list_id, is_active, created_at, completed_at')
          .eq('id', sessionId)
          .single()

        if (sessErr) return err(`Session fetch failed: ${sessErr.message}`)

        // Status counts
        const { data: statusRows, error: countErr } = await supabase
          .from('shop_list_items')
          .select('status')
          .eq('session_id', sessionId)

        if (countErr) return err(`Status count failed: ${countErr.message}`)

        const counts: Record<string, number> = { pending: 0, bought: 0, partial: 0, removed: 0 }
        for (const row of statusRows ?? []) {
          const s = (row as { status: string }).status
          counts[s] = (counts[s] ?? 0) + 1
        }

        return ok({ session, item_counts: counts })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // complete_session
  server.tool(
    'complete_session',
    'Complete the current active session: insert purchase_history rows for bought/partial items, upsert pantry_items, mark session completed, create a new active session, and optionally carry pending items forward.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      carry_pending: z
        .boolean()
        .optional()
        .default(true)
        .describe('Carry pending/partial items into the new session (default true)'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)
        const sessionId = await resolveActiveSession(listId)
        const carryPending = input.carry_pending ?? true

        // Fetch all items from the session
        const { data: items, error: itemsErr } = await supabase
          .from('shop_list_items')
          .select('id, item_id, requested_amount, requested_unit_id, bought_amount, bought_unit_id, status, price, note')
          .eq('session_id', sessionId)

        if (itemsErr) return err(`Failed to fetch session items: ${itemsErr.message}`)

        type SessionItem = {
          id: string
          item_id: string
          requested_amount: number
          requested_unit_id: string | null
          bought_amount: number | null
          bought_unit_id: string | null
          status: string
          price: number | null
          note: string | null
        }

        const sessionItems = (items ?? []) as SessionItem[]

        // Insert purchase_history for bought/partial
        const boughtItems = sessionItems.filter((i) => i.status === 'bought' || i.status === 'partial')

        if (boughtItems.length > 0) {
          const historyRows = boughtItems.map((i) => ({
            session_id: sessionId,
            item_id: i.item_id,
            amount: i.bought_amount ?? i.requested_amount,
            unit_id: i.bought_unit_id ?? i.requested_unit_id,
            price: i.price ?? null,
            note: i.note ?? null,
          }))

          const { error: histErr } = await supabase.from('purchase_history').insert(historyRows)
          if (histErr) return err(`Failed to insert purchase history: ${histErr.message}`)

          // Upsert pantry_items — only when unit matches existing row
          for (const i of boughtItems) {
            const boughtAmt = i.bought_amount ?? i.requested_amount
            const unitId = i.bought_unit_id ?? i.requested_unit_id

            // Check existing pantry row
            const { data: existingPantry } = await supabase
              .from('pantry_items')
              .select('id, amount, unit_id')
              .eq('list_id', listId)
              .eq('item_id', i.item_id)
              .maybeSingle()

            if (existingPantry) {
              const ep = existingPantry as { id: string; amount: number; unit_id: string | null }
              if (ep.unit_id === unitId) {
                // Same unit — add to existing amount
                await supabase
                  .from('pantry_items')
                  .update({ amount: ep.amount + boughtAmt, updated_at: new Date().toISOString() })
                  .eq('id', ep.id)
              }
              // Different unit — skip to avoid data corruption
            } else {
              // No existing pantry row — create one
              const pantryRow: Record<string, unknown> = {
                list_id: listId,
                item_id: i.item_id,
                amount: boughtAmt,
              }
              if (unitId) pantryRow.unit_id = unitId
              await supabase.from('pantry_items').insert(pantryRow)
            }
          }
        }

        // Mark session as complete
        const now = new Date().toISOString()
        const { error: completeErr } = await supabase
          .from('shop_sessions')
          .update({ is_active: false, completed_at: now })
          .eq('id', sessionId)

        if (completeErr) return err(`Failed to complete session: ${completeErr.message}`)

        // Create new session
        const { data: newSession, error: newSessErr } = await supabase
          .from('shop_sessions')
          .insert({ is_active: true, list_id: listId })
          .select('id')
          .single()

        if (newSessErr) return err(`Failed to create new session: ${newSessErr.message}`)
        const newSessionId = (newSession as { id: string }).id

        // Carry pending/partial items
        let carriedCount = 0
        if (carryPending) {
          const toCarry = sessionItems.filter((i) => i.status === 'pending' || i.status === 'partial')

          if (toCarry.length > 0) {
            const carryRows = toCarry.map((i) => {
              let carryAmount = i.requested_amount
              if (i.status === 'partial') {
                carryAmount = Math.max(0, i.requested_amount - (i.bought_amount ?? 0))
              }
              return {
                session_id: newSessionId,
                item_id: i.item_id,
                requested_amount: carryAmount,
                requested_unit_id: i.requested_unit_id,
                status: 'pending',
                note: i.note,
              }
            })

            const { error: carryErr } = await supabase.from('shop_list_items').insert(carryRows)
            if (carryErr) return err(`Failed to carry pending items: ${carryErr.message}`)
            carriedCount = carryRows.length
          }
        }

        return ok({
          success: true,
          completed_session_id: sessionId,
          new_session_id: newSessionId,
          purchase_history_inserted: boughtItems.length,
          pending_items_carried: carriedCount,
        })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )

  // get_purchase_history
  server.tool(
    'get_purchase_history',
    'Get recent purchase history, optionally filtered by item. Returns entries with item name and unit info.',
    {
      list_id: z.string().uuid().optional().describe('Shopping list UUID (uses DEFAULT_LIST_ID if omitted)'),
      limit: z.number().int().min(1).max(200).optional().default(50).describe('Max rows to return'),
      item_id: z.string().uuid().optional().describe('Filter to a specific item UUID'),
    },
    async (input) => {
      try {
        const listId = getListId(input.list_id)
        const limit = input.limit ?? 50

        // Get session IDs for this list first
        const { data: sessions, error: sessErr } = await supabase
          .from('shop_sessions')
          .select('id')
          .eq('list_id', listId)

        if (sessErr) return err(`Failed to fetch sessions: ${sessErr.message}`)

        const sessionIds = ((sessions ?? []) as Array<{ id: string }>).map((s) => s.id)
        if (sessionIds.length === 0) return ok({ count: 0, history: [] })

        let query = supabase
          .from('purchase_history')
          .select(`
            id, session_id, item_id, amount, unit_id, price, note, created_at,
            items(id, name),
            units(id, symbol, label)
          `)
          .in('session_id', sessionIds)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (input.item_id) {
          query = query.eq('item_id', input.item_id)
        }

        const { data, error } = await query
        if (error) return err(`Failed to fetch purchase history: ${error.message}`)

        return ok({ count: (data ?? []).length, history: data ?? [] })
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e))
      }
    },
  )
}
