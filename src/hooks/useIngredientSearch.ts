"use client";

import { useQuery } from "@tanstack/react-query";
import type { IngredientRecipe } from "@/app/api/recipes/by-ingredients/route";

export type { IngredientRecipe };

interface IngredientSearchResponse {
  recipes: IngredientRecipe[];
  spoonacularSkipped: boolean;
}

async function fetchByIngredients(ingredients: string[]): Promise<IngredientSearchResponse> {
  const res = await fetch(
    `/api/recipes/by-ingredients?ingredients=${encodeURIComponent(ingredients.join(","))}`
  );
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function useIngredientSearch(ingredients: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["by-ingredients", ingredients.slice().sort().join(",")],
    queryFn: () => fetchByIngredients(ingredients),
    enabled: enabled && ingredients.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
