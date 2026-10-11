"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { MAX_QUANTITY, useCart } from "@/lib/cart";
import { categoryIcon, categoryTint, formatPrice } from "@/lib/shop";

export default function CartPage() {
  const products = useQuery(api.products.listProducts, {});
  const placeOrder = useMutation(api.orders.placeOrder);
  const { items, setQuantity, remove, clear } = useCart();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = items.flatMap((item) => {
    const product = products?.find((p) => p.productId === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  async function checkout() {
    setPlacing(true);
    setError(null);
    try {
      await placeOrder({
        items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
      });
      clear();
      router.push("/orders");
    } catch (err) {
      setError(
        err instanceof ConvexError ? String(err.data) : "Couldn't place your order. Please try again.",
      );
      setPlacing(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Cart</h1>
        <p className="text-slate-500 mt-1">Demo checkout: no payment is taken.</p>
      </div>

      {products === undefined && items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white h-24 animate-pulse" />
      )}

      {products !== undefined && lines.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center">
          <p className="text-4xl">🛒</p>
          <p className="font-medium text-slate-900 mt-3">Your cart is empty</p>
          <Link
            href="/"
            className="inline-flex mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Browse the shop
          </Link>
        </div>
      )}

      {lines.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          <div className="space-y-3 lg:col-span-2">
            {lines.map((line) => (
              <div
                key={line.productId}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4 shadow-sm"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl ${categoryTint(line.product.category)}`}
                >
                  {categoryIcon(line.product.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{line.product.name}</p>
                  <p className="text-sm text-slate-500">{formatPrice(line.product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.productId, Number(e.target.value))}
                    aria-label={`Quantity of ${line.product.name}`}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
                  >
                    {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => remove(line.productId)}
                    className="text-sm text-slate-500 hover:text-red-600 px-2 py-1.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-semibold text-slate-900">Order summary</h2>
            <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
              <span>Delivery</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-slate-500">Total</span>
              <span className="text-lg font-semibold text-slate-900">{formatPrice(total)}</span>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            <button
              onClick={checkout}
              disabled={placing}
              className="w-full mt-5 text-sm font-medium px-4 py-3 rounded-xl bg-indigo-600 shadow-sm shadow-indigo-500/30 text-white hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              {placing ? "Placing order..." : "Place order"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
