import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const AI_MODEL = 'google/gemini-2.0-flash-exp:free'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function corsResponse() {
  return new Response(null, { headers: CORS_HEADERS })
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// ── Tool definitions for the AI ───────────────────────────────────────────────

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_items',
      description: 'Search the item catalog by name. Supports English and Bengali. Use this to find an item before adding it.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term in English or Bengali' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_shopping_items',
      description: 'Get all items currently in the shopping list for this session.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_item',
      description: 'Add an item to the shopping list. The item_name must be a catalog item name (search first if unsure).',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string', description: 'Name of the item to add' },
          amount: { type: 'number', description: 'Quantity to add' },
          unit_symbol: { type: 'string', description: 'Unit symbol like kg, g, pcs, L, ml' },
        },
        required: ['item_name', 'amount', 'unit_symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_item_status',
      description: 'Mark an item as bought, partial, removed, or pending. Use item name to identify it.',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string', description: 'Name of the item' },
          status: { type: 'string', enum: ['bought', 'partial', 'removed', 'pending'] },
          bought_amount: { type: 'number', description: 'How much was bought (for bought/partial)' },
          price: { type: 'number', description: 'Price per unit at time of purchase' },
        },
        required: ['item_name', 'status'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'remove_item',
      description: 'Remove an item from the shopping list entirely.',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string' },
        },
        required: ['item_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_pantry',
      description: 'Get the current pantry inventory — what is stocked at home.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_pantry_amount',
      description: 'Update the stock level for an item in the pantry.',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string' },
          amount: { type: 'number' },
          unit_symbol: { type: 'string' },
        },
        required: ['item_name', 'amount', 'unit_symbol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_session_summary',
      description: 'Get a summary of the current shopping session: how many items are pending, bought, etc.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ── Tool execution context ─────────────────────────────────────────────────────

interface ToolContext {
  supabase: ReturnType<typeof createClient>
  listId: string
  sessionId: string | null
}

async function resolveSession(ctx: ToolContext): Promise<string> {
  if (ctx.sessionId) return ctx.sessionId

  const { data } = await ctx.supabase
    .from('shop_sessions')
    .select('id')
    .eq('is_active', true)
    .eq('list_id', ctx.listId)
    .maybeSingle()

  if (data) {
    ctx.sessionId = data.id
    return data.id
  }

  const { data: newSession, error } = await ctx.supabase
    .from('shop_sessions')
    .insert({ is_active: true, list_id: ctx.listId })
    .select('id')
    .single()

  if (error) throw new Error(`Session create failed: ${error.message}`)
  ctx.sessionId = newSession.id
  return newSession.id
}

async function resolveItemByName(ctx: ToolContext, name: string): Promise<string | null> {
  const q = name.toLowerCase().trim()

  const { data: tRows } = await ctx.supabase
    .from('translations')
    .select('entity_id')
    .eq('entity_type', 'item')
    .ilike('value', `%${q}%`)
    .limit(1)

  if (tRows && tRows.length > 0) return tRows[0].entity_id

  const { data: nameRows } = await ctx.supabase
    .from('items')
    .select('id')
    .ilike('name', `%${q}%`)
    .eq('is_active', true)
    .limit(1)

  return nameRows && nameRows.length > 0 ? nameRows[0].id : null
}

async function resolveUnit(ctx: ToolContext, symbolOrLabel: string): Promise<string | null> {
  const { data } = await ctx.supabase
    .from('units')
    .select('id')
    .or(`symbol.ilike.${symbolOrLabel},label.ilike.${symbolOrLabel}`)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

// ── Tool handlers ─────────────────────────────────────────────────────────────

async function handleSearchItems(ctx: ToolContext, args: { query: string }) {
  const q = args.query.toLowerCase().trim()

  const { data: tRows } = await ctx.supabase
    .from('translations')
    .select('entity_id')
    .eq('entity_type', 'item')
    .ilike('value', `%${q}%`)
    .limit(10)

  const { data: nameRows } = await ctx.supabase
    .from('items')
    .select('id')
    .ilike('name', `%${q}%`)
    .eq('is_active', true)
    .limit(10)

  const allIds = [...new Set([
    ...(tRows ?? []).map((r: any) => r.entity_id as string),
    ...(nameRows ?? []).map((r: any) => r.id as string),
  ])].slice(0, 10)

  if (allIds.length === 0) return { found: 0, items: [] }

  const { data: items } = await ctx.supabase
    .from('items')
    .select('id, name, category_id, unit_type_id, translations(locale, value)')
    .in('id', allIds)
    .eq('is_active', true)

  return { found: items?.length ?? 0, items: items ?? [] }
}

async function handleListShoppingItems(ctx: ToolContext) {
  const sessionId = await resolveSession(ctx)

  const { data } = await ctx.supabase
    .from('shop_list_items')
    .select(`
      id, item_id, requested_amount, status, bought_amount, note, price,
      item:items(name, category_id),
      requested_unit:units!requested_unit_id(label, symbol),
      bought_unit:units!bought_unit_id(label, symbol)
    `)
    .eq('session_id', sessionId)
    .order('added_at')

  const summary = { pending: 0, bought: 0, partial: 0, removed: 0 }
  for (const row of data ?? []) {
    summary[row.status as keyof typeof summary] = (summary[row.status as keyof typeof summary] ?? 0) + 1
  }

  return { session_id: sessionId, summary, items: data ?? [] }
}

async function handleAddItem(ctx: ToolContext, args: { item_name: string; amount: number; unit_symbol: string }) {
  const sessionId = await resolveSession(ctx)

  const itemId = await resolveItemByName(ctx, args.item_name)
  if (!itemId) {
    return { success: false, error: `Item "${args.item_name}" not found in catalog. Try searching first.` }
  }

  const unitId = await resolveUnit(ctx, args.unit_symbol)
  if (!unitId) {
    return { success: false, error: `Unit "${args.unit_symbol}" not found. Try: kg, g, pcs, L, ml` }
  }

  const { data: existing } = await ctx.supabase
    .from('shop_list_items')
    .select('id, status')
    .eq('session_id', sessionId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (existing && existing.status !== 'removed') {
    return { success: false, already_exists: true, id: existing.id }
  }

  const { data, error } = await ctx.supabase
    .from('shop_list_items')
    .insert({ session_id: sessionId, item_id: itemId, requested_amount: args.amount, requested_unit_id: unitId })
    .select('id, item_id, requested_amount, status')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, item: data }
}

async function handleUpdateItemStatus(
  ctx: ToolContext,
  args: { item_name: string; status: string; bought_amount?: number; price?: number },
) {
  const sessionId = await resolveSession(ctx)
  const itemId = await resolveItemByName(ctx, args.item_name)
  if (!itemId) return { success: false, error: `Item "${args.item_name}" not found` }

  const { data: row } = await ctx.supabase
    .from('shop_list_items')
    .select('id')
    .eq('session_id', sessionId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (!row) return { success: false, error: `"${args.item_name}" is not in the current shopping list` }

  const patch: Record<string, unknown> = { status: args.status }
  if (args.bought_amount != null) patch.bought_amount = args.bought_amount
  if (args.price != null) patch.price = args.price

  const { error } = await ctx.supabase.from('shop_list_items').update(patch).eq('id', row.id)
  if (error) return { success: false, error: error.message }
  return { success: true, updated: args.item_name, status: args.status }
}

async function handleRemoveItem(ctx: ToolContext, args: { item_name: string }) {
  const sessionId = await resolveSession(ctx)
  const itemId = await resolveItemByName(ctx, args.item_name)
  if (!itemId) return { success: false, error: `Item "${args.item_name}" not found` }

  const { error } = await ctx.supabase
    .from('shop_list_items')
    .delete()
    .eq('session_id', sessionId)
    .eq('item_id', itemId)

  if (error) return { success: false, error: error.message }
  return { success: true, removed: args.item_name }
}

async function handleGetPantry(ctx: ToolContext) {
  const { data } = await ctx.supabase
    .from('pantry_items')
    .select(`
      id, item_id, amount, unit_id, updated_at,
      item:items(name),
      unit:units(label, symbol)
    `)
    .eq('list_id', ctx.listId)
    .order('updated_at', { ascending: false })

  return { count: data?.length ?? 0, items: data ?? [] }
}

async function handleSetPantryAmount(
  ctx: ToolContext,
  args: { item_name: string; amount: number; unit_symbol: string },
) {
  const itemId = await resolveItemByName(ctx, args.item_name)
  if (!itemId) return { success: false, error: `Item "${args.item_name}" not found` }

  const unitId = await resolveUnit(ctx, args.unit_symbol)
  if (!unitId) return { success: false, error: `Unit "${args.unit_symbol}" not recognized` }

  if (args.amount <= 0) {
    await ctx.supabase.from('pantry_items').delete().eq('list_id', ctx.listId).eq('item_id', itemId)
    return { success: true, deleted: true }
  }

  const { error } = await ctx.supabase
    .from('pantry_items')
    .upsert({ list_id: ctx.listId, item_id: itemId, amount: args.amount, unit_id: unitId }, {
      onConflict: 'list_id,item_id',
    })

  if (error) return { success: false, error: error.message }
  return { success: true, item: args.item_name, amount: args.amount, unit: args.unit_symbol }
}

async function handleGetSessionSummary(ctx: ToolContext) {
  const sessionId = await resolveSession(ctx)

  const { data } = await ctx.supabase
    .from('shop_list_items')
    .select('status')
    .eq('session_id', sessionId)

  const counts: Record<string, number> = { pending: 0, bought: 0, partial: 0, removed: 0 }
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
  }

  return { session_id: sessionId, ...counts, total: data?.length ?? 0 }
}

async function executeTool(ctx: ToolContext, name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_items': return handleSearchItems(ctx, args as any)
    case 'list_shopping_items': return handleListShoppingItems(ctx)
    case 'add_item': return handleAddItem(ctx, args as any)
    case 'update_item_status': return handleUpdateItemStatus(ctx, args as any)
    case 'remove_item': return handleRemoveItem(ctx, args as any)
    case 'get_pantry': return handleGetPantry(ctx)
    case 'set_pantry_amount': return handleSetPantryAmount(ctx, args as any)
    case 'get_session_summary': return handleGetSessionSummary(ctx)
    default: return { error: `Unknown tool: ${name}` }
  }
}

// ── Agentic loop ──────────────────────────────────────────────────────────────

interface Message {
  role: string
  content: string | null
  tool_calls?: unknown[]
  tool_call_id?: string
  name?: string
}

async function runAgent(text: string, ctx: ToolContext, locale: string) {
  const systemPrompt = `You are a helpful family shopping assistant embedded in the family_track app.
The user is speaking to you (voice input), so keep responses short and conversational — they will be read aloud.
Current list ID: ${ctx.listId}
Language: ${locale === 'bn' ? 'Bengali/Bangla' : 'English'}
Respond in the same language the user is speaking.
When performing actions, confirm what you did concisely. For example: "Done! Added 2 kg rice to your list."
If something fails, explain briefly and suggest an alternative.`

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ]

  const actionsTaken: string[] = []
  const MAX_ROUNDS = 5

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://family-track.app',
        'X-Title': 'Family Track',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenRouter error: ${err}`)
    }

    const result = await response.json()
    const choice = result.choices?.[0]
    if (!choice) throw new Error('No response from AI')

    const assistantMsg = choice.message
    messages.push(assistantMsg)

    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      return {
        response_text: assistantMsg.content ?? '',
        actions_taken: actionsTaken,
      }
    }

    for (const toolCall of assistantMsg.tool_calls) {
      const fnName = toolCall.function.name
      const fnArgs = JSON.parse(toolCall.function.arguments ?? '{}')

      const toolResult = await executeTool(ctx, fnName, fnArgs)
      actionsTaken.push(`${fnName}(${JSON.stringify(fnArgs)})`)

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: fnName,
        content: JSON.stringify(toolResult),
      })
    }
  }

  return {
    response_text: 'I completed your request.',
    actions_taken: actionsTaken,
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const body = await req.json()
    const { text, list_id, locale = 'en' } = body

    if (!text || !list_id) {
      return jsonResponse({ error: 'text and list_id are required' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data: member } = await serviceClient
      .from('list_members')
      .select('role')
      .eq('list_id', list_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) return jsonResponse({ error: 'Not a member of this list' }, 403)

    const ctx: ToolContext = { supabase: serviceClient, listId: list_id, sessionId: null }
    const result = await runAgent(text, ctx, locale)

    return jsonResponse(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, 500)
  }
})
