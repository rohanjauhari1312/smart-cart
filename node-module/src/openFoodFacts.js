const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

/**
 * Looks up a product by name in Open Food Facts. Free, no API key.
 * Returns null (never a guess) if nothing usable comes back — the caller
 * is responsible for treating null as "skip this candidate's quality data".
 *
 * @param {string} name e.g. "Nissin Top Ramen Chicken"
 */
export async function lookupOpenFoodFacts(name) {
  const params = new URLSearchParams({
    search_terms: name,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '5',
  })

  let res
  try {
    res = await fetch(`${SEARCH_URL}?${params}`)
  } catch (err) {
    return { error: `Open Food Facts request failed: ${err.message}` }
  }
  if (!res.ok) return { error: `Open Food Facts returned ${res.status}` }

  const data = await res.json()
  const product = (data.products || [])[0]
  if (!product) return { error: 'No Open Food Facts match found' }

  return {
    error: null,
    productName: product.product_name || null,
    nutriScore: product.nutriscore_grade ? product.nutriscore_grade.toUpperCase() : null,
    novaGroup: typeof product.nova_group === 'number' ? product.nova_group : null,
    ingredientsText: product.ingredients_text || null,
    barcode: product.code || null,
  }
}
