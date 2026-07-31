const STORAGE_KEY = "grocer-agent-preferences";

export const DIETS = [
  { value: "veg", label: "Vegetarian" },
  { value: "nonveg", label: "Non-vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
];

export const GOALS = [
  { value: "build_muscle", label: "Build muscle", note: "prioritize high-protein options" },
  { value: "lose_weight", label: "Lose weight", note: "prioritize lower-calorie, less-processed options" },
  { value: "maintain_weight", label: "Maintain weight", note: "keep a balanced mix, no strong skew" },
  { value: "eat_healthier", label: "Eat healthier", note: "prioritize higher Nutri-Score, less-processed options" },
  { value: "none", label: "No specific goal", note: "" },
];

// tags: "meat", "fish", "egg", "dairy" — omitted for plant/neutral items.
// Mirrors the diet semantics the Quality & Nutrition agent uses downstream:
// veg/vegan/eggetarian/pescatarian have real exclusions, nonveg/keto don't.
const FAVORITE_FOOD_ITEMS = [
  { name: "Ramen" },
  { name: "Rice" },
  { name: "Eggs", tags: ["egg"] },
  { name: "Milk", tags: ["dairy"] },
  { name: "Oat milk" },
  { name: "Yogurt", tags: ["dairy"] },
  { name: "Bread" },
  { name: "Chicken", tags: ["meat"] },
  { name: "Ground beef", tags: ["meat"] },
  { name: "Tofu" },
  { name: "Bananas" },
  { name: "Apples" },
  { name: "Spinach" },
  { name: "Cheese", tags: ["dairy"] },
  { name: "Pasta" },
  { name: "Dumplings" },
  { name: "Frozen pizza" },
  { name: "Coffee" },
  { name: "Orange juice" },
  { name: "Cereal" },
];

const DIET_EXCLUDED_TAGS = {
  veg: ["meat", "fish", "egg"],
  vegan: ["meat", "fish", "egg", "dairy"],
  eggetarian: ["meat", "fish"],
  pescatarian: ["meat"],
  nonveg: [],
  keto: [],
};

export function getFavoriteFoodOptions(diet) {
  const excluded = DIET_EXCLUDED_TAGS[diet] ?? [];
  return FAVORITE_FOOD_ITEMS.filter((item) => !(item.tags ?? []).some((t) => excluded.includes(t))).map(
    (item) => item.name
  );
}

export function getStoredPreferences() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredPreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
