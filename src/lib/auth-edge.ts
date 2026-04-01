// Edge Runtime compatible — safe to import from middleware.ts
// Uses jose instead of jsonwebtoken (which requires Node.js APIs)
import { jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  householdId: string;
}

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function verifyTokenEdge(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
