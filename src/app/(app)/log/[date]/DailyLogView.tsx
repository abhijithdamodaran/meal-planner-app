"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDailyLog, useDeleteLogEntry, type LogEntry } from "@/hooks/useDailyLog";
import { FoodSearchModal } from "@/components/food/FoodSearchModal";
import { EditLogEntryModal } from "@/components/food/EditLogEntryModal";
import { FoodLogItem } from "@/components/food/FoodLogItem";
import { Button } from "@/components/ui/Button";
import type { MealType } from "@/types";

const MEAL_TYPES: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌙" },
  { type: "snack", label: "Snacks", icon: "🍎" },
];

interface Goals {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

interface Props {
  date: string;
  goals: Goals;
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export function DailyLogView({ date, goals }: Props) {
  const router = useRouter();
  const { data: entries = [], isLoading } = useDailyLog(date);
  const deleteEntry = useDeleteLogEntry(date);

  const [searchOpen, setSearchOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");
  const [editingEntry, setEditingEntry] = useState<LogEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openSearch(meal: MealType) {
    setActiveMeal(meal);
    setSearchOpen(true);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteEntry.mutateAsync(id).catch(() => {});
    setDeletingId(null);
  }

  const today = new Date().toISOString().split("T")[0];

  // Totals
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  return (
    <div className="max-w-2xl">
      {/* Date navigation */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push(`/log/${offsetDate(date, -1)}`)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ←
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-gray-900">
          {formatDate(date)}
        </h1>
        <button
          onClick={() => router.push(`/log/${offsetDate(date, 1)}`)}
          disabled={date >= today}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
        >
          →
        </button>
      </div>

      {/* Daily summary bar */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <TotalCell
            label="Calories"
            value={Math.round(totals.calories)}
            goal={goals.calories}
            unit="kcal"
          />
          <TotalCell label="Protein" value={Math.round(totals.proteinG)} goal={goals.proteinG} unit="g" />
          <TotalCell label="Carbs" value={Math.round(totals.carbsG)} goal={goals.carbsG} unit="g" />
          <TotalCell label="Fat" value={Math.round(totals.fatG)} goal={goals.fatG} unit="g" />
        </div>

        {/* Calorie progress bar */}
        {goals.calories && (
          <div className="mt-3">
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all ${
                  totals.calories > goals.calories ? "bg-red-400" : "bg-green-500"
                }`}
                style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-gray-400">
              {Math.round(goals.calories - totals.calories > 0 ? goals.calories - totals.calories : 0)} kcal remaining
            </p>
          </div>
        )}
      </div>

      {/* Meal sections */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="flex flex-col gap-4">
          {MEAL_TYPES.map(({ type, label, icon }) => {
            const mealEntries = entries.filter((e) => e.mealType === type);
            const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);

            return (
              <div key={type} className="rounded-xl border border-gray-200 bg-white">
                {/* Meal header */}
                <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="font-semibold text-gray-900">{label}</span>
                    {mealCals > 0 && (
                      <span className="text-xs text-gray-400">{Math.round(mealCals)} kcal</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openSearch(type)}
                    className="text-green-600 hover:bg-green-50"
                  >
                    + Add
                  </Button>
                </div>

                {/* Entries */}
                <div className="divide-y divide-gray-50 px-4">
                  {mealEntries.length === 0 ? (
                    <p className="py-4 text-sm text-gray-400">Nothing logged yet.</p>
                  ) : (
                    mealEntries.map((entry) => (
                      <FoodLogItem
                        key={entry.id}
                        entry={entry}
                        onEdit={setEditingEntry}
                        onDelete={handleDelete}
                        deleting={deletingId === entry.id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <FoodSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        date={date}
        defaultMealType={activeMeal}
      />
      <EditLogEntryModal
        entry={editingEntry}
        date={date}
        onClose={() => setEditingEntry(null)}
      />
    </div>
  );
}

function TotalCell({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
}) {
  const over = goal != null && value > goal;
  return (
    <div>
      <p className={`text-lg font-bold ${over ? "text-red-500" : "text-gray-900"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400">
        {unit}
        {goal ? ` / ${goal}` : ""}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
