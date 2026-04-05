import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createListSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    where: { householdId: session.householdId },
    include: {
      items: {
        orderBy: [{ isChecked: "asc" }, { addedAt: "asc" }],
        select: {
          id: true,
          ingredientName: true,
          quantity: true,
          unit: true,
          isChecked: true,
          addedAt: true,
          addedBy: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ lists });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const list = await prisma.shoppingList.create({
    data: {
      householdId: session.householdId,
      name: parsed.data.name,
    },
    include: { items: true },
  });

  return NextResponse.json(list, { status: 201 });
}
