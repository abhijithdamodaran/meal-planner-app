"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUpdateLogEntry } from "@/hooks/useDailyLog";
import type { LogEntry } from "@/hooks/useDailyLog";
import type { MealType, LogUnit } from "@/types";

interface Props {
  entry: LogEntry | null;
  date: string;
  onClose: () => void;
}

const UNITS: { value: LogUnit; label: string }[] = [
  { value: "g", label: "grams (g)" },
  { value: "ml", label: "ml" },
  { value: "serving", label: "serving" },
];

export function EditLogEntryModal({ entry, date, onClose }: Props) {
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<LogUnit>("g");
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const update = useUpdateLogEntry(date);

  useEffect(() => {
    if (entry) {
      setQuantity(String(entry.quantity));
      setUnit(entry.unit);
      setMealType(entry.mealType);
    }
  }, [entry]);

  const foodName =
    entry?.foodItem?.name ??
    entry?.customFood?.name ??
    entry?.recipe?.title ??
    entry?.customRecipe?.title ??
    entry?.customName ??
    "Entry";

  async function handleSave() {
    if (!entry) return;
    await update.mutateAsync({ id: entry.id, quantity: Number(quantity), unit, mealType });
    onClose();
  }

  return (
    <Modal open={!!entry} onClose={onClose} title="Edit entry" maxWidth="sm">
      <div className="p-4 flex flex-col gap-4">
        <div className="rounded-lg bg-gray-50 px-4 py-2">
          <p className="text-sm font-medium text-gray-900">{foodName}</p>
        </div>

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
              {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            loading={update.isPending}
            disabled={!quantity || Number(quantity) <= 0}
            className="flex-1"
          >
            Save changes
          </Button>
        </div>
        {update.isError && (
          <p className="text-xs text-red-600">
            {update.error instanceof Error ? update.error.message : "Failed to update"}
          </p>
        )}
      </div>
    </Modal>
  );
}
