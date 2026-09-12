"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Props = {
  orderId: string;
  productName: string;
  caseId?: string;
  status: "inProgress" | "executing" | "complete";
  respond?: (value: string) => void;
};

export function ReplacementConfirmCard({ orderId, productName, caseId, status, respond }: Props) {
  const createReplacement = useMutation(api.returns.createReplacement);
  const [outcome, setOutcome] = useState<"pending" | "loading" | "confirmed" | "cancelled" | "error">(
    "pending"
  );
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const handleConfirm = async () => {
    setOutcome("loading");
    try {
      const result = await createReplacement({
        orderId,
        caseId: caseId as Id<"supportCases"> | undefined,
      });
      if (result.success) {
        setOutcome("confirmed");
        respond?.("Replacement request created successfully.");
      } else {
        setOutcome("error");
        setErrorReason(result.reason);
        respond?.(`Replacement could not be created: ${result.reason}`);
      }
    } catch (err) {
      setOutcome("error");
      setErrorReason(String(err));
      respond?.("Replacement could not be created due to a system error.");
    }
  };

  const handleCancel = () => {
    setOutcome("cancelled");
    respond?.("Customer cancelled the replacement request.");
  };

  if (status === "complete" || outcome === "confirmed" || outcome === "cancelled" || outcome === "error") {
    if (outcome === "confirmed") {
      return (
        <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 my-2 text-sm text-green-900">
          <p className="font-semibold">Replacement requested</p>
          <p className="mt-1">
            Order #{orderId} &middot; {productName}
          </p>
        </div>
      );
    }
    if (outcome === "error") {
      return (
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 my-2 text-sm text-red-900">
          <p className="font-semibold">Could not create replacement</p>
          <p className="mt-1">{errorReason}</p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 my-2 text-sm text-slate-600">
        Replacement request cancelled.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 my-2 text-sm">
      <p className="font-semibold text-amber-900">Replacement request ready</p>
      <p className="mt-1 text-amber-900">
        Order #{orderId} &middot; {productName}
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleConfirm}
          disabled={outcome === "loading"}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {outcome === "loading" ? "Confirming..." : "Confirm Replacement"}
        </button>
        <button
          onClick={handleCancel}
          disabled={outcome === "loading"}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
