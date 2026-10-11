"use client";

import { useSyncExternalStore } from "react";

export type CartItem = { productId: string; quantity: number };

export const MAX_QUANTITY = 5;
const STORAGE_KEY = "ordercare-cart";
const EMPTY: CartItem[] = [];

// The cart is a per-browser convenience, so it lives in localStorage. Orders themselves
// are created server-side at checkout. Loaded lazily so the server render sees an empty cart.
let items: CartItem[] | null = null;
const listeners = new Set<() => void>();

function load(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSnapshot() {
  items ??= load();
  return items;
}

function setItems(update: (current: CartItem[]) => CartItem[]) {
  items = update(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Cart still works for this page load without persistence.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    items = load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function add(productId: string) {
  setItems((current) => {
    const existing = current.find((i) => i.productId === productId);
    if (!existing) return [...current, { productId, quantity: 1 }];
    return current.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QUANTITY) } : i,
    );
  });
}

function setQuantity(productId: string, quantity: number) {
  setItems((current) =>
    quantity < 1
      ? current.filter((i) => i.productId !== productId)
      : current.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i,
        ),
  );
}

function remove(productId: string) {
  setItems((current) => current.filter((i) => i.productId !== productId));
}

function clear() {
  setItems(() => EMPTY);
}

export function useCart() {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  return {
    items: cartItems,
    count: cartItems.reduce((sum, i) => sum + i.quantity, 0),
    add,
    setQuantity,
    remove,
    clear,
  };
}
