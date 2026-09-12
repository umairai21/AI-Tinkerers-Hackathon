"use client";

import { Suspense, use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { SupportPanel } from "@/components/SupportPanel";
import { TrackingCard } from "@/components/cards";

const statusStyles: Record<string, string> = {
  delivered: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  shipped: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  replacement_requested: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<main className="max-w-2xl mx-auto w-full p-6 text-slate-500">Loading order...</main>}>
      <OrderPageContent params={params} />
    </Suspense>
  );
}

function OrderPageContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [supportOpen, setSupportOpen] = useState(false);

  const order = useQuery(api.orders.getOrder, { orderId });
  const tracking = useQuery(api.tracking.getTrackingStatus, { orderId });

  if (order === undefined) {
    return <main className="max-w-2xl mx-auto w-full p-6 text-slate-500">Loading order...</main>;
  }

  if (order === null) {
    return (
      <main className="max-w-2xl mx-auto w-full p-6">
        <p className="text-red-600">Order #{orderId} not found.</p>
        <Link href="/" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Back to My Orders
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto w-full p-6">
      <Link
        href="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1"
      >
        &larr; My Orders
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mt-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xl font-semibold text-slate-900">{order.productName}</p>
            <p className="text-sm text-slate-500 mt-0.5">Order #{order.orderId}</p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              statusStyles[order.status] ?? "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10"
            }`}
          >
            {order.status.replace("_", " ")}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100 text-sm">
          <div>
            <dt className="text-slate-400">Product ID</dt>
            <dd className="text-slate-700 font-medium mt-0.5">{order.productId}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Customer ID</dt>
            <dd className="text-slate-700 font-medium mt-0.5">{order.customerId}</dd>
          </div>
        </dl>
      </div>

      {tracking && tracking.found && (
        <div className="mt-4">
          <TrackingCard
            orderId={tracking.orderId}
            status={tracking.status}
            location={tracking.location}
            eta={tracking.eta}
          />
        </div>
      )}

      <SupportPanel
        order={{
          orderId: order.orderId,
          customerId: order.customerId,
          productId: order.productId,
          productName: order.productName,
          status: order.status,
        }}
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
    </main>
  );
}
