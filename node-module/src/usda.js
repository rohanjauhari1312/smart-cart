const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'

const NUTRIENT_MAP = {
  Energy: 'calories',
  Protein: 'protein_g',
  'Carbohydrate, by difference': 'carbs_g',
  'Total lipid (fat)': 'fat_g',
}

/**
 * Fallback/cross-check when Open Food Facts data is sparse for a product.
 * Free API key, self-serve at fdc.nal.usda.gov. Returns null on any
 * failure or no-match rather than inventing numbers.
 *
 * @param {string} name
 */
export async function lookupUsda(name) {
  if (!process.env.USDA_API_KEY) return { error: 'USDA_API_KEY not configured' }

  const params = new URLSearchParams({
    api_key: process.env.USDA_API_KEY,
    query: name,
    pageSize: '1',
  })

  let res
  try {
    res = await fetch(`${SEARCH_URL}?${params}`)
  } catch (err) {
    return { error: `USDA request failed: ${err.message}` }
  }
  if (!res.ok) return { error: `USDA returned ${res.status}` }

  const data = await res.json()
  const food = (data.foods || [])[0]
  if (!food) return { error: 'No USDA match found' }

  const macros = {}
  for (const n of food.foodNutrients || []) {
    const key = NUTRIENT_MAP[n.nutrientName]
    if (key) macros[key] = n.value
  }

  return {
    error: null,
    description: food.description,
    fdcId: food.fdcId,
    ...macros,
  }
}
