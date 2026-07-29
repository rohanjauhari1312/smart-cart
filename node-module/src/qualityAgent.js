import { lookupOpenFoodFacts } from './openFoodFacts.js'
import { lookupUsda } from './usda.js'
import { findDietConflicts } from './dietFlags.js'

/**
 * Enriches each Discovery candidate with quality/nutrition data. Price,
 * Nutri-Score, and NOVA group are kept as separate visible fields — no
 * invented composite "quality score". The Budget Agent decides how to
 * weigh them.
 *
 * @param {{category: string, notes: string, candidates: object[], error: string|null}[]} discoveryResults
 * @param {{diet?: string}} userProfile
 */
export async function runQualityAgent(discoveryResults, userProfile = {}) {
  const enriched = await Promise.all(
    discoveryResults.map(async ({ category, notes, candidates, error }) => {
      if (error) return { category, notes, candidates: [], error }

      const scored = await Promise.all(
        candidates.map(async candidate => {
          const off = await lookupOpenFoodFacts(`${candidate.brand || ''} ${candidate.description}`.trim())

          let usda = null
          const offSparse = off.error || (!off.nutriScore && !off.novaGroup)
          if (offSparse) usda = await lookupUsda(candidate.description)

          const ingredientsText = off.ingredientsText || null
          const dietConflicts = findDietConflicts(ingredientsText, userProfile.diet)

          return {
            ...candidate,
            nutriScore: off.nutriScore ?? null,
            novaGroup: off.novaGroup ?? null,
            ingredientsText,
            offLookupError: off.error || null,
            usdaMacros: usda && !usda.error ? usda : null,
            usdaLookupError: usda?.error || null,
            dietConflicts,
          }
        })
      )

      return { category, notes, candidates: scored, error: null }
    })
  )

  return enriched
}
