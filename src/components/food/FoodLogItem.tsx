"use client";

import type { LogEntry } from "@/hooks/useDailyLog";

interface Props {
  entry: LogEntry;
  onEdit: (entry: LogEntry) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function FoodLogItem({ entry, onEdit, onDelete, deleting }: Props) {
  const name =
    entry.foodItem?.name ??
    entry.customFood?.name ??
    entry.recipe?.title ??
    entry.customRecipe?.title ??
    entry.customName ??
    "Unknown";

  const brand = entry.foodItem?.brand ?? entry.customFood?.brand;

  return (
    <div className={`flex items-center justify-between py-2.5 transition-opacity ${deleting ? "opacity-40" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-400">
          {brand ? `${brand} · ` : ""}
          {entry.quantity}{entry.unit}
        </p>
      </div>

      {/* Macros */}
      <div className="mx-4 hidden sm:flex gap-4 text-right text-xs text-gray-500">
        <span className="w-14 font-medium text-gray-700">{entry.calories} kcal</span>
        <span className="w-12">P {entry.proteinG}g</span>
        <span className="w-12">C {entry.carbsG}g</span>
        <span className="w-12">F {entry.fatG}g</span>
      </div>
      {/* Mobile — calories only */}
      <span className="mx-3 text-sm font-medium text-gray-700 sm:hidden">{entry.calories} kcal</span>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Edit"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          disabled={deleting}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
          title="Delete"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
