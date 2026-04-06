import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { searchOpenFoodFacts } from "@/lib/api/open-food-facts";
import { searchUSDA } from "@/lib/api/usda";
import type { OFFProduct } from "@/lib/api/open-food-facts";
import type { USDAProduct } from "@/lib/api/usda";

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

type FoodProduct = OFFProduct | USDAProduct;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Query param 'q' is required" }, { status: 400 });
  }

  const { q } = parsed.data;

  // Run all sources in parallel: DB cache, external APIs, custom foods
  const [cachedItems, offResults, usdaResults, customFoods] = await Promise.all([
    // Search already-cached FoodItems in DB (covers seeded Indian foods + past searches)
    prisma.foodItem.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: 30,
    }),
    searchOpenFoodFacts(q).catch(() => [] as OFFProduct[]),
    searchUSDA(q).catch(() => [] as USDAProduct[]),
    prisma.customFood.findMany({
      where: {
        userId: session.userId,
        name: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Start with DB cache results (already have DB ids, no upsert needed)
  const cachedIds = new Set(cachedItems.map((c) => c.offId));
  const cachedNames = new Set(cachedItems.map((c) => c.name.toLowerCase()));

  // Merge OFF + USDA; skip items already in DB cache (by offId or name)
  const merged: FoodProduct[] = [];
  const seenIds = new Set(cachedIds);
  const seenNames = new Set(cachedNames);

  for (const p of [...offResults, ...usdaResults]) {
    if (seenIds.has(p.offId)) continue;
    if (seenNames.has(p.name.toLowerCase())) continue;
    seenIds.add(p.offId);
    seenNames.add(p.name.toLowerCase());
    merged.push(p);
  }

  // Upsert only the API results not already in DB
  const upserted = await Promise.all(
    merged.map(async (p) => {
      try {
        const item = await prisma.foodItem.upsert({
          where: { offId: p.offId },
          update: {
            name: p.name,
            brand: p.brand ?? null,
            per100gCalories: p.per100gCalories ?? null,
            per100gProtein: p.per100gProtein ?? null,
            per100gCarbs: p.per100gCarbs ?? null,
            per100gFat: p.per100gFat ?? null,
            servingSizeG: p.servingSizeG ?? null,
          },
          create: {
            offId: p.offId,
            name: p.name,
            brand: p.brand ?? null,
            per100gCalories: p.per100gCalories ?? null,
            per100gProtein: p.per100gProtein ?? null,
            per100gCarbs: p.per100gCarbs ?? null,
            per100gFat: p.per100gFat ?? null,
            servingSizeG: p.servingSizeG ?? null,
          },
        });
        return { ...p, id: item.id, type: "food_item" as const };
      } catch {
        return null;
      }
    })
  );

  // Combine: cached DB items first (fast, reliable), then new API results
  const foodItems = [
    ...cachedItems.map((item) => ({ ...item, type: "food_item" as const })),
    ...upserted.filter(Boolean),
  ];

  return NextResponse.json({
    foodItems,
    customFoods: customFoods.map((f) => ({ ...f, type: "custom_food" as const })),
  });
}
