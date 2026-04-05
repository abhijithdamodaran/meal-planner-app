"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useIngredientSearch } from "@/hooks/useIngredientSearch";
import { Button } from "@/components/ui/Button";

export default function FridgePage() {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useIngredientSearch(ingredients, searchTriggered);

  function addIngredient() {
    const val = input.trim().toLowerCase();
    if (!val || ingredients.includes(val)) return;
    setIngredients((prev) => [...prev, val]);
    setInput("");
    setSearchTriggered(false);
    inputRef.current?.focus();
  }

  function removeIngredient(ing: string) {
    setIngredients((prev) => prev.filter((i) => i !== ing));
    setSearchTriggered(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addIngredient(); }
    if (e.key === "Backspace" && !input && ingredients.length > 0) {
      removeIngredient(ingredients[ingredients.length - 1]);
    }
  }

  function handleSearch() {
    if (ingredients.length === 0) return;
    setSearchTriggered(true);
  }

  const recipes = data?.recipes ?? [];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">What&apos;s in my fridge?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add ingredients you have and we&apos;ll find matching recipes.
        </p>
      </div>

      {/* Ingredient input */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {ingredients.map((ing) => (
            <span
              key={ing}
              className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
            >
              {ing}
              <button
                onClick={() => removeIngredient(ing)}
                className="text-green-600 hover:text-green-900 leading-none"
              >
                ×
              </button>
            </span>
          ))}
          {ingredients.length === 0 && (
            <span className="text-sm text-gray-400">No ingredients added yet…</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type an ingredient and press Enter (e.g. chicken, spinach…)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button variant="secondary" size="sm" onClick={addIngredient} disabled={!input.trim()}>
            Add
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Press Enter to add · Backspace to remove last</p>
      </div>

      {/* Search button */}
      <Button
        onClick={handleSearch}
        disabled={ingredients.length === 0 || isLoading}
        loading={isLoading}
        className="mb-6 w-full sm:w-auto"
      >
        Find Recipes ({ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""})
      </Button>

      {/* Spoonacular limit warning */}
      {data?.spoonacularSkipped && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Spoonacular daily limit reached — showing TheMealDB results only.
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-500">Search failed. Please try again.</p>
      )}

      {/* Results */}
      {searchTriggered && !isLoading && recipes.length === 0 && !error && (
        <div className="py-12 text-center text-sm text-gray-400">
          No recipes found with those ingredients. Try adding more.
        </div>
      )}

      {recipes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">{recipes.length} recipes found</p>
          {recipes.map((r) => (
            <Link
              key={`${r.source}-${r.externalId}`}
              href={`/recipes/${r.source}/${r.externalId}`}
              className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {r.imageUrl ? (
                  <Image src={r.imageUrl} alt={r.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl text-gray-300">🍽️</div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 leading-snug">
                    {r.title}
                  </h3>
                  {/* Match badge */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      r.matchPct >= 75
                        ? "bg-green-100 text-green-700"
                        : r.matchPct >= 40
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {r.matchPct}% match
                  </span>
                </div>

                {/* Used ingredients */}
                {r.usedIngredients.length > 0 && (
                  <p className="mt-1 text-xs text-green-700">
                    ✓ {r.usedIngredients.join(", ")}
                  </p>
                )}

                {/* Missing ingredients */}
                {r.missedIngredients.length > 0 && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Missing: {r.missedIngredients.slice(0, 5).join(", ")}
                    {r.missedIngredients.length > 5 ? ` +${r.missedIngredients.length - 5} more` : ""}
                  </p>
                )}

                {r.source === "themealdb" && (
                  <span className="mt-1 inline-block text-xs text-amber-600">Allergen info unavailable</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
