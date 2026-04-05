"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateCustomRecipe, type CustomRecipeInput } from "@/hooks/useRecipeSearch";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface IngredientRow { name: string; amount: string; unit: string }
interface InstructionRow { text: string }

const emptyIngredient = (): IngredientRow => ({ name: "", amount: "", unit: "" });

export function CustomRecipeModal({ open, onClose }: Props) {
  const create = useCreateCustomRecipe();

  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIngredient()]);
  const [instructions, setInstructions] = useState<InstructionRow[]>([{ text: "" }]);

  function reset() {
    setTitle(""); setServings(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    setIngredients([emptyIngredient()]); setInstructions([{ text: "" }]);
  }

  function handleClose() { reset(); onClose(); }

  function setIngredient(i: number, field: keyof IngredientRow, value: string) {
    setIngredients((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }
  function addIngredient() { setIngredients((p) => [...p, emptyIngredient()]); }
  function removeIngredient(i: number) { setIngredients((p) => p.filter((_, idx) => idx !== i)); }

  function setInstruction(i: number, value: string) {
    setInstructions((prev) => prev.map((row, idx) => idx === i ? { text: value } : row));
  }
  function addInstruction() { setInstructions((p) => [...p, { text: "" }]); }
  function removeInstruction(i: number) { setInstructions((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const input: CustomRecipeInput = {
      title: title.trim(),
      servings: servings ? parseInt(servings) : undefined,
      caloriesPerServing: calories ? parseFloat(calories) : undefined,
      proteinPerServing: protein ? parseFloat(protein) : undefined,
      carbsPerServing: carbs ? parseFloat(carbs) : undefined,
      fatPerServing: fat ? parseFloat(fat) : undefined,
      ingredients: ingredients
        .filter((r) => r.name.trim())
        .map((r) => ({ name: r.name.trim(), amount: parseFloat(r.amount) || 0, unit: r.unit.trim() || "unit" })),
      instructions: instructions
        .filter((r) => r.text.trim())
        .map((r, idx) => ({ step: idx + 1, text: r.text.trim() })),
      allergens: [],
    };

    await create.mutateAsync(input);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create Custom Recipe" maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 max-h-[70vh] overflow-y-auto">
        <Input label="Recipe name" value={title} onChange={(e) => setTitle(e.target.value)} required />

        {/* Servings + macros */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Nutrition per serving (optional)</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Input label="Servings" type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} />
            <Input label="Calories" type="number" min={0} value={calories} onChange={(e) => setCalories(e.target.value)} />
            <Input label="Protein (g)" type="number" min={0} value={protein} onChange={(e) => setProtein(e.target.value)} />
            <Input label="Carbs (g)" type="number" min={0} value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            <Input label="Fat (g)" type="number" min={0} value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Ingredients</p>
          <div className="flex flex-col gap-2">
            {ingredients.map((row, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input placeholder="Ingredient name" value={row.name} onChange={(e) => setIngredient(i, "name", e.target.value)} />
                </div>
                <div className="w-20">
                  <Input placeholder="Amount" type="number" min={0} value={row.amount} onChange={(e) => setIngredient(i, "amount", e.target.value)} />
                </div>
                <div className="w-20">
                  <Input placeholder="Unit" value={row.unit} onChange={(e) => setIngredient(i, "unit", e.target.value)} />
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="mb-0.5 p-2 text-gray-400 hover:text-red-500"
                >×</button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addIngredient} className="self-start">
              + Add ingredient
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Instructions</p>
          <div className="flex flex-col gap-2">
            {instructions.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="mt-2 flex-shrink-0 text-sm text-gray-400 w-5">{i + 1}.</span>
                <textarea
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[60px] resize-y"
                  placeholder={`Step ${i + 1}…`}
                  value={row.text}
                  onChange={(e) => setInstruction(i, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(i)}
                  className="mt-2 p-1 text-gray-400 hover:text-red-500"
                >×</button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addInstruction} className="self-start">
              + Add step
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-1 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending} disabled={!title.trim()} className="flex-1">
            Save Recipe
          </Button>
        </div>
        {create.isError && (
          <p className="text-xs text-red-600">{create.error instanceof Error ? create.error.message : "Failed to save"}</p>
        )}
      </form>
    </Modal>
  );
}
