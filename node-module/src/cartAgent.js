import { saveGrocerySession } from './supabaseStore.js'
import { addToCart } from './kroger.js'

/**
 * READ-ONLY PATH. Assembles the final cart from the Budget Agent's
 * selections and persists it to Supabase. Does not touch a real Kroger
 * cart — that's a separate, consent-gated step below.
 */
export async function assembleCart(userId, requestText, budgetResult) {
  const sessionId = await saveGrocerySession(userId, requestText, budgetResult)

  const cart = budgetResult.selections
    .filter(s => s.item)
    .map(s => ({
      category: s.category,
      description: s.item.description,
      brand: s.item.brand,
      price: s.item.price,
      nutriScore: s.item.nutriScore,
      novaGroup: s.item.novaGroup,
      productId: s.item.productId,
    }))

  const skipped = budgetResult.selections
    .filter(s => !s.item)
    .map(s => ({ category: s.category, reason: s.skippedReason }))

  return {
    sessionId,
    cart,
    skipped,
    total: budgetResult.total,
    budget: budgetResult.budget,
    freeDeliveryMinimum: budgetResult.freeDeliveryMinimum,
    metFreeDeliveryMinimum: budgetResult.metFreeDeliveryMinimum,
    reasoning: budgetResult.reasoning,
  }
}

/**
 * CART-WRITE PATH — requires user consent (see kroger.js: getCartAuthorizationUrl
 * / exchangeCartAuthCode). This function is never called by assembleCart or
 * anywhere else automatically. A caller must have already run the user
 * through the Kroger login/consent redirect and hold a real userAccessToken.
 *
 * Kroger's cart API takes UPCs, not the productId Kroger's search returns —
 * in practice you'd re-fetch product detail by productId to get the UPC
 * before calling this. Left as a TODO since it depends on which candidate
 * data Kroger's detail endpoint actually returns for your account tier.
 */
export async function writeCartToKroger(userAccessToken, cart, modality = 'PICKUP') {
  if (!userAccessToken) {
    throw new Error('writeCartToKroger requires a user-consented access token — see getCartAuthorizationUrl() in kroger.js. Refusing to guess or proceed without it.')
  }
  if (modality !== 'PICKUP' && modality !== 'DELIVERY') {
    throw new Error(`modality must be 'PICKUP' or 'DELIVERY', got '${modality}'`)
  }
  const items = cart.map(item => ({ upc: item.upc, quantity: item.quantity || 1, modality: item.modality }))
  return addToCart(userAccessToken, items, modality)
}
