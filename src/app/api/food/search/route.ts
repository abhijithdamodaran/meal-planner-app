import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { searchOpenFoodFacts } from "@/lib/api/open-food-facts";

const querySchema = z.object({
  q: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Query param 'q' is required" }, { status: 400 });
  }

  const { q } = parsed.data;

  // Run OFF search + user's custom foods in parallel
  const [offResults, customFoods] = await Promise.all([
    searchOpenFoodFacts(q).catch(() => []), // gracefully return empty on API failure
    prisma.customFood.findMany({
      where: {
        userId: session.userId,
        name: { contains: q },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Upsert OFF results into DB cache (fire-and-forget — don't block the response)
  if (offResults.length > 0) {
    Promise.all(
      offResults.map((p) =>
        prisma.foodItem.upsert({
          where: { offId: p.offId },
          update: {
            name: p.name,
            brand: p.brand,
            per100gCalories: p.per100gCalories,
            per100gProtein: p.per100gProtein,
            per100gCarbs: p.per100gCarbs,
            per100gFat: p.per100gFat,
            servingSizeG: p.servingSizeG,
          },
          create: {
            offId: p.offId,
            name: p.name,
            brand: p.brand,
            per100gCalories: p.per100gCalories,
            per100gProtein: p.per100gProtein,
            per100gCarbs: p.per100gCarbs,
            per100gFat: p.per100gFat,
            servingSizeG: p.servingSizeG,
          },
        }).catch(() => {})
      )
    ).catch(() => {}); // silent — caching is best-effort
  }

  return NextResponse.json({
    foodItems: offResults.map((p) => ({ ...p, type: "food_item" as const })),
    customFoods: customFoods.map((f) => ({ ...f, type: "custom_food" as const })),
  });
}
