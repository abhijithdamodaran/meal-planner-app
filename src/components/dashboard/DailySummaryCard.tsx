"use client";

import Link from "next/link";
import { useDailyLog } from "@/hooks/useDailyLog";
import { MacroRing } from "./MacroRing";

interface Goals {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

interface Props {
  date: string; // today YYYY-MM-DD
  goals: Goals;
}

export function DailySummaryCard({ date, goals }: Props) {
  const { data: entries = [], isLoading } = useDailyLog(date);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const calPct = goals.calories ? Math.min((totals.calories / goals.calories) * 100, 100) : 0;
  const calOver = goals.calories != null && totals.calories > goals.calories;
  const remaining = goals.calories ? Math.max(goals.calories - totals.calories, 0) : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Today&apos;s Nutrition</h2>
        <Link
          href={`/log/${date}`}
          className="text-xs font-medium text-green-600 hover:text-green-700"
        >
          View log →
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          {/* Calorie bar */}
          <div className="mb-5">
            <div className="mb-1 flex items-end justify-between">
              <span className="text-3xl font-bold text-gray-900">
                {Math.round(totals.calories)}
              </span>
              {goals.calories && (
                <span className="text-sm text-gray-400">/ {goals.calories} kcal</span>
              )}
            </div>
            {goals.calories && (
              <>
                <div className="h-2.5 rounded-full bg-gray-100">
                  <div
                    className={`h-2.5 rounded-full transition-all ${calOver ? "bg-red-400" : "bg-green-500"}`}
                    style={{ width: `${calPct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-gray-400">
                  {remaining != null && remaining > 0
                    ? `${Math.round(remaining)} kcal remaining`
                    : calOver
                    ? `${Math.round(totals.calories - goals.calories!)} kcal over`
                    : "Goal reached!"}
                </p>
              </>
            )}
          </div>

          {/* Macro rings */}
          <div className="flex justify-around">
            <MacroRing
              label="Protein"
              value={totals.proteinG}
              goal={goals.proteinG}
              unit="g"
              ringColor="stroke-blue-500"
            />
            <MacroRing
              label="Carbs"
              value={totals.carbsG}
              goal={goals.carbsG}
              unit="g"
              ringColor="stroke-amber-400"
            />
            <MacroRing
              label="Fat"
              value={totals.fatG}
              goal={goals.fatG}
              unit="g"
              ringColor="stroke-rose-400"
            />
          </div>
        </>
      )}
    </div>
  );
}
