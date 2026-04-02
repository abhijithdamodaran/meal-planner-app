"use client";

import { useState } from "react";
import { FoodSearchModal } from "@/components/food/FoodSearchModal";
import type { MealType } from "@/types";

interface Props {
  date: string;
}

const MEALS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌙" },
  { type: "snack", label: "Snacks", icon: "🍎" },
];

export function QuickAddCard({ date }: Props) {
  const [open, setOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState<MealType>("breakfast");

  function openFor(meal: MealType) {
    setActiveMeal(meal);
    setOpen(true);
  }

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">Quick Add</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MEALS.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => openFor(type)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-100 p-3 text-center hover:border-green-200 hover:bg-green-50 transition-colors"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <FoodSearchModal
        open={open}
        onClose={() => setOpen(false)}
        date={date}
        defaultMealType={activeMeal}
      />
    </>
  );
}
