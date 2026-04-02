"use client";

import { useState } from "react";
import { WeekGrid } from "@/components/planner/WeekGrid";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

function offsetWeek(weekStart: string, weeks: number): string {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00Z`);
  const end = new Date(`${weekStart}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

export default function PlannerPage() {
  const thisWeek = getWeekStart(new Date());
  const [weekStart, setWeekStart] = useState(thisWeek);
  const isThisWeek = weekStart === thisWeek;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
          <p className="mt-0.5 text-sm text-gray-500">Shared with your household</p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => offsetWeek(w, -1))}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ←
          </button>
          <div className="min-w-[180px] text-center">
            <p className="text-sm font-semibold text-gray-900">{formatWeekRange(weekStart)}</p>
            {isThisWeek && (
              <p className="text-xs text-green-600">This week</p>
            )}
          </div>
          <button
            onClick={() => setWeekStart((w) => offsetWeek(w, 1))}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            →
          </button>
          {!isThisWeek && (
            <button
              onClick={() => setWeekStart(thisWeek)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <WeekGrid weekStart={weekStart} />

      <p className="mt-3 text-xs text-gray-400">
        Click + to add a meal. Hover entries to log, edit servings, or remove.
      </p>
    </div>
  );
}
