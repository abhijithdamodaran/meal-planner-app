"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserPreferences } from "@/types";

async function fetchPreferences(): Promise<UserPreferences> {
  const res = await fetch("/api/settings/preferences");
  if (!res.ok) throw new Error("Failed to load preferences");
  return res.json();
}

async function savePreferences(data: UserPreferences): Promise<UserPreferences> {
  const res = await fetch("/api/settings/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to save preferences");
  }
  return res.json();
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: fetchPreferences,
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(["preferences"], data);
    },
  });
}
