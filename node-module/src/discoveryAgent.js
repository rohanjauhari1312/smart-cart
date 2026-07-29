import { searchProducts } from './kroger.js'

const CANDIDATES_PER_CATEGORY = 10

/**
 * For each {category, notes} from the Intent Agent, searches Kroger and
 * returns raw candidates. Failures on one category don't kill the whole
 * run — that category comes back empty with the failure reason attached,
 * and downstream agents skip it rather than guessing.
 *
 * @param {{category: string, notes: string}[]} categories
 */
export async function runDiscoveryAgent(categories) {
  const results = await Promise.all(
    categories.map(async ({ category, notes }) => {
      const term = notes ? `${category} ${notes}` : category
      try {
        const candidates = await searchProducts(term, { limit: CANDIDATES_PER_CATEGORY })
        return { category, notes, candidates, error: null }
      } catch (err) {
        return { category, notes, candidates: [], error: err.message }
      }
    })
  )
  return results
}
