"use client";

import { useState } from "react";
import {
  useShoppingLists,
  useCreateList,
  useDeleteList,
  useAddItem,
  useToggleItem,
  useDeleteItem,
  useUpdateItem,
  type ShoppingList,
} from "@/hooks/useShoppingList";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ShoppingPage() {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateList();
  const [newListName, setNewListName] = useState("");
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const activeList = lists?.find((l) => l.id === activeListId) ?? lists?.[0] ?? null;

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const list = await createList.mutateAsync(newListName.trim()).catch(() => null);
    if (list) {
      setNewListName("");
      setActiveListId(list.id);
    }
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping Lists</h1>
          <p className="mt-0.5 text-sm text-gray-500">Shared with your household</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — list selector */}
        <div className="w-48 flex-shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Lists</p>
          <div className="flex flex-col gap-1">
            {lists?.map((list) => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  (activeList?.id === list.id)
                    ? "bg-green-600 font-medium text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="block truncate">{list.name}</span>
                <span className={`text-xs ${activeList?.id === list.id ? "text-green-200" : "text-gray-400"}`}>
                  {list.items.length} item{list.items.length !== 1 ? "s" : ""}
                </span>
              </button>
            ))}
          </div>

          {/* New list form */}
          <form onSubmit={handleCreateList} className="mt-3 flex flex-col gap-1.5">
            <Input
              placeholder="New list name…"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="text-sm"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={newListName.trim().length === 0}
              loading={createList.isPending}
            >
              + Create
            </Button>
          </form>
        </div>

        {/* Main — list content */}
        <div className="flex-1 min-w-0">
          {!activeList ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-400">
              Create a list to get started
            </div>
          ) : (
            <ListPanel list={activeList} onDelete={() => setActiveListId(null)} />
          )}
        </div>
      </div>
    </div>
  );
}

function ListPanel({ list, onDelete }: { list: ShoppingList; onDelete: () => void }) {
  const deleteList = useDeleteList();
  const addItem = useAddItem(list.id);
  const toggleItem = useToggleItem(list.id);
  const deleteItem = useDeleteItem(list.id);

  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;
    await addItem.mutateAsync({
      ingredientName: itemName.trim(),
      quantity: itemQty ? Number(itemQty) : undefined,
      unit: itemUnit.trim() || undefined,
    }).catch(() => {});
    setItemName("");
    setItemQty("");
    setItemUnit("");
  }

  async function handleDeleteList() {
    await deleteList.mutateAsync(list.id).catch(() => {});
    onDelete();
    setConfirmDelete(false);
  }

  const unchecked = list.items.filter((i) => !i.isChecked);
  const checked = list.items.filter((i) => i.isChecked);

  return (
    <div className="flex flex-col gap-4">
      {/* List header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{list.name}</h2>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Delete list?</span>
            <button
              onClick={handleDeleteList}
              className="font-medium text-red-600 hover:text-red-800"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-gray-400 hover:text-red-500"
          >
            Delete list
          </button>
        )}
      </div>

      {/* Add item form */}
      <form
        onSubmit={handleAddItem}
        className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
      >
        <Input
          placeholder="Item name…"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="flex-1 min-w-[140px]"
        />
        <input
          type="number"
          min={0}
          step="any"
          placeholder="Qty"
          value={itemQty}
          onChange={(e) => setItemQty(e.target.value)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <Input
          placeholder="Unit"
          value={itemUnit}
          onChange={(e) => setItemUnit(e.target.value)}
          className="w-20"
        />
        <Button
          type="submit"
          size="sm"
          disabled={itemName.trim().length === 0}
          loading={addItem.isPending}
        >
          Add
        </Button>
      </form>

      {/* Items list */}
      {list.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          No items yet — add one above
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
          {/* Unchecked items */}
          {unchecked.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              listId={list.id}
              onToggle={() => toggleItem.mutate({ itemId: item.id, isChecked: true })}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}

          {/* Checked items section */}
          {checked.length > 0 && (
            <>
              {unchecked.length > 0 && (
                <div className="px-4 py-1.5 text-xs font-medium text-gray-400 bg-gray-50">
                  In cart ({checked.length})
                </div>
              )}
              {checked.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  listId={list.id}
                  onToggle={() => toggleItem.mutate({ itemId: item.id, isChecked: false })}
                  onDelete={() => deleteItem.mutate(item.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {checked.length > 0 && (
        <button
          onClick={() => checked.forEach((i) => deleteItem.mutate(i.id))}
          className="self-end text-xs text-gray-400 hover:text-red-500"
        >
          Remove checked items
        </button>
      )}
    </div>
  );
}

function ItemRow({
  item,
  listId,
  onToggle,
  onDelete,
}: {
  item: ShoppingList["items"][number];
  listId: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const updateItem = useUpdateItem(listId);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.ingredientName);
  const [editQty, setEditQty] = useState(item.quantity != null ? String(item.quantity) : "");
  const [editUnit, setEditUnit] = useState(item.unit ?? "");

  function startEdit() {
    setEditName(item.ingredientName);
    setEditQty(item.quantity != null ? String(item.quantity) : "");
    setEditUnit(item.unit ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    await updateItem.mutateAsync({
      itemId: item.id,
      ingredientName: editName.trim(),
      quantity: editQty ? Number(editQty) : null,
      unit: editUnit.trim() || null,
    }).catch(() => {});
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
          className="flex-1 min-w-[120px] rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <input
          type="number"
          min={0}
          step="any"
          placeholder="Qty"
          value={editQty}
          onChange={(e) => setEditQty(e.target.value)}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <input
          type="text"
          placeholder="Unit"
          value={editUnit}
          onChange={(e) => setEditUnit(e.target.value)}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          onClick={saveEdit}
          disabled={!editName.trim() || updateItem.isPending}
          className="text-green-600 font-medium hover:text-green-800 text-sm disabled:opacity-40"
        >
          ✓
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 group ${item.isChecked ? "opacity-50" : ""}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
          item.isChecked
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 hover:border-green-400"
        }`}
      >
        {item.isChecked && (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${item.isChecked ? "line-through text-gray-400" : "text-gray-900"}`}>
          {item.ingredientName}
        </span>
        {(item.quantity || item.unit) && (
          <span className="ml-2 text-xs text-gray-400">
            {item.quantity ? item.quantity : ""}{item.unit ? ` ${item.unit}` : ""}
          </span>
        )}
      </div>

      {/* Added by */}
      <span className="text-xs text-gray-300 hidden group-hover:inline">
        {item.addedBy.name}
      </span>

      {/* Edit */}
      <button
        onClick={startEdit}
        title="Edit"
        className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        title="Delete"
        className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-gray-300 hover:text-red-400 hover:bg-red-50"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
