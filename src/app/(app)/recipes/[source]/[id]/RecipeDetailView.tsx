"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAddLogEntry } from "@/hooks/useDailyLog";
import { localToday } from "@/lib/date";
import { useShoppingLists, useCreateList, useAddBulkItems } from "@/hooks/useShoppingList";
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
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [servings, setServings] = useState(String(recipe.servings ?? 1));
  const [mealType, setMealType] = useState<typeof MEALS[number]>("dinner");
  const today = localToday();
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

      {/* CTAs */}
      <div className="mb-6 flex gap-2">
        <Button onClick={() => setLogOpen(true)} className="flex-1">
          Log this meal
        </Button>
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <Button variant="secondary" onClick={() => setShoppingOpen(true)}>
            + Shopping list
          </Button>
        )}
      </div>

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

      {/* Add to shopping list modal */}
      {shoppingOpen && (
        <AddToShoppingModal
          ingredients={recipe.ingredients ?? []}
          onClose={() => setShoppingOpen(false)}
        />
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

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

function AddToShoppingModal({
  ingredients,
  onClose,
}: {
  ingredients: Ingredient[];
  onClose: () => void;
}) {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateList();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(ingredients.map((_, i) => i))
  );
  const [targetListId, setTargetListId] = useState<string>("");
  const [newListName, setNewListName] = useState("");
  const [done, setDone] = useState(false);

  const firstListId = lists?.[0]?.id ?? "";
  const effectiveListId = targetListId || firstListId;

  const addBulk = useAddBulkItems(effectiveListId);

  function toggleIngredient(i: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleAdd() {
    let listId = effectiveListId;

    if (!listId && newListName.trim()) {
      const list = await createList.mutateAsync(newListName.trim()).catch(() => null);
      if (!list) return;
      listId = list.id;
    }
    if (!listId) return;

    const items = ingredients
      .filter((_, i) => selectedIds.has(i))
      .map((ing) => ({
        ingredientName: ing.name,
        quantity: ing.amount > 0 ? ing.amount : undefined,
        unit: ing.unit || undefined,
      }));

    // Use the correct list's hook — rebuild with the resolved listId
    await fetch(`/api/shopping/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    setDone(true);
  }

  if (done) {
    return (
      <Modal open onClose={onClose} title="Added to list">
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">
            {selectedIds.size} ingredient{selectedIds.size !== 1 ? "s" : ""} added to your shopping list.
          </p>
          <Button onClick={onClose} className="w-full">Done</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Add to shopping list" maxWidth="md">
      <div className="flex flex-col gap-4 p-4">
        {/* List selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Add to list</label>
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading lists…</p>
          ) : lists && lists.length > 0 ? (
            <select
              value={targetListId || firstListId}
              onChange={(e) => setTargetListId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500">No lists yet — enter a name to create one:</p>
              <input
                type="text"
                placeholder="e.g. This week"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}
        </div>

        {/* Ingredient checkboxes */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Ingredients</label>
            <button
              className="text-xs text-gray-400 hover:text-gray-600"
              onClick={() =>
                setSelectedIds(
                  selectedIds.size === ingredients.length
                    ? new Set()
                    : new Set(ingredients.map((_, i) => i))
                )
              }
            >
              {selectedIds.size === ingredients.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white divide-y divide-gray-50">
            {ingredients.map((ing, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(i)}
                  onChange={() => toggleIngredient(i)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="flex-1 text-sm text-gray-800">{ing.name}</span>
                <span className="text-xs text-gray-400">
                  {ing.amount > 0 ? `${ing.amount} ` : ""}{ing.unit}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAdd}
            loading={addBulk.isPending || createList.isPending}
            disabled={selectedIds.size === 0 || (!effectiveListId && !newListName.trim())}
            className="flex-1"
          >
            Add {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
