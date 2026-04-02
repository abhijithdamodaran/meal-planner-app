"use client";

import { useQuery } from "@tanstack/react-query";

export interface DaySummary {
  date: string; // YYYY-MM-DD
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

async function fetchSummary(from: string, to: string): Promise<DaySummary[]> {
  const res = await fetch(`/api/logs/summary?from=${from}&to=${to}`);
  if (!res.ok) throw new Error("Failed to load summary");
  return res.json();
}

export function useWeeklySummary(from: string, to: string) {
  return useQuery({
    queryKey: ["log-summary", from, to],
    queryFn: () => fetchSummary(from, to),
    staleTime: 60 * 1000,
  });
}
