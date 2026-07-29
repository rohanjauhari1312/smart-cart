# Grocery Agent

Given a request like `"Order groceries: noodles, ramen, dumplings, under $100."`, this pipeline searches real Kroger products, scores them on price, Nutri-Score, and NOVA processing group (via Open Food Facts, with USDA FoodData Central as a fallback), and assembles a budget-fit cart. It's a separate module from the main Nourish app — see `../n8n/migrated/` for how it can eventually be wired in as a chat tool the same way `nutrition agent` and `grocery agent` (the meal-history list version) are.

## Pipeline

`Intent Agent → Discovery Agent → Quality & Nutrition Agent → Budget & Cart-Fit Agent → Cart Agent`

Each stage is a plain function in `src/`, composed in `src/pipeline.js`. Nothing here fabricates data — if an API call fails or returns nothing usable, that candidate or category is skipped and the reason is recorded in the reasoning trail, never guessed.

## Read-only vs. cart-write — read this before wiring up real orders

**Everything in the default pipeline (`runGroceryPipeline`) is read-only.** It searches Kroger's product catalog and computes a cart, but it never touches a real Kroger account or places an order. This uses Kroger's **client-credentials** OAuth grant (`KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET`), which is scoped to `product.compact` only — Kroger's API rejects cart-write calls with this token, by design, not by choice here.

**Writing to an actual cart is a separate, explicit step** (`writeCartToKroger` in `src/cartAgent.js`), and it requires a **user-consented** access token obtained via Kroger's **authorization-code** flow:

1. Redirect the user to `getCartAuthorizationUrl()` (in `src/kroger.js`) — they log in to their own Kroger account and grant `cart.basic:write`.
2. Kroger redirects back to `KROGER_REDIRECT_URI` with a `?code=`.
3. Exchange it with `exchangeCartAuthCode(code)` to get a user-scoped token.
4. Only then can `writeCartToKroger(userAccessToken, cart, modality)` succeed. `modality` is `'PICKUP'` (default) or `'DELIVERY'` — Kroger supports both; pass whichever the user chose. Individual items in `cart` can override the default with their own `item.modality` if a cart is mixed.

This mirrors the existing Google OAuth pattern used elsewhere in Nourish — build the auth URL, redirect, handle the callback separately, never assume consent. No code path in this module calls `writeCartToKroger` automatically. Treat it as a distinct, user-initiated action in any UI or demo — never present a read-only run as "your order has been placed."

## Setup

```bash
cd grocery-agent
npm install
cp .env.example .env
```

Fill in `.env`:

- **`ANTHROPIC_API_KEY`** — same key used elsewhere in Nourish.
- **`KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET`** — register a free app at [developer.kroger.com](https://developer.kroger.com). Instant self-serve signup. This alone is enough for the read-only path.
- **`KROGER_LOCATION_ID`** *(optional)* — a specific store ID (`GET /v1/locations`). Without one, search still works but some candidates may come back without pricing, since Kroger ties prices to a store.
- **`KROGER_REDIRECT_URI`** — only needed if/when you build the cart-write flow. Must match a redirect URI registered on your Kroger app.
- **`USDA_API_KEY`** — free instant signup at [fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html). Used only when Open Food Facts has no Nutri-Score/NOVA for a product.
- **`SUPABASE_URL` / `SUPABASE_KEY`** — same Supabase project as the rest of Nourish. Use a key with insert access (service key), not the frontend anon key.
- **`FREE_DELIVERY_MINIMUM_USD`** — **placeholder**, defaults to `35`. This is not sourced from a real Kroger policy page — confirm the actual threshold before relying on it for a real order, and update it here.

Run the schema once against Supabase before the first real run:

```bash
psql "$SUPABASE_DB_URL" -f schema.sql
# or paste schema.sql into the Supabase SQL editor
```

## Testing

**Read-only path** (safe, no real order, no consent needed):

```bash
npm run test:example
```

Runs the "noodles, ramen, dumplings, under $100" example end to end and prints the cart: per-item price, Nutri-Score, NOVA group, running total vs. budget, free-delivery-minimum status, and the full reasoning trail for every swap the Budget Agent made.

**Cart-write path** (real order — test manually, deliberately, with a real Kroger login):

There's no automated test for this on purpose. To exercise it: call `getCartAuthorizationUrl()`, complete the login/consent in a browser yourself, capture the `code` from the redirect, run `exchangeCartAuthCode(code)`, then call `writeCartToKroger` with a small cart. Do this against your own Kroger account, not in CI.
