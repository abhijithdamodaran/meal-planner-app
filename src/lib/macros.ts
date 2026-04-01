export interface MacroResult {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface Per100g {
  per100gCalories?: number | null;
  per100gProtein?: number | null;
  per100gCarbs?: number | null;
  per100gFat?: number | null;
  servingSizeG?: number | null;
}

interface PerServing {
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
}

export function calculateFoodMacros(
  food: Per100g,
  quantity: number,
  unit: "g" | "ml" | "serving"
): MacroResult {
  let multiplier = 0;

  if (unit === "g" || unit === "ml") {
    multiplier = quantity / 100;
  } else if (unit === "serving") {
    const servingG = food.servingSizeG ?? 100;
    multiplier = (quantity * servingG) / 100;
  }

  return {
    calories: round((food.per100gCalories ?? 0) * multiplier),
    proteinG: round((food.per100gProtein ?? 0) * multiplier),
    carbsG: round((food.per100gCarbs ?? 0) * multiplier),
    fatG: round((food.per100gFat ?? 0) * multiplier),
  };
}

export function calculateRecipeMacros(
  recipe: PerServing,
  servings: number
): MacroResult {
  return {
    calories: round((recipe.caloriesPerServing ?? 0) * servings),
    proteinG: round((recipe.proteinPerServing ?? 0) * servings),
    carbsG: round((recipe.carbsPerServing ?? 0) * servings),
    fatG: round((recipe.fatPerServing ?? 0) * servings),
  };
}

export function sumMacros(entries: MacroResult[]): MacroResult {
  return entries.reduce(
    (acc, e) => ({
      calories: round(acc.calories + e.calories),
      proteinG: round(acc.proteinG + e.proteinG),
      carbsG: round(acc.carbsG + e.carbsG),
      fatG: round(acc.fatG + e.fatG),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
