import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  isChecked: z.boolean().optional(),
  ingredientName: z.string().min(1).max(200).optional(),
  quantity: z.number().positive().nullable().optional(),
  unit: z.string().max(50).nullable().optional(),
});

async function verifyItemOwnership(itemId: string, listId: string, householdId: string) {
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    include: { shoppingList: { select: { householdId: true } } },
  });
  if (!item || item.shoppingListId !== listId) return null;
  if (item.shoppingList.householdId !== householdId) return null;
  return item;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { listId: string; itemId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await verifyItemOwnership(params.itemId, params.listId, session.householdId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: params.itemId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { listId: string; itemId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await verifyItemOwnership(params.itemId, params.listId, session.householdId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shoppingListItem.delete({ where: { id: params.itemId } });

  return new NextResponse(null, { status: 204 });
}
