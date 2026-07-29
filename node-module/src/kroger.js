const TOKEN_URL = 'https://api.kroger.com/v1/connect/oauth2/token'
const API_BASE = 'https://api.kroger.com/v1'

let cachedToken = null // { value, expiresAt }

/**
 * READ-ONLY. Client-credentials token — scoped to product.compact search only.
 * This token cannot write to a cart, Kroger enforces that at the scope level.
 */
async function getAppToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) return cachedToken.value

  const basic = Buffer.from(`${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: 'grant_type=client_credentials&scope=product.compact',
  })
  if (!res.ok) throw new Error(`Kroger token request failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.value
}

/**
 * READ-ONLY. Searches Kroger products for a category term.
 * Requests more results than needed (`limit`) because Kroger's relevance
 * ranking can shift slightly between calls — over-fetching gives the
 * Quality Agent real alternatives to compare instead of a single guess.
 *
 * @param {string} term e.g. "ramen noodles"
 * @param {{limit?: number}} opts
 */
export async function searchProducts(term, { limit = 10 } = {}) {
  const token = await getAppToken()
  const params = new URLSearchParams({
    'filter.term': term,
    'filter.limit': String(limit),
  })
  if (process.env.KROGER_LOCATION_ID) params.set('filter.locationId', process.env.KROGER_LOCATION_ID)

  const res = await fetch(`${API_BASE}/products?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Kroger product search failed for "${term}": ${res.status} ${await res.text()}`)

  const data = await res.json()
  return (data.data || []).map(p => {
    const item = p.items?.[0]
    return {
      productId: p.productId,
      description: p.description,
      brand: p.brand,
      price: item?.price?.regular ?? null,
      promoPrice: item?.price?.promo ?? null,
      size: item?.size ?? null,
      soldBy: item?.soldBy ?? null,
      hasPrice: item?.price?.regular != null,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────
// CART-WRITE (authorization-code flow). Requires the user to log in to
// their own Kroger account and explicitly grant cart.basic:write. The
// client-credentials token above CANNOT be used here — Kroger rejects it.
// Nothing in this file calls these functions automatically. A cart is only
// ever written after a human completes the consent redirect below.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Step 1 of cart-write: send the user here to log in and grant consent.
 * Mirrors the existing Google OAuth pattern used elsewhere in Nourish —
 * build the URL, redirect the user, handle the callback separately.
 */
export function getCartAuthorizationUrl() {
  const params = new URLSearchParams({
    scope: 'cart.basic:write',
    response_type: 'code',
    client_id: process.env.KROGER_CLIENT_ID,
    redirect_uri: process.env.KROGER_REDIRECT_URI,
  })
  return `${API_BASE}/connect/oauth2/authorize?${params}`
}

/**
 * Step 2: exchange the ?code= from the redirect for a user-scoped token.
 * @param {string} code
 */
export async function exchangeCartAuthCode(code) {
  const basic = Buffer.from(`${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.KROGER_REDIRECT_URI,
    }),
  })
  if (!res.ok) throw new Error(`Kroger cart auth exchange failed: ${res.status} ${await res.text()}`)
  return res.json() // { access_token, refresh_token, expires_in, ... }
}

/**
 * Step 3: actually add items to the user's Kroger cart. Only callable with
 * a user-scoped token from exchangeCartAuthCode, never the app token.
 * @param {string} userAccessToken
 * @param {{upc: string, quantity: number, modality?: 'PICKUP'|'DELIVERY'}[]} items
 * @param {'PICKUP'|'DELIVERY'} defaultModality used for any item that doesn't specify its own
 */
export async function addToCart(userAccessToken, items, defaultModality = 'PICKUP') {
  const res = await fetch(`${API_BASE}/cart/add`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: items.map(i => ({ upc: i.upc, quantity: i.quantity, modality: i.modality || defaultModality })) }),
  })
  if (!res.ok) throw new Error(`Kroger cart write failed: ${res.status} ${await res.text()}`)
  return res.status === 204 ? { ok: true } : res.json()
}
