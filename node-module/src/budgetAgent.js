import { searchProducts } from './kroger.js'

const NUTRISCORE_RANK = { A: 5, B: 4, C: 3, D: 2, E: 1 }

// PLACEHOLDER — confirm against the actual retailer's real free-delivery
// policy before relying on this for a real order. Overridable via env.
const DEFAULT_FREE_DELIVERY_MINIMUM = Number(process.env.FREE_DELIVERY_MINIMUM_USD || 35)

/**
 * Internal-only heuristic used to compare candidates within a category.
 * Not shown to the user as a fused "quality score" — price, Nutri-Score,
 * and NOVA group stay separate fields on the final cart item.
 */
function qualityRank(candidate) {
  const nutri = candidate.nutriScore ? (NUTRISCORE_RANK[candidate.nutriScore] || 0) : 0
  const nova = candidate.novaGroup ? (5 - candidate.novaGroup) : 0 // NOVA 1 (unprocessed) -> 4, NOVA 4 (ultra-processed) -> 1
  return nutri + nova
}

function eligible(candidates) {
  return candidates.filter(c => c.hasPrice && c.price > 0 && c.dietConflicts.length === 0)
}

function bestByQuality(candidates) {
  return [...candidates].sort((a, b) => qualityRank(b) - qualityRank(a) || a.price - b.price)[0]
}

function cheapest(candidates) {
  return [...candidates].sort((a, b) => a.price - b.price)[0]
}

/**
 * Picks a cart, fits it to budget, and checks it against the free-delivery
 * minimum — upgrading or (if nothing affordable) flagging the gap rather
 * than fabricating a filler product. Every swap is logged in `reasoning`.
 *
 * @param {{category: string, notes: string, candidates: object[], error: string|null}[]} qualityResults
 * @param {number|null} budget
 */
export async function runBudgetAgent(qualityResults, budget) {
  const reasoning = []
  const selections = [] // { category, notes, item: candidate|null, skippedReason: string|null }

  for (const { category, notes, candidates, error } of qualityResults) {
    if (error) {
      selections.push({ category, notes, item: null, skippedReason: error })
      reasoning.push(`Skipped "${category}": ${error}`)
      continue
    }
    const usable = eligible(candidates)
    if (usable.length === 0) {
      const reason = candidates.length === 0
        ? 'no candidates found'
        : 'all candidates were either unpriced or conflicted with the diet profile'
      selections.push({ category, notes, item: null, skippedReason: reason })
      reasoning.push(`Skipped "${category}": ${reason}`)
      continue
    }
    const pick = bestByQuality(usable)
    selections.push({ category, notes, item: pick, skippedReason: null, allEligible: usable })
    reasoning.push(
      `"${category}": picked "${pick.description}" ($${pick.price.toFixed(2)}, Nutri-Score ${pick.nutriScore ?? 'unknown'}, NOVA ${pick.novaGroup ?? 'unknown'}) as the best-quality priced, diet-safe option.`
    )
  }

  let total = () => selections.reduce((sum, s) => sum + (s.item?.price || 0), 0)

  // Over budget: downgrade the lowest quality-per-dollar item first.
  if (budget != null) {
    while (total() > budget) {
      const withItems = selections.filter(s => s.item)
      if (withItems.length === 0) break

      const worst = withItems
        .map(s => ({ s, valuePerDollar: qualityRank(s.item) / s.item.price }))
        .sort((a, b) => a.valuePerDollar - b.valuePerDollar)[0]

      const cheaperOptions = worst.s.allEligible.filter(c => c.price < worst.s.item.price)
      if (cheaperOptions.length === 0) {
        reasoning.push(`Over budget, but "${worst.s.category}" has no cheaper diet-safe alternative — leaving as is and flagging.`)
        break
      }
      const downgrade = cheapest(cheaperOptions)
      reasoning.push(
        `Over budget ($${total().toFixed(2)} > $${budget}): downgraded "${worst.s.category}" from "${worst.s.item.description}" ($${worst.s.item.price.toFixed(2)}) to "${downgrade.description}" ($${downgrade.price.toFixed(2)}), lowest quality-per-dollar item.`
      )
      worst.s.item = downgrade
    }
  }

  // Under free-delivery minimum and under budget: try to upgrade before adding a filler.
  const freeDeliveryMinimum = DEFAULT_FREE_DELIVERY_MINIMUM
  if (budget == null || total() <= budget) {
    while (total() < freeDeliveryMinimum && (budget == null || total() < budget)) {
      const headroom = budget != null ? budget - total() : Infinity
      const upgrade = selections
        .filter(s => s.item)
        .map(s => {
          const better = s.allEligible
            .filter(c => qualityRank(c) > qualityRank(s.item) && c.price - s.item.price <= headroom)
            .sort((a, b) => qualityRank(b) - qualityRank(a))[0]
          return better ? { s, better } : null
        })
        .filter(Boolean)[0]

      if (upgrade) {
        reasoning.push(
          `Under the $${freeDeliveryMinimum} free-delivery minimum with budget to spare: upgraded "${upgrade.s.category}" from "${upgrade.s.item.description}" to "${upgrade.better.description}" (better Nutri-Score/NOVA).`
        )
        upgrade.s.item = upgrade.better
        continue
      }

      // No upgrade fits — try one sensible filler search rather than inventing an item.
      let filler = null
      try {
        const candidates = await searchProducts('pantry staples', { limit: 5 })
        filler = eligible(
          candidates.map(c => ({ ...c, novaGroup: null, nutriScore: null, dietConflicts: [] }))
        ).find(c => c.price <= headroom) || null
      } catch (err) {
        reasoning.push(`Tried to find a filler item to clear the free-delivery minimum, but the search failed: ${err.message}`)
        break
      }

      if (filler) {
        selections.push({ category: 'filler', notes: 'added to clear free-delivery minimum', item: filler, skippedReason: null, allEligible: [filler] })
        reasoning.push(`Added filler item "${filler.description}" ($${filler.price.toFixed(2)}) to help clear the $${freeDeliveryMinimum} free-delivery minimum.`)
      } else {
        reasoning.push(`Still $${(freeDeliveryMinimum - total()).toFixed(2)} under the $${freeDeliveryMinimum} free-delivery minimum — no affordable upgrade or filler found. Flagging for the user rather than guessing.`)
        break
      }
    }
  }

  return {
    selections,
    total: total(),
    budget,
    freeDeliveryMinimum,
    metFreeDeliveryMinimum: total() >= freeDeliveryMinimum,
    reasoning,
  }
}
