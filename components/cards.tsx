"use client";

export function TrackingCard({
  orderId,
  status,
  location,
  eta,
}: {
  orderId: string;
  status: string;
  location: string;
  eta: string;
}) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 my-2 text-sm">
      <p className="font-semibold text-blue-900">Order #{orderId}</p>
      <div className="mt-2 space-y-1 text-blue-800">
        <p>
          Status: <span className="font-medium capitalize">{status}</span>
        </p>
        <p>Location: {location}</p>
        <p>ETA: {eta}</p>
      </div>
    </div>
  );
}

export function EligibilityCard({
  eligible,
  reason,
  replacementAvailable,
}: {
  eligible: boolean;
  reason: string;
  replacementAvailable: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 my-2 text-sm ${
        eligible ? "border-green-100 bg-green-50/60 text-green-900" : "border-red-100 bg-red-50/60 text-red-900"
      }`}
    >
      <p className="font-semibold">{eligible ? "Eligible for replacement" : "Not eligible"}</p>
      <p className="mt-1">{reason}</p>
      {eligible && (
        <p className="mt-1">
          Replacement available: <span className="font-medium">{replacementAvailable ? "Yes" : "No"}</span>
        </p>
      )}
    </div>
  );
}
