// Spoonacular: https://spoonacular.com/food-api/docs
// complexSearch with addRecipeNutrition=true costs ~11 points per 10 results (1 call + 10 results).
// Daily limit: 150 points → ~13 full searches/day.

export interface SpoonacularRecipe {
  externalId: string;
  source: "spoonacular";
  title: string;
  imageUrl?: string;
  cuisines: string[];
  diets: string[];
  allergens: string[]; // derived from dairyFree / glutenFree flags
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: { step: number; text: string }[];
  readyInMinutes?: number;
  servings?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
}

interface SpoonacularApiResult {
  id: number;
  title: string;
  image?: string;
  readyInMinutes?: number;
  servings?: number;
  cuisines?: string[];
  diets?: string[];
  dairyFree?: boolean;
  glutenFree?: boolean;
  analyzedInstructions?: { steps: { number: number; step: string }[] }[];
  extendedIngredients?: { name: string; amount: number; unit: string }[];
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
  };
}

function getNutrient(nutrients: { name: string; amount: number }[], name: string): number | undefined {
  return nutrients.find((n) => n.name.toLowerCase() === name.toLowerCase())?.amount;
}

function deriveAllergens(r: SpoonacularApiResult): string[] {
  const a: string[] = [];
  if (r.dairyFree === false) a.push("dairy");
  if (r.glutenFree === false) a.push("gluten");
  return a;
}

function mapResult(r: SpoonacularApiResult): SpoonacularRecipe {
  const nutrients = r.nutrition?.nutrients ?? [];
  const instructions =
    r.analyzedInstructions?.[0]?.steps.map((s) => ({ step: s.number, text: s.step })) ?? [];
  const ingredients = (r.extendedIngredients ?? []).map((i) => ({
    name: i.name,
    amount: i.amount,
    unit: i.unit,
  }));

  return {
    externalId: String(r.id),
    source: "spoonacular",
    title: r.title,
    imageUrl: r.image,
    cuisines: r.cuisines ?? [],
    diets: r.diets ?? [],
    allergens: deriveAllergens(r),
    ingredients,
    instructions,
    readyInMinutes: r.readyInMinutes,
    servings: r.servings,
    caloriesPerServing: getNutrient(nutrients, "Calories"),
    proteinPerServing: getNutrient(nutrients, "Protein"),
    carbsPerServing: getNutrient(nutrients, "Carbohydrates"),
    fatPerServing: getNutrient(nutrients, "Fat"),
  };
}

interface SearchOptions {
  diet?: string;         // comma-separated e.g. "vegetarian,vegan"
  intolerances?: string; // comma-separated e.g. "dairy,gluten"
}

export async function searchSpoonacular(query: string, opts: SearchOptions = {}): Promise<SpoonacularRecipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
  url.searchParams.set("query", query);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("number", "10");
  url.searchParams.set("addRecipeNutrition", "true");
  url.searchParams.set("addRecipeInformation", "true");
  if (opts.diet) url.searchParams.set("diet", opts.diet);
  if (opts.intolerances) url.searchParams.set("intolerances", opts.intolerances);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

  const data = await res.json();
  return (data.results ?? []).map(mapResult);
}

export async function getSpoonacularRecipe(id: string): Promise<SpoonacularRecipe | null> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`https://api.spoonacular.com/recipes/${id}/information`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("includeNutrition", "true");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return null;

  const r: SpoonacularApiResult = await res.json();
  return mapResult(r);
}

/** Build diet/intolerance params from user preferences */
export function buildSpoonacularFilters(prefs: {
  isVegetarian: boolean;
  isVegan: boolean;
  isLactoseIntolerant: boolean;
  isGlutenFree: boolean;
}): SearchOptions {
  const diets: string[] = [];
  if (prefs.isVegan) diets.push("vegan");
  else if (prefs.isVegetarian) diets.push("vegetarian");

  const intolerances: string[] = [];
  if (prefs.isLactoseIntolerant) intolerances.push("dairy");
  if (prefs.isGlutenFree) intolerances.push("gluten");

  return {
    diet: diets.join(",") || undefined,
    intolerances: intolerances.join(",") || undefined,
  };
}
