// Helpers to bridge between the typed recipe structures used in the app
// and the String-JSON columns in the DB (cuisines, diets, allergens, ingredients, instructions).

import type { AnyRecipe } from "./recipe-merger";

export interface RecipeDbFields {
  externalId: string;
  source: string;
  title: string;
  imageUrl?: string | null;
  cuisines: string;     // JSON string
  diets: string;
  allergens: string;
  ingredients: string;
  instructions: string;
  readyInMinutes?: number | null;
  servings?: number | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
}

/** Serialize an AnyRecipe for Prisma create/update (arrays → JSON strings). */
export function serializeRecipe(r: AnyRecipe): RecipeDbFields {
  return {
    externalId: r.externalId,
    source: r.source,
    title: r.title,
    imageUrl: r.imageUrl ?? null,
    cuisines: JSON.stringify(r.cuisines),
    diets: JSON.stringify(r.diets),
    allergens: JSON.stringify(r.allergens),
    ingredients: JSON.stringify(r.ingredients),
    instructions: JSON.stringify(r.instructions),
    readyInMinutes: r.readyInMinutes ?? null,
    servings: r.servings ?? null,
    caloriesPerServing: r.caloriesPerServing ?? null,
    proteinPerServing: r.proteinPerServing ?? null,
    carbsPerServing: r.carbsPerServing ?? null,
    fatPerServing: r.fatPerServing ?? null,
  };
}

export interface ParsedRecipe {
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

type RawDbRecipe = {
  id: string;
  externalId: string;
  source: string;
  title: string;
  imageUrl?: string | null;
  cuisines: string;
  diets: string;
  allergens: string;
  ingredients: string;
  instructions: string;
  readyInMinutes?: number | null;
  servings?: number | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
};

function safeJsonParse<T>(val: string, fallback: T): T {
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

/** Parse JSON string columns back to typed arrays. */
export function parseRecipe(r: RawDbRecipe): ParsedRecipe {
  return {
    ...r,
    cuisines: safeJsonParse(r.cuisines, []),
    diets: safeJsonParse(r.diets, []),
    allergens: safeJsonParse(r.allergens, []),
    ingredients: safeJsonParse(r.ingredients, []),
    instructions: safeJsonParse(r.instructions, []),
  };
}
