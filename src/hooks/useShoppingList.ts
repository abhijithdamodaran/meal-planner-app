"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ShoppingItem {
  id: string;
  ingredientName: string;
  quantity: number | null;
  unit: string | null;
  isChecked: boolean;
  addedAt: string;
  addedBy: { id: string; name: string };
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdAt: string;
}

const LISTS_KEY = ["shopping-lists"];

export function useShoppingLists() {
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/shopping");
      if (!res.ok) throw new Error("Failed to load lists");
      const data = await res.json() as { lists: ShoppingList[] };
      return data.lists;
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create list");
      }
      return res.json() as Promise<ShoppingList>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const res = await fetch(`/api/shopping/${listId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete list");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useAddItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { ingredientName: string; quantity?: number; unit?: string }) => {
      const res = await fetch(`/api/shopping/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add item");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useAddBulkItems(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { ingredientName: string; quantity?: number; unit?: string }[]) => {
      const res = await fetch(`/api/shopping/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to add items");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useUpdateItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      ingredientName,
      quantity,
      unit,
    }: {
      itemId: string;
      ingredientName?: string;
      quantity?: number | null;
      unit?: string | null;
    }) => {
      const res = await fetch(`/api/shopping/${listId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredientName, quantity, unit }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useToggleItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) => {
      const res = await fetch(`/api/shopping/${listId}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}

export function useDeleteItem(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/shopping/${listId}/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LISTS_KEY }),
  });
}
