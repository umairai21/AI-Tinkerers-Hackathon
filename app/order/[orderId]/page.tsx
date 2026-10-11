"use client";

import { Suspense, use } from "react";
import { useQuery } from "convex/react";
import { useChatContext } from "@copilotkit/react-ui";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { SupportPanel } from "@/components/SupportPanel";
import { OrderProgress } from "@/components/OrderProgress";
import {
  categoryIcon,
  categoryTint,
  defaultStatusStyle,
  formatDate,
  formatDateTime,
  statusLabel,
  statusStyles,
} from "@/lib/shop";

const shell = "max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10";

export default function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<main className={`${shell} text-slate-500`}>Loading order...</main>}>
      <OrderPageContent params={params} />
    </Suspense>
  );
}

function OrderPageContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const order = useQuery(api.orders.getOrder, { orderId });
  const tracking = useQuery(api.tracking.getTrackingStatus, { orderId });
  const history = useQuery(api.tracking.getTrackingHistory, { orderId });

  if (order === undefined) {
    return <main className={`${shell} text-slate-500`}>Loading order...</main>;
  }

  if (order === null) {
    return (
      <main className={shell}>
        <p className="text-red-600">Order #{orderId} not found.</p>
        <Link href="/orders" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Back to My Orders
        </Link>
      </main>
    );
  }

  return (
    <SupportPanel
      order={{
        orderId: order.orderId,
        customerId: order.customerId,
        productId: order.productId,
        productName: order.productName,
        status: order.status,
      }}
    >
      <main className={`${shell} @container`}>
        <Link
          href="/orders"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition inline-flex items-center gap-1"
        >
          &larr; My Orders
        </Link>

        <div className="grid gap-5 mt-4 @3xl:grid-cols-3">
          <div className="space-y-5 @3xl:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-5xl ${categoryTint(order.category)}`}
                >
                  {categoryIcon(order.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h1 className="text-2xl font-semibold text-slate-900">{order.productName}</h1>
                    <span
                      className={`shrink-0 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        statusStyles[order.status] ?? defaultStatusStyle
                      }`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Order #{order.orderId}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-sm">
                <Detail label="Ordered" value={formatDate(order.purchasedAt)} />
                <Detail label="Quantity" value={String(order.quantity)} />
                <Detail label="Estimated arrival" value={order.eta} />
                <Detail label="Product code" value={order.productId} />
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
                <h2 className="font-semibold text-slate-900">Delivery</h2>
                {tracking?.found && (
                  <p className="text-sm text-slate-500">
                    {tracking.status} · {tracking.location}
                  </p>
                )}
              </div>
              <OrderProgress status={order.status} />

              {history && history.length > 0 && (
                <ol className="mt-8 space-y-0">
                  {[...history].reverse().map((event, i) => (
                    <li key={`${event.timestamp}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
                      {i < history.length - 1 && (
                        <span className="absolute left-[5px] top-4 bottom-0 w-px bg-slate-200" aria-hidden />
                      )}
                      <span
                        className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          i === 0 ? "bg-indigo-500 ring-4 ring-indigo-100" : "bg-slate-300"
                        }`}
                      />
                      <div className="flex-1 flex flex-wrap items-baseline justify-between gap-x-4">
                        <div>
                          <p className={`text-sm ${i === 0 ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                            {event.status}
                          </p>
                          <p className="text-xs text-slate-500">{event.location}</p>
                        </div>
                        <p className="text-xs text-slate-400">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <aside>
            <SupportCard productName={order.productName} />
          </aside>
        </div>
      </main>
    </SupportPanel>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium mt-0.5">{value}</dd>
    </div>
  );
}

const helpTopics = ["Where's my package?", "Report damage, with a photo", "Request a replacement"];

// Rendered inside the support sidebar, so it can open the chat directly.
function SupportCard({ productName }: { productName: string }) {
  const { open, setOpen } = useChatContext();
  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 shadow-sm @3xl:sticky @3xl:top-24">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-9 6 3-3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v13Z" />
        </svg>
      </div>
      <h2 className="font-semibold text-slate-900 mt-4">Need help with this order?</h2>
      <p className="text-sm text-slate-500 mt-1">
        Our AI assistant already knows your {productName} order. Type, speak, or send a photo.
      </p>
      <ul className="mt-4 space-y-2">
        {helpTopics.map((topic) => (
          <li key={topic} className="flex items-center gap-2 text-sm text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {topic}
          </li>
        ))}
      </ul>
      <button
        onClick={() => setOpen(!open)}
        className="w-full mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-700 transition"
      >
        {open ? "Close support chat" : "Chat with OrderCare"}
      </button>
    </section>
  );
}
