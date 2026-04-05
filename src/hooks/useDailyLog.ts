"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealType, LogUnit } from "@/types";

export interface LogEntry {
  id: string;
  mealType: MealType;
  quantity: number;
  unit: LogUnit;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
  customName?: string | null;
  foodItem?: { id: string; name: string; brand?: string | null } | null;
  customFood?: { id: string; name: string; brand?: string | null } | null;
  recipe?: { id: string; title: string } | null;
  customRecipe?: { id: string; title: string } | null;
}

export interface AddLogEntryInput {
  date: string; // YYYY-MM-DD
  mealType: MealType;
  quantity: number;
  unit: LogUnit;
  foodItemId?: string;
  customFoodId?: string;
  recipeId?: string;
  customRecipeId?: string;
  customName?: string;
  // Manual macro override for foods with missing nutrition data
  manualCalories?: number;
  manualProteinG?: number;
  manualCarbsG?: number;
  manualFatG?: number;
}

export interface UpdateLogEntryInput {
  id: string;
  quantity: number;
  unit: LogUnit;
  mealType: MealType;
}

function logKey(date: string) {
  return ["daily-log", date];
}

async function fetchDailyLog(date: string): Promise<LogEntry[]> {
  const res = await fetch(`/api/logs?date=${date}`);
  if (!res.ok) throw new Error("Failed to load log");
  return res.json();
}

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: logKey(date),
    queryFn: () => fetchDailyLog(date),
    staleTime: 30 * 1000,
  });
}

export function useAddLogEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddLogEntryInput) => {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add entry");
      }
      return res.json() as Promise<LogEntry>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: logKey(date) }),
  });
}

export function useUpdateLogEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateLogEntryInput) => {
      const res = await fetch(`/api/logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update entry");
      }
      return res.json() as Promise<LogEntry>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: logKey(date) }),
  });
}

export function useDeleteLogEntry(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: logKey(date) }),
  });
}
