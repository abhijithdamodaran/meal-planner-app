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

  // Run all three sources in parallel
  const [offResults, usdaResults, customFoods] = await Promise.all([
    searchOpenFoodFacts(q).catch(() => [] as OFFProduct[]),
    searchUSDA(q).catch(() => [] as USDAProduct[]),
    prisma.customFood.findMany({
      where: {
        userId: session.userId,
        name: { contains: q },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Merge OFF + USDA; deduplicate by offId then by lowercase name
  const merged: FoodProduct[] = [...offResults];
  const seenIds = new Set(offResults.map((p) => p.offId));
  const seenNames = new Set(offResults.map((p) => p.name.toLowerCase()));

  for (const p of usdaResults) {
    if (seenIds.has(p.offId)) continue;
    if (seenNames.has(p.name.toLowerCase())) continue;
    seenIds.add(p.offId);
    seenNames.add(p.name.toLowerCase());
    merged.push(p);
  }

  // Upsert all API results to get back their database IDs.
  // We need the DB ids so the food log API can link entries correctly.
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

  return NextResponse.json({
    foodItems: upserted.filter(Boolean),
    customFoods: customFoods.map((f) => ({ ...f, type: "custom_food" as const })),
  });
}
