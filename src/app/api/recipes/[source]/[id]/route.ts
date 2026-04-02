import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSpoonacularRecipe } from "@/lib/api/spoonacular";
import { getTheMealDBRecipe } from "@/lib/api/themealdb";
import { serializeRecipe, parseRecipe } from "@/lib/recipe-db";
import type { AnyRecipe } from "@/lib/recipe-merger";

interface Params {
  params: { source: string; id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { source, id } = params;
  if (source !== "spoonacular" && source !== "themealdb") {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const cached = await prisma.recipe.findUnique({
    where: { externalId_source: { externalId: id, source } },
  });
  if (cached) return NextResponse.json(parseRecipe(cached));

  let fetched: AnyRecipe | null = null;
  if (source === "spoonacular") {
    fetched = await getSpoonacularRecipe(id).catch(() => null);
  } else {
    fetched = await getTheMealDBRecipe(id).catch(() => null);
  }

  if (!fetched) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

  const data = serializeRecipe(fetched);
  const saved = await prisma.recipe.upsert({
    where: { externalId_source: { externalId: fetched.externalId, source: fetched.source } },
    update: data,
    create: data,
  });

  return NextResponse.json(parseRecipe(saved));
}
