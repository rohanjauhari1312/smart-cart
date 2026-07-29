import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// SUPABASE_KEY needs insert access to grocery_sessions/grocery_cart_items —
// use a service key for a backend script like this, not the frontend anon key.
// We only ever do plain inserts here, no realtime subscriptions, but the
// client eagerly constructs a RealtimeClient regardless — on Node <22 that
// needs a WebSocket implementation supplied explicitly (native WebSocket
// only landed in Node 22).
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
  realtime: { transport: WebSocket },
})

/**
 * Persists a shopping session and its cart items (selected and skipped).
 * Run schema.sql once against the project before calling this.
 *
 * @param {string} userId
 * @param {string} requestText original NL request, e.g. "noodles, ramen, dumplings, under $100"
 * @param {ReturnType<typeof import('./budgetAgent.js').runBudgetAgent> extends Promise<infer T> ? T : never} budgetResult
 */
export async function saveGrocerySession(userId, requestText, budgetResult) {
  const { data: session, error: sessionError } = await supabase
    .from('grocery_sessions')
    .insert({
      user_id: userId,
      request_text: requestText,
      budget: budgetResult.budget,
      total: budgetResult.total,
      free_delivery_minimum: budgetResult.freeDeliveryMinimum,
      met_free_delivery_minimum: budgetResult.metFreeDeliveryMinimum,
      reasoning: budgetResult.reasoning,
    })
    .select()
    .single()

  if (sessionError) throw new Error(`Failed to save grocery session: ${sessionError.message}`)

  const rows = budgetResult.selections.map(s => ({
    session_id: session.id,
    category: s.category,
    status: s.item ? 'selected' : 'skipped',
    product_id: s.item?.productId ?? null,
    description: s.item?.description ?? null,
    brand: s.item?.brand ?? null,
    price: s.item?.price ?? null,
    nutri_score: s.item?.nutriScore ?? null,
    nova_group: s.item?.novaGroup ?? null,
    diet_conflicts: s.item?.dietConflicts ?? null,
    skipped_reason: s.skippedReason,
  }))

  const { error: itemsError } = await supabase.from('grocery_cart_items').insert(rows)
  if (itemsError) throw new Error(`Failed to save grocery cart items: ${itemsError.message}`)

  return session.id
}
