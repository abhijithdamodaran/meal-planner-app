import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateFoodMacros, calculateRecipeMacros } from "@/lib/macros";

const addSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  quantity: z.number().positive(),
  unit: z.enum(["g", "ml", "serving"]),
  // Exactly one source must be provided
  foodItemId: z.string().optional(),
  customFoodId: z.string().optional(),
  recipeId: z.string().optional(),
  customRecipeId: z.string().optional(),
  customName: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date param required (YYYY-MM-DD)" }, { status: 400 });
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const entries = await prisma.foodLog.findMany({
    where: {
      userId: session.userId,
      loggedDate: { gte: start, lte: end },
    },
    include: {
      foodItem: true,
      customFood: true,
      recipe: true,
      customRecipe: true,
    },
    orderBy: { loggedAt: "asc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { date, mealType, quantity, unit, foodItemId, customFoodId, recipeId, customRecipeId, customName } = parsed.data;

  // Calculate macros at log time (denormalized)
  let macros = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  if (foodItemId) {
    const food = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
    if (!food) return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    macros = calculateFoodMacros(food, quantity, unit);
  } else if (customFoodId) {
    const food = await prisma.customFood.findUnique({ where: { id: customFoodId } });
    if (!food || food.userId !== session.userId) {
      return NextResponse.json({ error: "Custom food not found" }, { status: 404 });
    }
    macros = calculateFoodMacros(food, quantity, unit);
  } else if (recipeId) {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    macros = calculateRecipeMacros(recipe, quantity); // quantity = servings for recipes
  } else if (customRecipeId) {
    const recipe = await prisma.customRecipe.findUnique({ where: { id: customRecipeId } });
    if (!recipe || recipe.userId !== session.userId) {
      return NextResponse.json({ error: "Custom recipe not found" }, { status: 404 });
    }
    macros = calculateRecipeMacros(recipe, quantity);
  } else if (!customName) {
    return NextResponse.json({ error: "No food source provided" }, { status: 400 });
  }

  const loggedDate = new Date(`${date}T00:00:00.000Z`);

  const entry = await prisma.foodLog.create({
    data: {
      userId: session.userId,
      loggedDate,
      mealType,
      quantity,
      unit,
      foodItemId,
      customFoodId,
      recipeId,
      customRecipeId,
      customName,
      ...macros,
    },
    include: { foodItem: true, customFood: true, recipe: true, customRecipe: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
