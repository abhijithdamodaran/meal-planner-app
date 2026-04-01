"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface SessionUser {
  userId: string;
  email: string;
  name: string;
  householdId: string;
  householdName: string;
  inviteCode: string;
}

async function fetchSession(): Promise<SessionUser | null> {
  const res = await fetch("/api/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch session");
  return res.json();
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    router.push("/login");
  };
}
