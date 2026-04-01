import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return fresh data from DB in case name/household changed
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { household: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    name: user.name,
    householdId: user.householdId,
    householdName: user.household.name,
    inviteCode: user.household.inviteCode,
  });
}
