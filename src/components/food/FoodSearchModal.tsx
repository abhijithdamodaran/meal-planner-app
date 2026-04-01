"use client";

import { useState, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useFoodSearch, type FoodSearchResult } from "@/hooks/useFoodSearch";
import { useAddLogEntry } from "@/hooks/useDailyLog";
import { calculateFoodMacros } from "@/lib/macros";
import type { MealType, LogUnit } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  defaultMealType: MealType;
}

type Step = "search" | "configure";

const UNITS: { value: LogUnit; label: string }[] = [
  { value: "g", label: "grams (g)" },
  { value: "ml", label: "ml" },
  { value: "serving", label: "serving" },
];

export function FoodSearchModal({ open, onClose, date, defaultMealType }: Props) {
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<LogUnit>("g");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  const searchRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useFoodSearch(query);
  const addEntry = useAddLogEntry(date);

  useEffect(() => {
    if (open) {
      setStep("search");
      setQuery("");
      setSelected(null);
      setQuantity("100");
      setUnit("g");
      setMealType(defaultMealType);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, defaultMealType]);

  function handleSelect(food: FoodSearchResult) {
    setSelected(food);
    setQuantity(food.servingSizeG ? String(food.servingSizeG) : "100");
    setUnit("g");
    setStep("configure");
  }

  const previewMacros = selected
    ? calculateFoodMacros(selected, Number(quantity) || 0, unit)
    : null;

  async function handleAdd() {
    if (!selected) return;
    await addEntry.mutateAsync({
      date,
      mealType,
      quantity: Number(quantity),
      unit,
      ...(selected.type === "food_item"
        ? { foodItemId: selected.id }
        : { customFoodId: selected.id }),
    });
    onClose();
  }

  const allResults = [
    ...(data?.customFoods ?? []),
    ...(data?.foodItems ?? []),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "search" ? "Add food" : "Configure serving"}
      maxWidth="md"
    >
      {step === "search" ? (
        <div className="flex flex-col">
          <div className="p-4">
            <Input
              ref={searchRef}
              placeholder="Search foods (e.g. chicken breast, oats…)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Searching…</p>
            )}
            {!isLoading && query.length >= 2 && allResults.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No results found.</p>
            )}
            {!isLoading && query.length < 2 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">Type at least 2 characters to search.</p>
            )}
            {allResults.map((food) => (
              <button
                key={`${food.type}-${food.id}`}
                onClick={() => handleSelect(food)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {food.name}
                    {food.type === "custom_food" && (
                      <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">custom</span>
                    )}
                  </p>
                  {food.brand && <p className="truncate text-xs text-gray-500">{food.brand}</p>}
                </div>
                {food.per100gCalories != null && (
                  <span className="ml-3 flex-shrink-0 text-xs text-gray-400">
                    {Math.round(food.per100gCalories)} kcal/100g
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* Selected food */}
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="font-medium text-gray-900">{selected?.name}</p>
            {selected?.brand && <p className="text-xs text-gray-500">{selected.brand}</p>}
          </div>

          {/* Meal type */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Meal</label>
            <div className="flex gap-2 flex-wrap">
              {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
                    mealType === m
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + unit */}
          <div className="flex gap-3">
            <div className="w-28">
              <Input
                label="Amount"
                type="number"
                min={0.1}
                step={0.1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as LogUnit)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Macro preview */}
          {previewMacros && (
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-center">
              <MacroCell label="Calories" value={previewMacros.calories} unit="kcal" />
              <MacroCell label="Protein" value={previewMacros.proteinG} unit="g" />
              <MacroCell label="Carbs" value={previewMacros.carbsG} unit="g" />
              <MacroCell label="Fat" value={previewMacros.fatG} unit="g" />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setStep("search")}>Back</Button>
            <Button
              onClick={handleAdd}
              loading={addEntry.isPending}
              disabled={!quantity || Number(quantity) <= 0}
              className="flex-1"
            >
              Add to log
            </Button>
          </div>
          {addEntry.isError && (
            <p className="text-xs text-red-600">
              {addEntry.error instanceof Error ? addEntry.error.message : "Failed to add"}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function MacroCell({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <p className="text-base font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{unit}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
