export interface OFFProduct {
  offId: string;
  name: string;
  brand?: string;
  per100gCalories?: number;
  per100gProtein?: number;
  per100gCarbs?: number;
  per100gFat?: number;
  servingSizeG?: number;
}

interface OFFApiProduct {
  code?: string;
  id?: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy_100g"?: number; // kJ fallback
    "proteins_100g"?: number;
    "carbohydrates_100g"?: number;
    "fat_100g"?: number;
  };
}

// Extract grams from strings like "100g", "1 cup (240ml)", "30 g", "1 bar (45g)"
function parseServingGrams(raw?: string): number | undefined {
  if (!raw) return undefined;
  const match = raw.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : undefined;
}

export async function searchOpenFoodFacts(query: string): Promise<OFFProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", "code,id,product_name,brands,nutriments,serving_size");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "MealPlannerApp/1.0" },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Open Food Facts error: ${res.status}`);

  const data = await res.json();
  const products: OFFApiProduct[] = data.products ?? [];

  return products
    .filter((p) => p.product_name?.trim())
    .map((p): OFFProduct => {
      const n = p.nutriments ?? {};
      // OFF returns kJ in energy_100g; kcal in energy-kcal_100g
      const kcal =
        n["energy-kcal_100g"] ??
        (n["energy_100g"] ? Math.round(n["energy_100g"] / 4.184) : undefined);

      return {
        offId: p.code ?? p.id ?? crypto.randomUUID(),
        name: p.product_name!.trim(),
        brand: p.brands?.split(",")[0].trim() || undefined,
        per100gCalories: kcal,
        per100gProtein: n["proteins_100g"],
        per100gCarbs: n["carbohydrates_100g"],
        per100gFat: n["fat_100g"],
        servingSizeG: parseServingGrams(p.serving_size),
      };
    });
}
