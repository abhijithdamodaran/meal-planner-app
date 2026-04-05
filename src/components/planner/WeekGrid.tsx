"use client";

import { useState } from "react";
import { useMealPlan } from "@/hooks/useMealPlan";
import { localToday } from "@/lib/date";
import { MealSlot } from "./MealSlot";
import { AddToSlotModal } from "./AddToSlotModal";
import type { MealType } from "@/types";

const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "lunch", label: "Lunch" },
  { type: "dinner", label: "Dinner" },
  { type: "snack", label: "Snacks" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Slot {
  dayOfWeek: number;
  mealType: MealType;
}

interface Props {
  weekStart: string; // YYYY-MM-DD (always a Monday)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDayDate(weekStart: string, dayOfWeek: number): string {
  const d = new Date(`${addDays(weekStart, dayOfWeek)}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function WeekGrid({ weekStart }: Props) {
  const { data: plan, isLoading } = useMealPlan(weekStart);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const today = localToday();

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-400">Loading planner…</div>;
  }

  const entries = plan?.entries ?? [];

  function entriesFor(dayOfWeek: number, mealType: string) {
    return entries.filter((e) => e.dayOfWeek === dayOfWeek && e.mealType === mealType);
  }

  const activeDay = activeSlot
    ? DAY_LABELS[activeSlot.dayOfWeek] + " " + formatDayDate(weekStart, activeSlot.dayOfWeek)
    : "";

  return (
    <>
      {/* Scrollable grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[720px] w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {/* Row label column */}
              <th className="w-24 px-3 py-2.5 text-left text-xs font-medium text-gray-400 bg-gray-50" />
              {DAY_LABELS.map((day, i) => {
                const date = addDays(weekStart, i);
                const isToday = date === today;
                return (
                  <th
                    key={day}
                    className={`px-2 py-2.5 text-center text-xs font-semibold ${
                      isToday ? "text-green-700 bg-green-50" : "text-gray-600 bg-gray-50"
                    }`}
                  >
                    <div>{day}</div>
                    <div className={`text-xs font-normal ${isToday ? "text-green-600" : "text-gray-400"}`}>
                      {formatDayDate(weekStart, i)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(({ type, label }) => (
              <tr key={type} className="border-b border-gray-50 last:border-0">
                <td className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 align-top">
                  {label}
                </td>
                {DAY_LABELS.map((_, i) => {
                  const date = addDays(weekStart, i);
                  const isToday = date === today;
                  return (
                    <td
                      key={i}
                      className={`border-l border-gray-50 align-top ${isToday ? "bg-green-50/40" : ""}`}
                    >
                      <MealSlot
                        weekStart={weekStart}
                        dayOfWeek={i}
                        mealType={type}
                        entries={entriesFor(i, type)}
                        date={date}
                        onAdd={() => setActiveSlot({ dayOfWeek: i, mealType: type })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeSlot && (
        <AddToSlotModal
          open={!!activeSlot}
          onClose={() => setActiveSlot(null)}
          weekStart={weekStart}
          dayOfWeek={activeSlot.dayOfWeek}
          mealType={activeSlot.mealType}
          dayLabel={activeDay}
        />
      )}
    </>
  );
}
