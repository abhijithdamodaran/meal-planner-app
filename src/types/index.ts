// ─── Auth ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  householdId: string;
}

// ─── Meal types ───────────────────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export type LogUnit = "g" | "ml" | "serving";

// ─── Food ─────────────────────────────────────────────────────────────────────

export interface FoodItemSummary {
  id: string;
  offId: string;
  name: string;
  brand?: string | null;
  per100gCalories?: number | null;
  per100gProtein?: number | null;
  per100gCarbs?: number | null;
  per100gFat?: number | null;
  servingSizeG?: number | null;
}

export interface CustomFoodSummary {
  id: string;
  name: string;
  brand?: string | null;
  per100gCalories?: number | null;
  per100gProtein?: number | null;
  per100gCarbs?: number | null;
  per100gFat?: number | null;
  servingSizeG?: number | null;
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export type RecipeSource = "spoonacular" | "themealdb";

export interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeInstruction {
  step: number;
  text: string;
}

export interface RecipeSummary {
  id: string;
  externalId: string;
  source: RecipeSource;
  title: string;
  imageUrl?: string | null;
  cuisines: string[];
  diets: string[];
  allergens: string[];
  readyInMinutes?: number | null;
  servings?: number | null;
  caloriesPerServing?: number | null;
  proteinPerServing?: number | null;
  carbsPerServing?: number | null;
  fatPerServing?: number | null;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
}

// ─── Food log ─────────────────────────────────────────────────────────────────

export interface FoodLogEntry {
  id: string;
  mealType: MealType;
  customName?: string | null;
  quantity: number;
  unit: LogUnit;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
  foodItem?: FoodItemSummary | null;
  customFood?: CustomFoodSummary | null;
  recipe?: RecipeSummary | null;
}

export interface DailyLog {
  date: string; // ISO date string YYYY-MM-DD
  entries: FoodLogEntry[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

// ─── User preferences ────────────────────────────────────────────────────────

export interface UserPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  isLactoseIntolerant: boolean;
  isGlutenFree: boolean;
  otherAllergens: string[];
  calorieGoal?: number | null;
  proteinGoalG?: number | null;
  carbsGoalG?: number | null;
  fatGoalG?: number | null;
}

// ─── Meal plan ────────────────────────────────────────────────────────────────

export interface MealPlanSlot {
  dayOfWeek: number; // 0=Mon … 6=Sun
  mealType: MealType;
  entry?: {
    id: string;
    customName?: string | null;
    servings: number;
    notes?: string | null;
    recipe?: RecipeSummary | null;
    foodItem?: FoodItemSummary | null;
    customFood?: CustomFoodSummary | null;
  } | null;
}

// ─── Shopping list ────────────────────────────────────────────────────────────

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  items: ShoppingListItem[];
}

export interface ShoppingListItem {
  id: string;
  ingredientName: string;
  quantity?: number | null;
  unit?: string | null;
  isChecked: boolean;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;
