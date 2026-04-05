import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const addItemSchema = z.object({
  ingredientName: z.string().min(1).max(200),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
});

const addBulkSchema = z.object({
  items: z.array(addItemSchema).min(1).max(100),
});

async function verifyListOwnership(listId: string, householdId: string) {
  const list = await prisma.shoppingList.findUnique({ where: { id: listId } });
  return list?.householdId === householdId ? list : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await verifyListOwnership(params.listId, session.householdId);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);

  // Support both single item and bulk add
  const bulkParsed = addBulkSchema.safeParse(body);
  if (bulkParsed.success) {
    const items = await prisma.shoppingListItem.createMany({
      data: bulkParsed.data.items.map((item) => ({
        shoppingListId: params.listId,
        ingredientName: item.ingredientName,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        addedByUserId: session.userId,
      })),
    });
    return NextResponse.json({ count: items.count }, { status: 201 });
  }

  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const item = await prisma.shoppingListItem.create({
    data: {
      shoppingListId: params.listId,
      ingredientName: parsed.data.ingredientName,
      quantity: parsed.data.quantity ?? null,
      unit: parsed.data.unit ?? null,
      addedByUserId: session.userId,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
