import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const ingredientSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().min(0),
  unit: z.string().max(50),
});

const instructionSchema = z.object({
  step: z.number().int().positive(),
  text: z.string().min(1).max(2000),
});

const createSchema = z.object({
  title: z.string().min(1).max(200),
  servings: z.number().int().positive().optional(),
  caloriesPerServing: z.number().min(0).optional(),
  proteinPerServing: z.number().min(0).optional(),
  carbsPerServing: z.number().min(0).optional(),
  fatPerServing: z.number().min(0).optional(),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(instructionSchema).default([]),
  allergens: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
});

function parseCustomRecipe(r: {
  id: string;
  userId: string;
  title: string;
  imageUrl?: string | null;
  allergens: string;
  ingredients: string;
  instructions: string;
  servings?: number | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
  createdAt: Date;
}) {
  return {
    ...r,
    allergens: JSON.parse(r.allergens) as string[],
    ingredients: JSON.parse(r.ingredients) as { name: string; amount: number; unit: string }[],
    instructions: JSON.parse(r.instructions) as { step: number; text: string }[],
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipes = await prisma.customRecipe.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recipes.map(parseCustomRecipe));
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const {
    title, servings, caloriesPerServing, proteinPerServing, carbsPerServing, fatPerServing,
    ingredients, instructions, allergens, imageUrl,
  } = parsed.data;

  const recipe = await prisma.customRecipe.create({
    data: {
      userId: session.userId,
      title,
      servings: servings ?? null,
      caloriesPerServing: caloriesPerServing ?? null,
      proteinPerServing: proteinPerServing ?? null,
      carbsPerServing: carbsPerServing ?? null,
      fatPerServing: fatPerServing ?? null,
      ingredients: JSON.stringify(ingredients),
      instructions: JSON.stringify(instructions),
      allergens: JSON.stringify(allergens),
      imageUrl: imageUrl ?? null,
    },
  });

  return NextResponse.json(parseCustomRecipe(recipe), { status: 201 });
}
