// USDA FoodData Central — https://fdc.nal.usda.gov/
// Free API key from https://api.data.gov/signup (3600 req/hr)
// FNDDS (Survey) database has traditional ethnic foods including Indian dishes.

export interface USDAProduct {
  // Reuse the same shape as OFFProduct so callers handle them identically.
  // offId is stored as "usda_<fdcId>" in the FoodItem cache.
  offId: string;
  name: string;
  brand?: string;
  per100gCalories?: number;
  per100gProtein?: number;
  per100gCarbs?: number;
  per100gFat?: number;
  servingSizeG?: number;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

function getNutrient(food: USDAFood, id: number): number | undefined {
  const n = food.foodNutrients.find((f) => f.nutrientId === id);
  return n?.value;
}

export async function searchUSDA(query: string): Promise<USDAProduct[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return []; // silently skip if not configured

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("pageSize", "15");
  // Prioritise FNDDS (ethnic/home-cooked dishes) + SR Legacy + Foundation.
  // Branded is deliberately excluded — OFF already covers packaged products.
  url.searchParams.set("dataType", "Survey (FNDDS),Foundation,SR Legacy");

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`USDA FDC error: ${res.status}`);

  const data = await res.json();
  const foods: USDAFood[] = data.foods ?? [];

  return foods
    .filter((f) => f.description?.trim())
    .map((f): USDAProduct => {
      // USDA energy is nutrientId 1008 (kcal). Some SR records also have
      // nutrientId 2047 (Energy, gross; kcal) — fall back to it.
      const kcal = getNutrient(f, 1008) ?? getNutrient(f, 2047);
      const protein = getNutrient(f, 1003);
      const carbs = getNutrient(f, 1005);
      const fat = getNutrient(f, 1004);

      // Serving size: use the food-level servingSize field when present and in grams.
      const servingSizeG =
        f.servingSizeUnit?.toLowerCase() === "g" ? f.servingSize : undefined;

      const brand = f.brandOwner ?? f.brandName;

      return {
        offId: `usda_${f.fdcId}`,
        name: toTitleCase(f.description.trim()),
        brand: brand?.trim() || undefined,
        per100gCalories: kcal,
        per100gProtein: protein,
        per100gCarbs: carbs,
        per100gFat: fat,
        servingSizeG,
      };
    });
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
