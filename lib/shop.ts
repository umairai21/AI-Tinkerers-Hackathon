const priceFormat = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}

const categoryIcons: Record<string, string> = {
  smartphone: "📱",
  audio: "🎧",
  laptop: "💻",
  wearable: "⌚",
  tablet: "📲",
};

const dateFormat = new Intl.DateTimeFormat("en-AE", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(timestamp: number) {
  return dateFormat.format(timestamp);
}

const dateTimeFormat = new Intl.DateTimeFormat("en-AE", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(timestamp: number) {
  return dateTimeFormat.format(timestamp);
}

export function categoryIcon(category: string) {
  return categoryIcons[category] ?? "📦";
}

const categoryTints: Record<string, string> = {
  smartphone: "from-indigo-100 to-violet-50",
  audio: "from-sky-100 to-cyan-50",
  laptop: "from-slate-200 to-slate-50",
  wearable: "from-rose-100 to-orange-50",
  tablet: "from-emerald-100 to-teal-50",
};

// Soft gradient behind a product's icon tile.
export function categoryTint(category: string) {
  return `bg-gradient-to-br ${categoryTints[category] ?? "from-slate-100 to-white"}`;
}

export const SHIPMENT_STEPS = [
  { status: "processing", label: "Placed" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

// Index of the order's step in SHIPMENT_STEPS; replacement requests count as delivered.
export function shipmentStep(status: string) {
  if (status === "replacement_requested") return SHIPMENT_STEPS.length - 1;
  return Math.max(0, SHIPMENT_STEPS.findIndex((s) => s.status === status));
}

export const statusStyles: Record<string, string> = {
  processing: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10",
  shipped: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  out_for_delivery: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20",
  delivered: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  replacement_requested: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};

export const statusDot: Record<string, string> = {
  processing: "bg-slate-400",
  shipped: "bg-blue-500",
  out_for_delivery: "bg-indigo-500",
  delivered: "bg-green-500",
  replacement_requested: "bg-amber-500",
};

export const defaultStatusStyle = "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/10";

export function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}
