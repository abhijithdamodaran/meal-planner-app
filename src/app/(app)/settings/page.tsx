"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePreferences, useSavePreferences } from "@/hooks/usePreferences";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { TagInput } from "@/components/ui/TagInput";
import type { UserPreferences } from "@/types";

const DEFAULT_PREFS: UserPreferences = {
  isVegetarian: false,
  isVegan: false,
  isLactoseIntolerant: false,
  isGlutenFree: false,
  otherAllergens: [],
  calorieGoal: null,
  proteinGoalG: null,
  carbsGoalG: null,
  fatGoalG: null,
};

export default function SettingsPage() {
  const { data: saved, isLoading } = usePreferences();
  const { mutate: save, isPending, isSuccess, isError, error } = useSavePreferences();

  const [form, setForm] = useState<UserPreferences>(DEFAULT_PREFS);

  // Populate form once data loads
  useEffect(() => {
    if (saved) setForm(saved);
  }, [saved]);

  function setField<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save(form);
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Link href="/settings/household" className="text-sm text-green-600 hover:text-green-700 font-medium">
          Household & invite code →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ── Dietary preferences ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Dietary Preferences</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Applied automatically when searching for recipes on Spoonacular.
            </p>
          </CardHeader>
          <CardBody className="py-2">
            <Checkbox
              id="vegetarian"
              label="Vegetarian"
              description="Excludes meat and fish"
              checked={form.isVegetarian}
              onChange={(v) => {
                setField("isVegetarian", v);
                if (v) setField("isVegan", false);
              }}
            />
            <Checkbox
              id="vegan"
              label="Vegan"
              description="Excludes all animal products"
              checked={form.isVegan}
              onChange={(v) => {
                setField("isVegan", v);
                if (v) setField("isVegetarian", true);
              }}
            />
            <Checkbox
              id="lactose"
              label="Lactose intolerant"
              description="Excludes dairy"
              checked={form.isLactoseIntolerant}
              onChange={(v) => setField("isLactoseIntolerant", v)}
            />
            <Checkbox
              id="gluten"
              label="Gluten-free"
              description="Excludes wheat, barley, rye"
              checked={form.isGlutenFree}
              onChange={(v) => setField("isGlutenFree", v)}
            />
          </CardBody>
        </Card>

        {/* ── Allergens ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Other Allergens</h2>
          </CardHeader>
          <CardBody>
            <TagInput
              tags={form.otherAllergens}
              onChange={(tags) => setField("otherAllergens", tags)}
              placeholder="e.g. peanuts, shellfish, soy"
              hint="Press Enter or comma to add. Shown as a warning on recipe results."
            />
          </CardBody>
        </Card>

        {/* ── Nutrition goals ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Daily Nutrition Goals</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Used to show progress bars on your dashboard. Leave blank to skip tracking.
            </p>
          </CardHeader>
          <CardBody className="flex flex-col gap-4">
            <Input
              label="Calories (kcal)"
              type="number"
              min={0}
              placeholder="e.g. 2000"
              value={form.calorieGoal ?? ""}
              onChange={(e) =>
                setField("calorieGoal", e.target.value ? Number(e.target.value) : null)
              }
            />
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Protein (g)"
                type="number"
                min={0}
                placeholder="e.g. 150"
                value={form.proteinGoalG ?? ""}
                onChange={(e) =>
                  setField("proteinGoalG", e.target.value ? Number(e.target.value) : null)
                }
              />
              <Input
                label="Carbs (g)"
                type="number"
                min={0}
                placeholder="e.g. 220"
                value={form.carbsGoalG ?? ""}
                onChange={(e) =>
                  setField("carbsGoalG", e.target.value ? Number(e.target.value) : null)
                }
              />
              <Input
                label="Fat (g)"
                type="number"
                min={0}
                placeholder="e.g. 80"
                value={form.fatGoalG ?? ""}
                onChange={(e) =>
                  setField("fatGoalG", e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>

            {/* Calorie check */}
            {form.proteinGoalG && form.carbsGoalG && form.fatGoalG && form.calorieGoal && (
              <MacroCalorieCheck
                calories={form.calorieGoal}
                protein={form.proteinGoalG}
                carbs={form.carbsGoalG}
                fat={form.fatGoalG}
              />
            )}
          </CardBody>
        </Card>

        {/* ── Save ── */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={isPending}>
            Save preferences
          </Button>
          {isSuccess && (
            <span className="text-sm text-green-600">Saved!</span>
          )}
          {isError && (
            <span className="text-sm text-red-600">
              {error instanceof Error ? error.message : "Failed to save"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function MacroCalorieCheck({
  calories,
  protein,
  carbs,
  fat,
}: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const fromMacros = Math.round(protein * 4 + carbs * 4 + fat * 9);
  const diff = Math.abs(calories - fromMacros);

  if (diff <= 50) return null;

  return (
    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
      Your macros add up to ~{fromMacros} kcal, but your calorie goal is {calories} kcal (difference of {diff} kcal).
      Consider adjusting them to match.
    </p>
  );
}
