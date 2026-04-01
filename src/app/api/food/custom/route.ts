import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  per100gCalories: z.number().nonnegative().optional(),
  per100gProtein: z.number().nonnegative().optional(),
  per100gCarbs: z.number().nonnegative().optional(),
  per100gFat: z.number().nonnegative().optional(),
  servingSizeG: z.number().positive().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const foods = await prisma.customFood.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(foods);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const food = await prisma.customFood.create({
    data: { ...parsed.data, userId: session.userId },
  });

  return NextResponse.json(food, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const food = await prisma.customFood.findUnique({ where: { id } });
  if (!food || food.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.customFood.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
