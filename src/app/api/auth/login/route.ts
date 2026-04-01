import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, createSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { household: true },
  });

  // Use consistent error to avoid user enumeration
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    householdId: user.householdId,
  });

  const response = NextResponse.json({
    userId: user.id,
    email: user.email,
    name: user.name,
    householdId: user.householdId,
    householdName: user.household.name,
  });
  response.cookies.set(createSessionCookie(token));
  return response;
}
