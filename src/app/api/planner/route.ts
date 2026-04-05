import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const querySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const addSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  servings: z.number().positive().default(1),
  notes: z.string().max(500).optional(),
  // exactly one of:
  recipeExternalId: z.string().optional(),
  recipeSource: z.enum(["spoonacular", "themealdb"]).optional(),
  customRecipeId: z.string().optional(),
  foodItemId: z.string().optional(),
  customFoodId: z.string().optional(),
  customName: z.string().max(200).optional(),
});

function entrySelect() {
  return {
    id: true,
    dayOfWeek: true,
    mealType: true,
    servings: true,
    notes: true,
    customName: true,
    recipe: { select: { id: true, externalId: true, source: true, title: true, imageUrl: true } },
    customRecipe: { select: { id: true, title: true } },
    foodItem: { select: { id: true, name: true, brand: true } },
    customFood: { select: { id: true, name: true, brand: true } },
  } as const;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "weekStart param required (YYYY-MM-DD)" }, { status: 400 });
  }

  const weekStart = new Date(`${parsed.data.weekStart}T00:00:00.000Z`);

  // Get (or create) the household meal plan for this week
  const plan = await prisma.mealPlan.upsert({
    where: {
      householdId_weekStart: {
        householdId: session.householdId,
        weekStart,
      },
    },
    update: {},
    create: { householdId: session.householdId, weekStart },
    include: { entries: { select: entrySelect(), orderBy: [{ dayOfWeek: "asc" }, { mealType: "asc" }] } },
  });

  return NextResponse.json(plan);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const {
    weekStart: weekStartStr,
    dayOfWeek, mealType, servings, notes,
    recipeExternalId, recipeSource,
    customRecipeId, foodItemId, customFoodId, customName,
  } = parsed.data;

  const weekStart = new Date(`${weekStartStr}T00:00:00.000Z`);

  // Get or create the meal plan
  const plan = await prisma.mealPlan.upsert({
    where: { householdId_weekStart: { householdId: session.householdId, weekStart } },
    update: {},
    create: { householdId: session.householdId, weekStart },
  });

  // Resolve recipe DB id from externalId if needed
  let recipeId: string | undefined;
  if (recipeExternalId && recipeSource) {
    const recipe = await prisma.recipe.findUnique({
      where: { externalId_source: { externalId: recipeExternalId, source: recipeSource } },
    });
    if (!recipe) return NextResponse.json({ error: "Recipe not found — search for it first" }, { status: 404 });
    recipeId = recipe.id;
  }

  const entry = await prisma.mealPlanEntry.create({
    data: {
      mealPlanId: plan.id,
      dayOfWeek,
      mealType,
      servings,
      notes: notes ?? null,
      recipeId: recipeId ?? null,
      customRecipeId: customRecipeId ?? null,
      foodItemId: foodItemId ?? null,
      customFoodId: customFoodId ?? null,
      customName: customName ?? null,
    },
    select: entrySelect(),
  });

  return NextResponse.json(entry, { status: 201 });
}
