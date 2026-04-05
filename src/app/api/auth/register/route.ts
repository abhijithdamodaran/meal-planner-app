import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, createSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  // Either create a new household or join an existing one
  householdName: z.string().min(1).max(100).optional(),
  inviteCode: z.string().min(1).optional(),
}).refine(
  (d) => d.householdName || d.inviteCode,
  { message: "Provide either a household name (create) or an invite code (join)" }
);

export async function POST(request: NextRequest) {
  // 5 registrations per hour per IP
  const ip = getClientIp(request);
  if (!checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password, householdName, inviteCode } = parsed.data;

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  let householdId: string;

  if (inviteCode) {
    // Join existing household
    const household = await prisma.household.findUnique({ where: { inviteCode } });
    if (!household) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }
    householdId = household.id;
  } else {
    // Create new household
    const household = await prisma.household.create({
      data: { name: householdName! },
    });
    householdId = household.id;

    // Create a default shopping list for new households
    await prisma.shoppingList.create({
      data: { householdId, name: "Shopping List" },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      householdId,
      preferences: { create: {} }, // Default empty preferences
    },
    include: { household: true },
  });

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
