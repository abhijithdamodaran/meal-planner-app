"use client";

import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import { localToday } from "@/lib/date";

interface Goals {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

interface Props {
  from: string; // YYYY-MM-DD (7 days ago)
  to: string;   // YYYY-MM-DD (today)
  goals: Goals;
}

function formatDay(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const today = localToday();
  if (dateStr === today) return "Today";
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function Bar({ value, goal, color }: { value: number; goal: number | null; color: string }) {
  if (!goal || value === 0) return <div className="h-1 w-full rounded-full bg-gray-100" />;
  const pct = Math.min((value / goal) * 100, 100);
  const over = value > goal;
  return (
    <div className="h-1 w-full rounded-full bg-gray-100">
      <div
        className={`h-1 rounded-full ${over ? "bg-red-400" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function WeeklyTable({ from, to, goals }: Props) {
  const { data: days = [], isLoading } = useWeeklySummary(from, to);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">This Week</h2>
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  // Compute 7-day averages (only days with any logged data)
  const loggedDays = days.filter((d) => d.calories > 0);
  const avg =
    loggedDays.length > 0
      ? {
          calories: loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length,
          proteinG: loggedDays.reduce((s, d) => s + d.proteinG, 0) / loggedDays.length,
          carbsG: loggedDays.reduce((s, d) => s + d.carbsG, 0) / loggedDays.length,
          fatG: loggedDays.reduce((s, d) => s + d.fatG, 0) / loggedDays.length,
        }
      : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">This Week</h2>
        {avg && (
          <span className="text-xs text-gray-400">
            Avg {Math.round(avg.calories)} kcal/day
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div key={d.date} className="text-xs font-medium text-gray-500">
            {formatDay(d.date)}
          </div>
        ))}
      </div>

      {/* Calorie bars */}
      <div className="mb-3 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const pct = goals.calories ? Math.min((d.calories / goals.calories) * 100, 100) : 0;
          const over = goals.calories != null && d.calories > goals.calories;
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="relative flex h-14 w-full items-end justify-center">
                {d.calories > 0 && (
                  <div
                    className={`w-full max-w-[28px] rounded-t-sm ${over ? "bg-red-300" : "bg-green-400"}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                    title={`${Math.round(d.calories)} kcal`}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500">
                {d.calories > 0 ? Math.round(d.calories) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Macro mini-bars */}
      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
        {[
          { label: "Protein", key: "proteinG" as const, goal: goals.proteinG, color: "bg-blue-400" },
          { label: "Carbs", key: "carbsG" as const, goal: goals.carbsG, color: "bg-amber-400" },
          { label: "Fat", key: "fatG" as const, goal: goals.fatG, color: "bg-rose-400" },
        ].map(({ label, key, goal, color }) => (
          <div key={label} className="grid grid-cols-[60px_1fr_48px] items-center gap-2 text-xs">
            <span className="text-gray-500">{label}</span>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => (
                <Bar key={d.date} value={d[key]} goal={goal} color={color} />
              ))}
            </div>
            <span className="text-right text-gray-400">
              {avg ? `${Math.round(avg[key])}g` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
