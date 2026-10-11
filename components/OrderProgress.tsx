import { SHIPMENT_STEPS, shipmentStep } from "@/lib/shop";

// Delivery progress. `compact` is a thin segmented bar for order cards; the full version
// adds step dots and labels for the order page.
export function OrderProgress({ status, compact = false }: { status: string; compact?: boolean }) {
  const current = shipmentStep(status);
  const replacement = status === "replacement_requested";
  const done = replacement ? "bg-amber-400" : current === SHIPMENT_STEPS.length - 1 ? "bg-green-500" : "bg-indigo-500";

  if (compact) {
    return (
      <div className="flex gap-1" aria-label={`Delivery progress: ${SHIPMENT_STEPS[current].label}`}>
        {SHIPMENT_STEPS.map((step, i) => (
          <span key={step.status} className={`h-1.5 flex-1 rounded-full ${i <= current ? done : "bg-slate-200"}`} />
        ))}
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-4">
      {SHIPMENT_STEPS.map((step, i) => {
        const reached = i <= current;
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span
                className={`absolute top-2.5 right-1/2 w-full h-0.5 -translate-y-1/2 ${reached ? done : "bg-slate-200"}`}
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white ${
                reached ? done : "bg-slate-200"
              }`}
            >
              {reached && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className={`mt-2 text-xs ${i === current ? "font-semibold text-slate-900" : "text-slate-500"}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
