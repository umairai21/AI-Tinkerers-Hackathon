"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { categoryIcon, categoryTint, formatPrice } from "@/lib/shop";

const highlights = ["AI support on every order", "Live delivery tracking", "Easy replacements"];

export default function ShopPage() {
  const products = useQuery(api.products.listProducts, {});
  const { items, count, add } = useCart();

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <section className="rounded-3xl border border-indigo-100 bg-white/70 backdrop-blur-sm p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">OrderCare Store</p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-2">Shop the latest tech</h1>
          <p className="text-slate-500 mt-2 max-w-xl">
            Place an order, then get instant AI support on it from My Orders. Your orders are private to this
            browser.
          </p>
          <ul className="flex flex-wrap gap-2 mt-4">
            {highlights.map((h) => (
              <li
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {h}
              </li>
            ))}
          </ul>
        </div>
        {count > 0 && (
          <Link
            href="/cart"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-700 transition"
          >
            View cart ({count}) &rarr;
          </Link>
        )}
      </section>

      {products === undefined && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white h-72 animate-pulse" />
          ))}
        </div>
      )}

      {products?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 mt-8">
          No products yet. Run <code>npm run seed</code> to load the catalog.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {products?.map((product) => {
          const inCart = items.find((i) => i.productId === product.productId)?.quantity ?? 0;
          return (
            <div
              key={product.productId}
              className="group rounded-2xl border border-slate-200 bg-white p-4 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 transition"
            >
              <div
                className={`flex h-36 items-center justify-center rounded-xl text-6xl ${categoryTint(product.category)}`}
              >
                <span className="transition group-hover:scale-110">{categoryIcon(product.category)}</span>
              </div>
              <div className="px-1 pt-4 flex-1 flex flex-col">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{product.category}</p>
                <p className="font-semibold text-slate-900 mt-1">{product.name}</p>
                <p className="text-sm text-slate-500 mt-1 flex-1">{product.description}</p>
                <div className="flex items-center justify-between gap-3 mt-4">
                  <span className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</span>
                  <button
                    onClick={() => add(product.productId)}
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition ${
                      inCart > 0
                        ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    {inCart > 0 ? `In cart (${inCart}) · Add` : "Add to cart"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
