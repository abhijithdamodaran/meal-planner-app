import type { SpoonacularRecipe } from "./api/spoonacular";
import type { TheMealDBRecipe } from "./api/themealdb";

export type AnyRecipe = SpoonacularRecipe | TheMealDBRecipe;

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Merges Spoonacular + TheMealDB results.
 * Spoonacular takes precedence — if both sources have the same title, the
 * Spoonacular entry is kept (it has macros + allergens).
 */
export function mergeRecipes(
  spoonacular: SpoonacularRecipe[],
  themealdb: TheMealDBRecipe[]
): AnyRecipe[] {
  const seen = new Set(spoonacular.map((r) => normalizeTitle(r.title)));
  const unique = themealdb.filter((r) => !seen.has(normalizeTitle(r.title)));
  return [...spoonacular, ...unique];
}
