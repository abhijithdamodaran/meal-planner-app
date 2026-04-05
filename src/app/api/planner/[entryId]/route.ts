import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  servings: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

interface Params { params: { entryId: string } }

async function getEntryForHousehold(entryId: string, householdId: string) {
  return prisma.mealPlanEntry.findFirst({
    where: {
      id: entryId,
      mealPlan: { householdId },
    },
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await getEntryForHousehold(params.entryId, session.householdId);
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.mealPlanEntry.update({
    where: { id: params.entryId },
    data: {
      ...(parsed.data.servings !== undefined && { servings: parsed.data.servings }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await getEntryForHousehold(params.entryId, session.householdId);
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await prisma.mealPlanEntry.delete({ where: { id: params.entryId } });
  return new NextResponse(null, { status: 204 });
}
