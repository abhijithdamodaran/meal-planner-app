"use client";

import { useState } from "react";
import { useRecipeSearch, useCustomRecipes } from "@/hooks/useRecipeSearch";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { CustomRecipeModal } from "@/components/recipes/CustomRecipeModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useRecipeSearch(submitted);
  const { data: customRecipes = [] } = useCustomRecipes();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(query.trim());
  }

  const recipes = data?.recipes ?? [];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
          + Create Recipe
        </Button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          placeholder="Search recipes (e.g. pasta, chicken curry…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={query.trim().length < 2}>
          Search
        </Button>
      </form>

      {/* Spoonacular limit warning */}
      {data?.spoonacularSkipped && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Spoonacular daily limit reached — showing TheMealDB results only.
        </p>
      )}

      {/* Search results */}
      {submitted && (
        <>
          {isLoading && (
            <div className="py-12 text-center text-sm text-gray-400">Searching…</div>
          )}
          {error && (
            <div className="py-12 text-center text-sm text-red-500">Search failed. Try again.</div>
          )}
          {!isLoading && !error && recipes.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              No recipes found for &ldquo;{submitted}&rdquo;.
            </div>
          )}
          {!isLoading && recipes.length > 0 && (
            <>
              <p className="mb-3 text-sm text-gray-500">{recipes.length} results for &ldquo;{submitted}&rdquo;</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recipes.map((r) => (
                  <RecipeCard
                    key={`${r.source}-${r.externalId}`}
                    id={r.externalId}
                    source={r.source}
                    title={r.title}
                    imageUrl={r.imageUrl}
                    cuisines={r.cuisines}
                    diets={r.diets}
                    readyInMinutes={r.readyInMinutes}
                    servings={r.servings}
                    caloriesPerServing={r.caloriesPerServing}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Custom recipes section */}
      {!submitted && customRecipes.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-700">My Recipes</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customRecipes.map((r) => (
              <RecipeCard
                key={r.id}
                id={r.id}
                source="custom"
                title={r.title}
                servings={r.servings}
                caloriesPerServing={r.caloriesPerServing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!submitted && customRecipes.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-4xl">🍳</p>
          <p className="mt-2 text-gray-500">Search for recipes above, or create your own.</p>
        </div>
      )}

      <CustomRecipeModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
