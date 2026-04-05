import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { searchSpoonacular, buildSpoonacularFilters } from "@/lib/api/spoonacular";
import { searchTheMealDB } from "@/lib/api/themealdb";
import { mergeRecipes } from "@/lib/recipe-merger";
import { serializeRecipe } from "@/lib/recipe-db";
import type { AnyRecipe } from "@/lib/recipe-merger";

const SPOONACULAR_DAILY_LIMIT = 150;

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

async function isSpoonacularAvailable(): Promise<boolean> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const usage = await prisma.apiUsage.findUnique({
    where: { apiName_usageDate: { apiName: "spoonacular", usageDate: today } },
  });
  return (usage?.requestCount ?? 0) < SPOONACULAR_DAILY_LIMIT;
}

async function incrementSpoonacularUsage(cost: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.apiUsage.upsert({
    where: { apiName_usageDate: { apiName: "spoonacular", usageDate: today } },
    update: { requestCount: { increment: cost } },
    create: { apiName: "spoonacular", usageDate: today, requestCount: cost },
  });
}

async function cacheRecipes(recipes: AnyRecipe[]) {
  await Promise.all(
    recipes.map((r) => {
      const data = serializeRecipe(r);
      return prisma.recipe.upsert({
        where: { externalId_source: { externalId: r.externalId, source: r.source } },
        update: data,
        create: data,
      }).catch(() => null);
    })
  );
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Query param 'q' is required" }, { status: 400 });
  }

  const { q } = parsed.data;

  const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.userId } });
  const filters = prefs ? buildSpoonacularFilters(prefs) : {};

  const spoonacularAvailable = await isSpoonacularAvailable();

  const [spoonacularResults, themealdbResults] = await Promise.all([
    spoonacularAvailable
      ? searchSpoonacular(q, filters).catch(() => [])
      : Promise.resolve([]),
    searchTheMealDB(q).catch(() => []),
  ]);

  if (spoonacularAvailable && spoonacularResults.length > 0) {
    const cost = 1 + spoonacularResults.length * 2;
    incrementSpoonacularUsage(cost).catch(() => {});
  }

  const merged = mergeRecipes(spoonacularResults, themealdbResults);

  if (merged.length > 0) {
    cacheRecipes(merged).catch(() => {});
  }

  // Return typed arrays directly (not DB records) so the client gets proper arrays
  return NextResponse.json({
    recipes: merged,
    spoonacularSkipped: !spoonacularAvailable,
  });
}
