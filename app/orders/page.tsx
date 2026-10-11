"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { OrderProgress } from "@/components/OrderProgress";
import {
  categoryIcon,
  categoryTint,
  defaultStatusStyle,
  formatDate,
  statusDot,
  statusLabel,
  statusStyles,
} from "@/lib/shop";

const IN_TRANSIT = ["processing", "shipped", "out_for_delivery"];

export default function OrdersPage() {
  const orders = useQuery(api.orders.listOrders, {});

  const stats = orders && [
    { label: "Total orders", value: orders.length, tone: "text-slate-900" },
    {
      label: "On the way",
      value: orders.filter((o) => IN_TRANSIT.includes(o.status)).length,
      tone: "text-indigo-600",
    },
    { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, tone: "text-green-600" },
    {
      label: "Replacements",
      value: orders.filter((o) => o.status === "replacement_requested").length,
      tone: "text-amber-600",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Orders</h1>
          <p className="text-slate-500 mt-1">Track deliveries and get AI support for any order.</p>
        </div>
        <Link
          href="/"
          className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 transition"
        >
          Continue shopping
        </Link>
      </div>

      {stats && orders.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
              <p className="text-sm text-slate-500">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {orders === undefined && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white h-52 animate-pulse" />
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center mt-8">
          <p className="text-4xl">📦</p>
          <p className="font-medium text-slate-900 mt-3">No orders yet</p>
          <p className="text-sm text-slate-500 mt-1">Orders you place will show up here.</p>
          <Link
            href="/"
            className="inline-flex mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Visit the shop
          </Link>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {orders?.map((order) => (
          <Link
            key={order.orderId}
            href={`/order/${order.orderId}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-indigo-200 transition"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${categoryTint(order.category)}`}
              >
                {categoryIcon(order.category)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{order.productName}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  #{order.orderId}
                  {order.quantity > 1 && ` · Qty ${order.quantity}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Ordered {formatDate(order.purchasedAt)}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  statusStyles[order.status] ?? defaultStatusStyle
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status] ?? "bg-slate-400"}`} />
                {statusLabel(order.status)}
              </span>
              <OrderProgress status={order.status} compact />
            </div>

            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">Track or get help</span>
              <span className="font-medium text-indigo-600 group-hover:translate-x-0.5 transition">
                View details &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
