"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
  id: string;
  source: string;
  title: string;
  imageUrl?: string | null;
  cuisines?: string[];
  diets?: string[];
  readyInMinutes?: number | null;
  servings?: number | null;
  caloriesPerServing?: number | null;
}

export function RecipeCard({
  id,
  source,
  title,
  imageUrl,
  cuisines = [],
  diets = [],
  readyInMinutes,
  servings,
  caloriesPerServing,
}: Props) {
  const isTheMealDB = source === "themealdb";

  return (
    <Link
      href={`/recipes/${source}/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative h-40 w-full bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300">🍽️</div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-green-700">
          {title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {cuisines[0] && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{cuisines[0]}</span>
          )}
          {diets.slice(0, 2).map((d) => (
            <span key={d} className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
              {d}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
          <div className="flex gap-3">
            {readyInMinutes && <span>{readyInMinutes} min</span>}
            {servings && <span>{servings} servings</span>}
          </div>
          {caloriesPerServing != null ? (
            <span className="font-medium text-gray-600">{Math.round(caloriesPerServing)} kcal</span>
          ) : (
            <span className="italic text-gray-300">No macros</span>
          )}
        </div>

        {/* Allergen warning for TheMealDB */}
        {isTheMealDB && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            Allergen info unavailable
          </p>
        )}
      </div>
    </Link>
  );
}
