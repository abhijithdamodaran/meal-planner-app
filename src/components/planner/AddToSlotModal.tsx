"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRecipeSearch } from "@/hooks/useRecipeSearch";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { useAddPlanEntry } from "@/hooks/useMealPlan";
import type { MealType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
  dayLabel: string;
}

type Tab = "recipes" | "foods";

export function AddToSlotModal({ open, onClose, weekStart, dayOfWeek, mealType, dayLabel }: Props) {
  const [tab, setTab] = useState<Tab>("recipes");
  const [recipeQuery, setRecipeQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [servings, setServings] = useState("1");
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);

  const addEntry = useAddPlanEntry(weekStart);
  const { data: recipeData, isLoading: recipesLoading } = useRecipeSearch(submittedQuery);
  const { data: foodData, isLoading: foodsLoading } = useFoodSearch(foodQuery);

  const recipes = recipeData?.recipes ?? [];
  const foods = [
    ...(foodData?.customFoods ?? []),
    ...(foodData?.foodItems ?? []),
  ];

  interface PendingItem {
    type: "recipe" | "food";
    label: string;
    recipeExternalId?: string;
    recipeSource?: "spoonacular" | "themealdb";
    customRecipeId?: string;
    foodItemId?: string;
    customFoodId?: string;
  }

  function selectRecipe(r: { externalId: string; source: string; title: string }) {
    if (r.source !== "spoonacular" && r.source !== "themealdb") return;
    setPendingItem({
      type: "recipe",
      label: r.title,
      recipeExternalId: r.externalId,
      recipeSource: r.source as "spoonacular" | "themealdb",
    });
    setServings("1");
  }

  function selectFood(f: { id: string; type: "food_item" | "custom_food"; name: string }) {
    setPendingItem({
      type: "food",
      label: f.name,
      ...(f.type === "food_item" ? { foodItemId: f.id } : { customFoodId: f.id }),
    });
    setServings("1");
  }

  async function handleAdd() {
    if (!pendingItem) return;
    await addEntry.mutateAsync({
      weekStart,
      dayOfWeek,
      mealType,
      servings: Number(servings) || 1,
      recipeExternalId: pendingItem.recipeExternalId,
      recipeSource: pendingItem.recipeSource,
      customRecipeId: pendingItem.customRecipeId,
      foodItemId: pendingItem.foodItemId,
      customFoodId: pendingItem.customFoodId,
    });
    handleClose();
  }

  function handleClose() {
    setPendingItem(null);
    setRecipeQuery("");
    setSubmittedQuery("");
    setFoodQuery("");
    setServings("1");
    onClose();
  }

  const mealLabel = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Add to ${dayLabel} — ${mealLabel}`}
      maxWidth="md"
    >
      <div className="flex flex-col">
        {pendingItem ? (
          // Confirm step — set servings
          <div className="flex flex-col gap-4 p-4">
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <p className="font-medium text-gray-900">{pendingItem.label}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Servings</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPendingItem(null)}>Back</Button>
              <Button
                onClick={handleAdd}
                loading={addEntry.isPending}
                disabled={!servings || Number(servings) <= 0}
                className="flex-1"
              >
                Add to planner
              </Button>
            </div>
            {addEntry.isError && (
              <p className="text-xs text-red-600">
                {addEntry.error instanceof Error ? addEntry.error.message : "Failed to add"}
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["recipes", "foods"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
                    tab === t
                      ? "border-b-2 border-green-600 text-green-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === "recipes" && (
              <div className="flex flex-col">
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubmittedQuery(recipeQuery.trim()); }}
                  className="flex gap-2 p-3"
                >
                  <Input
                    placeholder="Search recipes…"
                    value={recipeQuery}
                    onChange={(e) => setRecipeQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm" disabled={recipeQuery.trim().length < 2}>
                    Search
                  </Button>
                </form>
                <div className="max-h-64 overflow-y-auto">
                  {recipesLoading && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">Searching…</p>
                  )}
                  {!recipesLoading && submittedQuery && recipes.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">No results.</p>
                  )}
                  {!submittedQuery && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">Type a recipe name and press Search.</p>
                  )}
                  {recipes.map((r) => (
                    <button
                      key={`${r.source}-${r.externalId}`}
                      onClick={() => selectRecipe(r)}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{r.title}</p>
                        {r.cuisines && r.cuisines.length > 0 && (
                          <p className="text-xs text-gray-500">{r.cuisines[0]}</p>
                        )}
                      </div>
                      {r.caloriesPerServing != null && (
                        <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
                          {Math.round(r.caloriesPerServing)} kcal/srv
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === "foods" && (
              <div className="flex flex-col">
                <div className="p-3">
                  <Input
                    placeholder="Search foods…"
                    value={foodQuery}
                    onChange={(e) => setFoodQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {foodsLoading && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">Searching…</p>
                  )}
                  {!foodsLoading && foodQuery.length >= 2 && foods.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">No results.</p>
                  )}
                  {foodQuery.length < 2 && (
                    <p className="px-4 py-6 text-center text-sm text-gray-400">Type at least 2 characters.</p>
                  )}
                  {foods.map((f) => (
                    <button
                      key={`${f.type}-${f.id}`}
                      onClick={() => selectFood(f)}
                      className="flex w-full items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {f.name}
                          {f.type === "custom_food" && (
                            <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">custom</span>
                          )}
                        </p>
                        {f.brand && <p className="truncate text-xs text-gray-500">{f.brand}</p>}
                      </div>
                      {f.per100gCalories != null && (
                        <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
                          {Math.round(f.per100gCalories)} kcal/100g
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
