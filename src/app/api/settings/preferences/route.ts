import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isLactoseIntolerant: z.boolean(),
  isGlutenFree: z.boolean(),
  otherAllergens: z.array(z.string().min(1).max(50)),
  calorieGoal: z.number().int().positive().nullable(),
  proteinGoalG: z.number().positive().nullable(),
  carbsGoalG: z.number().positive().nullable(),
  fatGoalG: z.number().positive().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
  });

  if (!prefs) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...prefs,
    otherAllergens: JSON.parse(prefs.otherAllergens),
  });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { otherAllergens, ...rest } = parsed.data;

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: session.userId },
    update: { ...rest, otherAllergens: JSON.stringify(otherAllergens) },
    create: { userId: session.userId, ...rest, otherAllergens: JSON.stringify(otherAllergens) },
  });

  return NextResponse.json({
    ...prefs,
    otherAllergens: JSON.parse(prefs.otherAllergens),
  });
}
