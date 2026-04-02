"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAddLogEntry } from "@/hooks/useDailyLog";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { DbRecipe } from "@/hooks/useRecipeSearch";

interface Props {
  recipe: DbRecipe;
}

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export function RecipeDetailView({ recipe }: Props) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [servings, setServings] = useState(String(recipe.servings ?? 1));
  const [mealType, setMealType] = useState<typeof MEALS[number]>("dinner");
  const today = new Date().toISOString().split("T")[0];
  const addEntry = useAddLogEntry(today);

  const isTheMealDB = recipe.source === "themealdb";
  const isCustom = recipe.source === "custom";

  const perServing = servings
    ? {
        calories: (recipe.caloriesPerServing ?? 0) * Number(servings),
        protein: (recipe.proteinPerServing ?? 0) * Number(servings),
        carbs: (recipe.carbsPerServing ?? 0) * Number(servings),
        fat: (recipe.fatPerServing ?? 0) * Number(servings),
      }
    : null;

  async function handleLog() {
    await addEntry.mutateAsync({
      date: today,
      mealType,
      quantity: Number(servings) || 1,
      unit: "serving",
      ...(isCustom ? { customRecipeId: recipe.id } : { recipeId: recipe.id }),
    });
    setLogOpen(false);
    router.push(`/log/${today}`);
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back
      </button>

      {/* Header image */}
      {recipe.imageUrl && (
        <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl">
          <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
        </div>
      )}

      {/* Title + meta */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {recipe.cuisines?.map((c) => (
            <span key={c} className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">{c}</span>
          ))}
          {recipe.diets?.map((d) => (
            <span key={d} className="rounded bg-green-100 px-2 py-0.5 text-green-700">{d}</span>
          ))}
          {recipe.readyInMinutes && (
            <span className="text-gray-400">{recipe.readyInMinutes} min</span>
          )}
          {recipe.servings && (
            <span className="text-gray-400">{recipe.servings} servings</span>
          )}
        </div>
      </div>

      {/* Allergen warning */}
      {isTheMealDB && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Allergen info unavailable for TheMealDB recipes.
        </div>
      )}
      {!isTheMealDB && recipe.allergens && recipe.allergens.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Contains: {recipe.allergens.join(", ")}
        </div>
      )}

      {/* Macros card */}
      {recipe.caloriesPerServing != null && (
        <div className="mb-6 grid grid-cols-4 gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center">
          {[
            { label: "Calories", value: recipe.caloriesPerServing, unit: "kcal" },
            { label: "Protein", value: recipe.proteinPerServing, unit: "g" },
            { label: "Carbs", value: recipe.carbsPerServing, unit: "g" },
            { label: "Fat", value: recipe.fatPerServing, unit: "g" },
          ].map(({ label, value, unit }) => (
            <div key={label}>
              <p className="text-lg font-bold text-gray-900">{value != null ? Math.round(value) : "—"}</p>
              <p className="text-xs text-gray-400">{unit}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
          <p className="col-span-4 text-xs text-gray-400 mt-1">per serving</p>
        </div>
      )}

      {/* Log meal CTA */}
      <Button onClick={() => setLogOpen(true)} className="mb-6 w-full">
        Log this meal
      </Button>

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Ingredients</h2>
          <ul className="divide-y divide-gray-50 rounded-xl border border-gray-200 bg-white">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-gray-900">{ing.name}</span>
                <span className="text-gray-500">
                  {ing.amount > 0 ? `${ing.amount} ` : ""}{ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructions */}
      {recipe.instructions && recipe.instructions.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Instructions</h2>
          <ol className="flex flex-col gap-4">
            {recipe.instructions.map((inst) => (
              <li key={inst.step} className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {inst.step}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{inst.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Log modal */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log this meal">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Meal</label>
            <div className="flex flex-wrap gap-2">
              {MEALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    mealType === m ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
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

          {perServing && recipe.caloriesPerServing != null && (
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-center text-xs">
              <div><p className="font-semibold text-gray-900">{Math.round(perServing.calories)}</p><p className="text-gray-400">kcal</p></div>
              <div><p className="font-semibold text-gray-900">{Math.round(perServing.protein)}g</p><p className="text-gray-400">protein</p></div>
              <div><p className="font-semibold text-gray-900">{Math.round(perServing.carbs)}g</p><p className="text-gray-400">carbs</p></div>
              <div><p className="font-semibold text-gray-900">{Math.round(perServing.fat)}g</p><p className="text-gray-400">fat</p></div>
            </div>
          )}

          <Button onClick={handleLog} loading={addEntry.isPending} disabled={!servings || Number(servings) <= 0} className="w-full">
            Add to log
          </Button>
          {addEntry.isError && (
            <p className="text-xs text-red-600">
              {addEntry.error instanceof Error ? addEntry.error.message : "Failed to log"}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
