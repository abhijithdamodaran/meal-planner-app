"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnyRecipe } from "@/lib/recipe-merger";

export interface RecipeSearchResponse {
  recipes: (AnyRecipe & { id?: string })[];
  spoonacularSkipped: boolean;
}

export interface DbRecipe {
  id: string;
  externalId: string;
  source: string;
  title: string;
  imageUrl?: string | null;
  cuisines: string[];
  diets: string[];
  allergens: string[];
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: { step: number; text: string }[];
  readyInMinutes?: number | null;
  servings?: number | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
}

export interface CustomRecipeInput {
  title: string;
  servings?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  ingredients: { name: string; amount: number; unit: string }[];
  instructions: { step: number; text: string }[];
  allergens: string[];
}

async function fetchRecipeSearch(query: string): Promise<RecipeSearchResponse> {
  const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

async function fetchRecipeDetail(source: string, id: string): Promise<DbRecipe> {
  const res = await fetch(`/api/recipes/${source}/${id}`);
  if (!res.ok) throw new Error("Failed to load recipe");
  return res.json();
}

async function fetchCustomRecipes(): Promise<DbRecipe[]> {
  const res = await fetch("/api/recipes/custom");
  if (!res.ok) throw new Error("Failed to load custom recipes");
  return res.json();
}

export function useRecipeSearch(query: string) {
  return useQuery({
    queryKey: ["recipe-search", query],
    queryFn: () => fetchRecipeSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecipeDetail(source: string, id: string) {
  return useQuery({
    queryKey: ["recipe", source, id],
    queryFn: () => fetchRecipeDetail(source, id),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCustomRecipes() {
  return useQuery({
    queryKey: ["custom-recipes"],
    queryFn: fetchCustomRecipes,
    staleTime: 30 * 1000,
  });
}

export function useCreateCustomRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomRecipeInput) => {
      const res = await fetch("/api/recipes/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create recipe");
      }
      return res.json() as Promise<DbRecipe>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-recipes"] }),
  });
}
