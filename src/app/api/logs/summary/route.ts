import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");

  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "from and to params required (YYYY-MM-DD)" }, { status: 400 });
  }

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);

  const entries = await prisma.foodLog.findMany({
    where: {
      userId: session.userId,
      loggedDate: { gte: start, lte: end },
    },
    select: {
      loggedDate: true,
      calories: true,
      proteinG: true,
      carbsG: true,
      fatG: true,
    },
    orderBy: { loggedDate: "asc" },
  });

  // Aggregate by date
  const byDate: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number }> = {};

  for (const e of entries) {
    const dateKey = e.loggedDate.toISOString().split("T")[0];
    if (!byDate[dateKey]) {
      byDate[dateKey] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    }
    byDate[dateKey].calories += e.calories;
    byDate[dateKey].proteinG += e.proteinG;
    byDate[dateKey].carbsG += e.carbsG;
    byDate[dateKey].fatG += e.fatG;
  }

  // Build ordered array filling in missing days with zeros
  const result: Array<{ date: string; calories: number; proteinG: number; carbsG: number; fatG: number }> = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const endDate = new Date(`${to}T00:00:00.000Z`);

  while (cursor <= endDate) {
    const key = cursor.toISOString().split("T")[0];
    result.push({ date: key, ...(byDate[key] ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return NextResponse.json(result);
}
