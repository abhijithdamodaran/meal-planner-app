import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateFoodMacros } from "@/lib/macros";

const updateSchema = z.object({
  quantity: z.number().positive(),
  unit: z.enum(["g", "ml", "serving"]),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.foodLog.findUnique({
    where: { id: params.id },
    include: { foodItem: true, customFood: true },
  });

  if (!entry || entry.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { quantity, unit, mealType } = parsed.data;

  // Recalculate macros with new quantity/unit
  let macros = { calories: entry.calories, proteinG: entry.proteinG, carbsG: entry.carbsG, fatG: entry.fatG };
  if (entry.foodItem) {
    macros = calculateFoodMacros(entry.foodItem, quantity, unit);
  } else if (entry.customFood) {
    macros = calculateFoodMacros(entry.customFood, quantity, unit);
  }

  const updated = await prisma.foodLog.update({
    where: { id: params.id },
    data: { quantity, unit, mealType, ...macros },
    include: { foodItem: true, customFood: true, recipe: true, customRecipe: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await prisma.foodLog.findUnique({ where: { id: params.id } });
  if (!entry || entry.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.foodLog.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
