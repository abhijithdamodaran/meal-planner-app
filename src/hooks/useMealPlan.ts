"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealType } from "@/types";

export interface PlanEntry {
  id: string;
  dayOfWeek: number;
  mealType: string;
  servings: number;
  notes?: string | null;
  customName?: string | null;
  recipe?: { id: string; externalId: string; source: string; title: string; imageUrl?: string | null } | null;
  customRecipe?: { id: string; title: string } | null;
  foodItem?: { id: string; name: string; brand?: string | null } | null;
  customFood?: { id: string; name: string; brand?: string | null } | null;
}

export interface MealPlan {
  id: string;
  weekStart: string;
  entries: PlanEntry[];
}

export interface AddEntryInput {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
  servings: number;
  notes?: string;
  recipeExternalId?: string;
  recipeSource?: "spoonacular" | "themealdb";
  customRecipeId?: string;
  foodItemId?: string;
  customFoodId?: string;
  customName?: string;
}

function planKey(weekStart: string) {
  return ["meal-plan", weekStart];
}

export function useMealPlan(weekStart: string) {
  return useQuery({
    queryKey: planKey(weekStart),
    queryFn: async () => {
      const res = await fetch(`/api/planner?weekStart=${weekStart}`);
      if (!res.ok) throw new Error("Failed to load plan");
      return res.json() as Promise<MealPlan>;
    },
    staleTime: 30 * 1000,
  });
}

export function useAddPlanEntry(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddEntryInput) => {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add");
      }
      return res.json() as Promise<PlanEntry>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: planKey(weekStart) }),
  });
}

export function useUpdatePlanEntry(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, servings, notes }: { id: string; servings?: number; notes?: string }) => {
      const res = await fetch(`/api/planner/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servings, notes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: planKey(weekStart) }),
  });
}

export function useDeletePlanEntry(weekStart: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/planner/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: planKey(weekStart) }),
  });
}
