// TheMealDB: https://www.themealdb.com/api.php — free, no key, no rate limit.
// Allergen data is NOT available — show "allergen info unavailable" in UI.
// Macro data is NOT available.

export interface TheMealDBRecipe {
  externalId: string;
  source: "themealdb";
  title: string;
  imageUrl?: string;
  cuisines: string[]; // derived from strArea
  diets: string[];    // always []
  allergens: string[]; // always [] — show "allergen info unavailable" in UI
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: { step: number; text: string }[];
  readyInMinutes?: number;
  servings?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
}

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb?: string;
  [key: string]: string | undefined; // for strIngredient1-20, strMeasure1-20
}

function parseMeasureToNumber(measure: string): number {
  if (!measure?.trim()) return 0;
  // Handle fractions like "1/2", "3/4"
  const fractionMatch = measure.trim().match(/^(\d+)\/(\d+)/);
  if (fractionMatch) return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  const numMatch = measure.trim().match(/^[\d.]+/);
  return numMatch ? parseFloat(numMatch[0]) : 1;
}

function parseMeasureUnit(measure: string): string {
  if (!measure?.trim()) return "";
  // Strip leading numbers and fractions to get unit
  return measure.trim().replace(/^[\d\s./]+/, "").trim() || "unit";
}

function parseIngredients(meal: MealDBMeal): { name: string; amount: number; unit: string }[] {
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (!name) break;
    const measure = meal[`strMeasure${i}`] ?? "";
    ingredients.push({
      name,
      amount: parseMeasureToNumber(measure),
      unit: parseMeasureUnit(measure),
    });
  }
  return ingredients;
}

function parseInstructions(text?: string): { step: number; text: string }[] {
  if (!text?.trim()) return [];
  // Split on newlines or numbered steps like "1. "
  const lines = text
    .split(/\r?\n|\d+\.\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10); // skip very short fragments
  return lines.map((text, i) => ({ step: i + 1, text }));
}

function mapMeal(meal: MealDBMeal): TheMealDBRecipe {
  return {
    externalId: meal.idMeal,
    source: "themealdb",
    title: meal.strMeal,
    imageUrl: meal.strMealThumb,
    cuisines: meal.strArea ? [meal.strArea] : [],
    diets: [],
    allergens: [],
    ingredients: parseIngredients(meal),
    instructions: parseInstructions(meal.strInstructions),
    readyInMinutes: undefined,
    servings: undefined,
    caloriesPerServing: undefined,
    proteinPerServing: undefined,
    carbsPerServing: undefined,
    fatPerServing: undefined,
  };
}

export async function searchTheMealDB(query: string): Promise<TheMealDBRecipe[]> {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`TheMealDB error: ${res.status}`);
  const data = await res.json();
  return (data.meals ?? []).map(mapMeal);
}

export async function getTheMealDBRecipe(id: string): Promise<TheMealDBRecipe | null> {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = await res.json();
  const meal: MealDBMeal | undefined = data.meals?.[0];
  return meal ? mapMeal(meal) : null;
}
