# Grocer Agent

A multi-agent grocery ordering system: parse a request, search real Kroger products, score them on nutrition/diet-safety, present personalized ranked suggestions, let the user pick, and write the pick to both Supabase and the user's real Kroger cart. A learning agent updates preferences after every order.

**Live and working**, deployed on n8n Cloud (self-hosted on Railway): `https://n8n-production-31ef.up.railway.app`

## What's in this folder

- **`n8n-workflows/`** — the 8 workflows currently running in production, one JSON file per agent. This is the actual live implementation, importable into n8n as-is.
- **`node-module/`** — an earlier standalone Node.js version of the same pipeline (Anthropic SDK direct, no n8n). Not currently deployed, kept for reference/comparison. Has its own README.

## Architecture

```
Order request
  → Intent Agent (parse into categories + budget)
  → Discovery Agent (search Kroger, real prices — runs in parallel per category)
  → Quality Agent (Nutri-Score, NOVA, diet-safety judgment)
  → [precompute utility scores from learned preferences]
  → Suggestion Agent (returns 2-3 ranked options PER category, does not auto-decide)
  → [user picks one option per category]
  → Selection Handler → Cart Agent (writes Supabase + REAL Kroger cart)
  → Preference Learning Agent (fire-and-forget, updates learned preferences for next time)
```

## Two webhook endpoints to call

**1. Get suggestions** — `POST https://n8n-production-31ef.up.railway.app/webhook/1b147e97-bf8a-4168-a599-3ef86bf0b7e0`

```json
{ "request": "Order groceries: ramen, dumplings, under $40.", "userId": "test-user-123", "diet": "veg" }
```

Returns `{ suggestions: [{category, options: [...], reasoning}], estimatedTotalIfTopPickEverywhere, budget, overBudgetWarning, usedPreferences }`.

**2. Submit selection** — `POST https://n8n-production-31ef.up.railway.app/webhook/f6f6f4c0-1ba0-4316-98b4-39cfa9f969ec`

```json
{
  "userId": "test-user-123",
  "requestText": "original request text",
  "budget": 40,
  "suggestions": [ /* echo back exactly what step 1 returned */ ],
  "picks": [ { "category": "ramen", "productId": "0004178900211" } ]
}
```

Writes to Supabase + the user's real Kroger cart. Returns `{ sessionId, cart, total, krogerCartUpdated, summary }`.

Diet values: `veg`, `nonveg`, `vegan`, `eggetarian`, `pescatarian`, `keto`.

## Known constraints (be honest about these in any UI copy)

- **Kroger only** — no other grocery retailer has a free, self-serve API for both search and cart. Confirmed after checking Walmart, Target, Costco, Instacart, Amazon, eBay, and others.
- **Real orders go to a real Kroger cart** — the second endpoint is not a simulation, it adds items to whoever's Kroger account is OAuth-connected in n8n. Don't wire a UI to call it without the user understanding that.
- Kroger only operates in certain US markets (not New England, for example) — the demo currently uses a Cincinnati store (`locationId: 01400513`), hardcoded in the Discovery Agent workflow.
- `FREE_DELIVERY_MINIMUM` ($35) is a placeholder, not sourced from a real Kroger policy.
- A 7-category order takes ~60-250s end to end depending on how many candidates per category. Design the UI with that latency in mind (loading state, not a spinner that looks broken).

## For whoever picks this up next

The n8n instance is the source of truth. If you edit a workflow in the n8n UI, re-export it and overwrite the matching file in `n8n-workflows/` so this folder stays in sync, it drifted out of sync once already this project and caused confusion.
