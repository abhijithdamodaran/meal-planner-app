"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export interface FoodSearchResult {
  offId?: string;
  id: string;
  name: string;
  brand?: string | null;
  per100gCalories?: number | null;
  per100gProtein?: number | null;
  per100gCarbs?: number | null;
  per100gFat?: number | null;
  servingSizeG?: number | null;
  type: "food_item" | "custom_food";
}

interface SearchResponse {
  foodItems: FoodSearchResult[];
  customFoods: FoodSearchResult[];
}

async function fetchFoodSearch(query: string): Promise<SearchResponse> {
  const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export function useFoodSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["food-search", debouncedQuery],
    queryFn: () => fetchFoodSearch(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
