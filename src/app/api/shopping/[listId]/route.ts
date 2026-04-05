import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { listId: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.shoppingList.findUnique({
    where: { id: params.listId },
  });
  if (!list || list.householdId !== session.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete items first, then list
  await prisma.shoppingListItem.deleteMany({ where: { shoppingListId: params.listId } });
  await prisma.shoppingList.delete({ where: { id: params.listId } });

  return new NextResponse(null, { status: 204 });
}
