import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSpoonacularRecipe } from "@/lib/api/spoonacular";
import { getTheMealDBRecipe } from "@/lib/api/themealdb";
import { serializeRecipe, parseRecipe } from "@/lib/recipe-db";
import { RecipeDetailView } from "./RecipeDetailView";
import type { AnyRecipe } from "@/lib/recipe-merger";

interface Props {
  params: { source: string; id: string };
}

export default async function RecipeDetailPage({ params }: Props) {
  const { source, id } = params;
  await getSession();

  if (source !== "spoonacular" && source !== "themealdb" && source !== "custom") {
    notFound();
  }

  if (source === "custom") {
    const recipe = await prisma.customRecipe.findUnique({ where: { id } });
    if (!recipe) notFound();
    return (
      <RecipeDetailView
        recipe={{
          id: recipe.id,
          externalId: recipe.id,
          source: "custom",
          title: recipe.title,
          imageUrl: recipe.imageUrl,
          cuisines: [],
          diets: [],
          allergens: JSON.parse(recipe.allergens) as string[],
          ingredients: JSON.parse(recipe.ingredients) as { name: string; amount: number; unit: string }[],
          instructions: JSON.parse(recipe.instructions) as { step: number; text: string }[],
          readyInMinutes: null,
          servings: recipe.servings,
          caloriesPerServing: recipe.caloriesPerServing,
          proteinPerServing: recipe.proteinPerServing,
          carbsPerServing: recipe.carbsPerServing,
          fatPerServing: recipe.fatPerServing,
        }}
      />
    );
  }

  let cached = await prisma.recipe.findUnique({
    where: { externalId_source: { externalId: id, source } },
  });

  if (!cached) {
    let fetched: AnyRecipe | null = null;
    if (source === "spoonacular") {
      fetched = await getSpoonacularRecipe(id).catch(() => null);
    } else {
      fetched = await getTheMealDBRecipe(id).catch(() => null);
    }
    if (!fetched) notFound();

    const data = serializeRecipe(fetched);
    cached = await prisma.recipe.upsert({
      where: { externalId_source: { externalId: fetched.externalId, source: fetched.source } },
      update: data,
      create: data,
    });
  }

  return <RecipeDetailView recipe={parseRecipe(cached)} />;
}
