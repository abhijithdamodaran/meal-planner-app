import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { serializeRecipe } from "@/lib/recipe-db";

const SPOONACULAR_DAILY_LIMIT = 150;

const querySchema = z.object({
  ingredients: z.string().min(1), // comma-separated
});

// ─── Spoonacular ──────────────────────────────────────────────────────────────

interface SpoonacularIngredientResult {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: { name: string; amount: number; unit: string }[];
  missedIngredients: { name: string; amount: number; unit: string }[];
}

async function spoonacularByIngredients(
  ingredients: string[]
): Promise<IngredientRecipe[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
  url.searchParams.set("ingredients", ingredients.join(","));
  url.searchParams.set("number", "12");
  url.searchParams.set("ranking", "1"); // maximise used ingredients
  url.searchParams.set("ignorePantry", "true");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status}`);

  const results: SpoonacularIngredientResult[] = await res.json();

  return results.map((r) => {
    const total = r.usedIngredientCount + r.missedIngredientCount;
    return {
      externalId: String(r.id),
      source: "spoonacular" as const,
      title: r.title,
      imageUrl: r.image ? `https://img.spoonacular.com/recipes/${r.image}` : undefined,
      cuisines: [],
      diets: [],
      allergens: [],
      ingredients: [],
      instructions: [],
      usedCount: r.usedIngredientCount,
      missedCount: r.missedIngredientCount,
      matchPct: total > 0 ? Math.round((r.usedIngredientCount / total) * 100) : 0,
      usedIngredients: r.usedIngredients.map((i) => i.name),
      missedIngredients: r.missedIngredients.map((i) => i.name),
    };
  });
}

// ─── TheMealDB ────────────────────────────────────────────────────────────────

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  [key: string]: string | undefined;
}

function extractMealIngredients(meal: MealDBMeal): string[] {
  const names: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    if (!name) break;
    names.push(name.toLowerCase());
  }
  return names;
}

async function themealdbByIngredients(
  ingredients: string[]
): Promise<IngredientRecipe[]> {
  // TheMealDB only supports single-ingredient filter — search for each ingredient
  // and merge results, then score by how many queried ingredients each recipe contains.
  const requests = ingredients.slice(0, 5).map((ing) =>
    fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ing)}`,
      { next: { revalidate: 0 } }
    )
      .then((r) => r.json())
      .then((d) => (d.meals ?? []) as MealDBMeal[])
      .catch(() => [] as MealDBMeal[])
  );

  const perIngredientResults = await Promise.all(requests);

  // Count how many of the queried ingredients each meal appears for
  const mealHitCount: Record<string, { meal: MealDBMeal; hits: number }> = {};
  perIngredientResults.forEach((meals) => {
    meals.forEach((meal) => {
      if (!mealHitCount[meal.idMeal]) {
        mealHitCount[meal.idMeal] = { meal, hits: 0 };
      }
      mealHitCount[meal.idMeal].hits++;
    });
  });

  // Fetch full meal details to get all ingredient lists for scoring
  const topMealIds = Object.values(mealHitCount)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10)
    .map((m) => m.meal.idMeal);

  const detailRequests = topMealIds.map((id) =>
    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`, {
      next: { revalidate: 0 },
    })
      .then((r) => r.json())
      .then((d) => (d.meals?.[0] ?? null) as MealDBMeal | null)
      .catch(() => null)
  );

  const details = (await Promise.all(detailRequests)).filter(Boolean) as MealDBMeal[];
  const querySet = new Set(ingredients.map((i) => i.toLowerCase()));

  return details.map((meal) => {
    const recipeIngredients = extractMealIngredients(meal);
    const used = recipeIngredients.filter((i) => querySet.has(i));
    const missed = recipeIngredients.filter((i) => !querySet.has(i));
    const total = recipeIngredients.length;

    return {
      externalId: meal.idMeal,
      source: "themealdb" as const,
      title: meal.strMeal,
      imageUrl: meal.strMealThumb,
      cuisines: [],
      diets: [],
      allergens: [],
      ingredients: [],
      instructions: [],
      usedCount: used.length,
      missedCount: missed.length,
      matchPct: total > 0 ? Math.round((used.length / total) * 100) : 0,
      usedIngredients: used,
      missedIngredients: missed.slice(0, 8), // cap the missing list
    };
  });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export interface IngredientRecipe {
  externalId: string;
  source: "spoonacular" | "themealdb";
  title: string;
  imageUrl?: string;
  cuisines: string[];
  diets: string[];
  allergens: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: { step: number; text: string }[];
  usedCount: number;
  missedCount: number;
  matchPct: number;
  usedIngredients: string[];
  missedIngredients: string[];
}

async function isSpoonacularAvailable(): Promise<boolean> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const usage = await prisma.apiUsage.findUnique({
    where: { apiName_usageDate: { apiName: "spoonacular", usageDate: today } },
  });
  return (usage?.requestCount ?? 0) < SPOONACULAR_DAILY_LIMIT;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "ingredients param required" }, { status: 400 });
  }

  const ingredients = parsed.data.ingredients
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (ingredients.length === 0) {
    return NextResponse.json({ error: "At least one ingredient required" }, { status: 400 });
  }

  const spoonacularAvailable = await isSpoonacularAvailable();

  const [spoonacularResults, themealdbResults] = await Promise.all([
    spoonacularAvailable
      ? spoonacularByIngredients(ingredients).catch(() => [])
      : Promise.resolve([] as IngredientRecipe[]),
    themealdbByIngredients(ingredients).catch(() => [] as IngredientRecipe[]),
  ]);

  // Track usage — findByIngredients costs 1 point per result
  if (spoonacularAvailable && spoonacularResults.length > 0) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    prisma.apiUsage.upsert({
      where: { apiName_usageDate: { apiName: "spoonacular", usageDate: today } },
      update: { requestCount: { increment: spoonacularResults.length } },
      create: { apiName: "spoonacular", usageDate: today, requestCount: spoonacularResults.length },
    }).catch(() => {});
  }

  // Deduplicate by normalised title, Spoonacular wins
  const seen = new Set(spoonacularResults.map((r) => r.title.toLowerCase().replace(/\s+/g, "")));
  const unique = themealdbResults.filter(
    (r) => !seen.has(r.title.toLowerCase().replace(/\s+/g, ""))
  );
  const merged = [...spoonacularResults, ...unique];

  // Sort by match % descending
  merged.sort((a, b) => b.matchPct - a.matchPct);

  // Cache in DB (fire-and-forget) so detail pages are fast
  if (merged.length > 0) {
    Promise.all(
      merged.map((r) => {
        const data = serializeRecipe(r);
        return prisma.recipe.upsert({
          where: { externalId_source: { externalId: r.externalId, source: r.source } },
          update: data,
          create: data,
        }).catch(() => null);
      })
    ).catch(() => {});
  }

  return NextResponse.json({
    recipes: merged,
    spoonacularSkipped: !spoonacularAvailable,
  });
}
