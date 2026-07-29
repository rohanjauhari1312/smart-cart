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

export const FAVORITE_FOOD_OPTIONS = [
  "Ramen",
  "Rice",
  "Eggs",
  "Milk",
  "Oat milk",
  "Yogurt",
  "Bread",
  "Chicken",
  "Ground beef",
  "Tofu",
  "Bananas",
  "Apples",
  "Spinach",
  "Cheese",
  "Pasta",
  "Dumplings",
  "Frozen pizza",
  "Coffee",
  "Orange juice",
  "Cereal",
];

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
