// Simple keyword heuristic, not an exhaustive ingredient classifier.
// Matches Onboarding.jsx's diet taxonomy: veg, nonveg, vegan, eggetarian, pescatarian, keto.

const MEAT_FISH_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'ham',
  'sausage', 'gelatin', 'lard', 'anchovy', 'shrimp', 'shellfish', 'fish',
  'tuna', 'salmon', 'meat', 'veal',
]

const ANIMAL_PRODUCT_KEYWORDS = ['milk', 'cheese', 'butter', 'cream', 'whey', 'egg', 'honey', 'yogurt']

/**
 * Returns the list of matched keywords that conflict with the given diet,
 * or an empty array if nothing conflicts (or the diet has no restriction).
 * @param {string} ingredientsText
 * @param {string} diet one of veg|nonveg|vegan|eggetarian|pescatarian|keto
 */
export function findDietConflicts(ingredientsText, diet) {
  if (!ingredientsText || !diet) return []
  const text = ingredientsText.toLowerCase()

  let excluded = []
  if (diet === 'vegan') excluded = [...MEAT_FISH_KEYWORDS, ...ANIMAL_PRODUCT_KEYWORDS]
  else if (diet === 'veg' || diet === 'eggetarian') excluded = MEAT_FISH_KEYWORDS
  else if (diet === 'pescatarian') excluded = MEAT_FISH_KEYWORDS.filter(k => !['fish', 'tuna', 'salmon', 'anchovy', 'shrimp', 'shellfish'].includes(k))
  // nonveg / keto: no ingredient exclusions

  return excluded.filter(k => text.includes(k))
}
