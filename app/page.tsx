"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  delivered: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  shipped: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  replacement_requested: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};

const statusDot: Record<string, string> = {
  delivered: "bg-green-500",
  shipped: "bg-blue-500",
  replacement_requested: "bg-amber-500",
};

export default function OrdersPage() {
  const orders = useQuery(api.orders.listOrders, {});

  return (
    <main className="max-w-2xl mx-auto w-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">My Orders</h1>
        <p className="text-sm text-slate-500 mt-1">Track deliveries and get support for any order.</p>
      </div>

      {orders === undefined && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {orders?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No orders found.
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((order) => (
          <div
            key={order.orderId}
            className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{order.productName}</p>
              <p className="text-sm text-slate-500 mt-0.5">Order #{order.orderId}</p>
              <span
                className={`inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                  statusStyles[order.status] ?? "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot[order.status] ?? "bg-slate-400"}`} />
                {order.status.replace("_", " ")}
              </span>
            </div>
            <Link
              href={`/order/${order.orderId}`}
              className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-center"
            >
              Check Details
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
