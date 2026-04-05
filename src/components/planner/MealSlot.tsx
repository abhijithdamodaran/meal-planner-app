"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeletePlanEntry, useUpdatePlanEntry } from "@/hooks/useMealPlan";
import { useAddLogEntry } from "@/hooks/useDailyLog";
import { localToday } from "@/lib/date";
import type { PlanEntry } from "@/hooks/useMealPlan";
import type { MealType } from "@/types";

interface Props {
  weekStart: string;
  dayOfWeek: number;
  mealType: MealType;
  entries: PlanEntry[];
  date: string; // YYYY-MM-DD for this day
  onAdd: () => void;
}

function entryLabel(e: PlanEntry): string {
  return e.recipe?.title ?? e.customRecipe?.title ?? e.foodItem?.name ?? e.customFood?.name ?? e.customName ?? "Unknown";
}

export function MealSlot({ weekStart, entries, date, onAdd }: Props) {
  const deleteEntry = useDeletePlanEntry(weekStart);
  const updateEntry = useUpdatePlanEntry(weekStart);
  const addLog = useAddLogEntry(date);
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editServings, setEditServings] = useState("1");
  const today = localToday();

  async function handleDelete(id: string) {
    await deleteEntry.mutateAsync(id).catch(() => {});
  }

  function startEdit(e: PlanEntry) {
    setEditingId(e.id);
    setEditServings(String(e.servings));
  }

  async function saveEdit(id: string) {
    await updateEntry.mutateAsync({ id, servings: Number(editServings) || 1 }).catch(() => {});
    setEditingId(null);
  }

  async function handleLog(e: PlanEntry) {
    const mealType = e.mealType as MealType;
    await addLog.mutateAsync({
      date,
      mealType,
      quantity: e.servings,
      unit: "serving",
      ...(e.recipe ? { recipeId: e.recipe.id } : {}),
      ...(e.customRecipe ? { customRecipeId: e.customRecipe.id } : {}),
      ...(e.foodItem ? { foodItemId: e.foodItem.id } : {}),
      ...(e.customFood ? { customFoodId: e.customFood.id } : {}),
      ...(e.customName && !e.recipe && !e.customRecipe && !e.foodItem && !e.customFood
        ? { customName: e.customName }
        : {}),
    }).catch(() => {});
    router.push(`/log/${date}`);
  }

  return (
    <div className="flex min-h-[80px] flex-col gap-1 p-1.5">
      {entries.map((e) => (
        <div
          key={e.id}
          className="group relative rounded-md bg-green-50 border border-green-100 px-2 py-1.5 text-xs"
        >
          {editingId === e.id ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={editServings}
                onChange={(ev) => setEditServings(ev.target.value)}
                className="w-12 rounded border border-gray-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
              />
              <span className="text-gray-400">srv</span>
              <button
                onClick={() => saveEdit(e.id)}
                className="ml-1 text-green-600 font-medium hover:text-green-800"
              >✓</button>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-400 hover:text-gray-600"
              >✕</button>
            </div>
          ) : (
            <>
              <p className="truncate font-medium text-gray-800 pr-4">{entryLabel(e)}</p>
              <p className="text-gray-500">{e.servings} srv</p>
              {/* Action buttons — show on hover */}
              <div className="absolute right-1 top-1 hidden group-hover:flex gap-0.5">
                {/* Log button — only for today or future dates */}
                {date >= today && (
                  <button
                    onClick={() => handleLog(e)}
                    title="Log this meal"
                    className="rounded p-0.5 text-green-600 hover:bg-green-100"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </button>
                )}
                {/* Edit servings */}
                <button
                  onClick={() => startEdit(e)}
                  title="Edit servings"
                  className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(e.id)}
                  title="Remove"
                  className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={onAdd}
        className="flex items-center justify-center rounded-md border border-dashed border-gray-200 py-1 text-xs text-gray-400 hover:border-green-300 hover:text-green-600 transition-colors"
      >
        +
      </button>
    </div>
  );
}
