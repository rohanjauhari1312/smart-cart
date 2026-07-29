import { runIntentAgent } from './intentAgent.js'
import { runDiscoveryAgent } from './discoveryAgent.js'
import { runQualityAgent } from './qualityAgent.js'
import { runBudgetAgent } from './budgetAgent.js'
import { assembleCart } from './cartAgent.js'

/**
 * Runs the full read-only pipeline: Intent -> Discovery -> Quality ->
 * Budget -> Cart. Does not write to a real Kroger cart — see cartAgent.js
 * for the separate, consent-gated write step.
 *
 * @param {string} requestText e.g. "Order groceries: noodles, ramen, dumplings, under $100."
 * @param {{userId: string, diet?: string}} user
 */
export async function runGroceryPipeline(requestText, user) {
  const intent = await runIntentAgent(requestText)
  const discovery = await runDiscoveryAgent(intent.categories)
  const quality = await runQualityAgent(discovery, user)
  const budget = await runBudgetAgent(quality, intent.budget)
  const result = await assembleCart(user.userId, requestText, budget)
  return result
}
