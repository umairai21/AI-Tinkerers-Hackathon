"use client";

import { useCopilotAction, useCopilotReadable, useCopilotChat } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useConvex, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { TrackingCard, EligibilityCard } from "./cards";
import { ReplacementConfirmCard } from "./ReplacementConfirmCard";
import { ORDERCARE_INSTRUCTIONS } from "@/lib/prompt";
import { statusLabel } from "@/lib/shop";
import { SpokenReplies } from "./SpokenReplies";
import { ChatInput } from "./ChatInput";
import { ReactNode, useEffect, useRef } from "react";

export type OrderContext = {
  orderId: string;
  customerId: string;
  productId: string;
  productName: string;
  status: string;
};

const SUGGESTIONS = [
  { title: "Where's my order?", message: "Where's my order?" },
  { title: "Report a problem", message: "There's a problem with my item." },
  { title: "Can I get a replacement?", message: "Is this order eligible for a replacement?" },
];

// Page content goes in as children: they share the sidebar's chat context (so a button can
// open the chat with useChatContext) and shift left when the sidebar opens.
export function SupportPanel({ order, children }: { order: OrderContext; children: ReactNode }) {
  const convex = useConvex();
  const lastImageIdRef = useRef<Id<"_storage"> | null>(null);
  const generateUploadUrl = useMutation(api.supportCases.generateUploadUrl);
  const { reset } = useCopilotChat();
  const previousOrderIdRef = useRef(order.orderId);

  // The chat's message history lives on a single shared agent instance in the
  // top-level CopilotKit provider, which never unmounts between page navigations.
  // Without this, switching orders keeps the previous order's conversation alive.
  useEffect(() => {
    if (previousOrderIdRef.current !== order.orderId) {
      reset();
      previousOrderIdRef.current = order.orderId;
    }
  }, [order.orderId, reset]);

  useCopilotReadable({
    description:
      "The current order and product the customer is viewing on the support page. Already known, do not ask the customer for it.",
    value: order,
  });

  useCopilotAction({
    name: "getTrackingInfo",
    description:
      "Get the current shipping/tracking status, location, and ETA for the customer's order. Use this whenever the customer asks about tracking, delivery, or where their order/replacement is.",
    parameters: [
      {
        name: "orderId",
        type: "string",
        description: "Order ID to check. Defaults to the current order if omitted.",
        required: false,
      },
    ],
    handler: async ({ orderId }) => {
      const id = orderId || order.orderId;
      const tracking = await convex.query(api.tracking.getTrackingStatus, { orderId: id });
      return tracking;
    },
    render: ({ status, result }) => {
      if (status !== "complete" || !result) {
        return <div className="text-sm text-slate-500 px-1 py-1">Checking order status...</div>;
      }
      if (!result.found) {
        return <div className="text-sm text-red-600 px-1 py-1">Order not found.</div>;
      }
      return (
        <TrackingCard
          orderId={result.orderId}
          status={result.status}
          location={result.location}
          eta={result.eta}
        />
      );
    },
  });

  useCopilotAction({
    name: "reportProductIssue",
    description:
      "Report a product issue or damage for the current order. Creates a support case and checks replacement eligibility. Use this when the customer describes a problem with the product, such as damage.",
    parameters: [
      {
        name: "description",
        type: "string",
        description: "The customer's description of the issue, including any image analysis notes.",
      },
      {
        name: "issueType",
        type: "string",
        description: "A short label for the issue, e.g. cracked_screen, water_damage, physical_damage.",
        required: false,
      },
    ],
    handler: async ({ description, issueType }) => {
      const caseResult = await convex.mutation(api.supportCases.createSupportCase, {
        orderId: order.orderId,
        issueType: issueType || "product_issue",
        description,
        imageStorageId: lastImageIdRef.current ?? undefined,
      });
      if (!caseResult.success) {
        return { success: false, reason: caseResult.reason };
      }
      const eligibility = await convex.query(api.returns.checkReturnEligibility, {
        orderId: order.orderId,
      });
      return { success: true, caseId: caseResult.caseId, ...eligibility };
    },
    render: ({ status, result }) => {
      if (status !== "complete" || !result) {
        return <div className="text-sm text-slate-500 px-1 py-1">Checking replacement eligibility...</div>;
      }
      if (!result.success) {
        return <div className="text-sm text-red-600 px-1 py-1">{result.reason}</div>;
      }
      return (
        <EligibilityCard
          eligible={result.eligible}
          reason={result.reason}
          replacementAvailable={result.replacementAvailable}
        />
      );
    },
  });

  useCopilotAction({
    name: "confirmReplacement",
    description:
      "Create a replacement request for the current order. This is a consequential action: only call it after the customer has explicitly agreed to proceed.",
    parameters: [],
    renderAndWaitForResponse: ({ respond, status }) => (
      <ReplacementConfirmCard
        orderId={order.orderId}
        productName={order.productName}
        status={status}
        respond={respond}
      />
    ),
  });

  return (
    <>
      <SpokenReplies />
      <CopilotSidebar
        instructions={ORDERCARE_INSTRUCTIONS}
        Input={ChatInput}
        clickOutsideToClose={false}
        suggestions={SUGGESTIONS}
        labels={{
          title: "OrderCare Support",
          initial: `Hi! I can see you're on Order #${order.orderId} (${order.productName}), currently ${statusLabel(order.status)}. How can I help?`,
        }}
        attachments={{
          enabled: true,
          accept: "image/*",
          maxSize: 8 * 1024 * 1024,
          onUpload: async (file) => {
            const dataUrl: string = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            // Persist the original file in Convex storage; the support case keeps only its ID.
            try {
              const uploadUrl = await generateUploadUrl();
              const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              });
              const { storageId } = await uploadRes.json();
              lastImageIdRef.current = storageId;
            } catch {
              // Storage is for the case record; the chat can continue without it.
            }

            let description = "";
            try {
              const res = await fetch("/api/analyze-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: dataUrl, productName: order.productName }),
              });
              const data = await res.json();
              description = data.description || "";
            } catch {
              // Analysis is a best-effort aid; the model can still see the raw image.
            }

            return {
              type: "data",
              value: dataUrl.split(",")[1] ?? dataUrl,
              mimeType: file.type,
              metadata: description ? { analysis: description } : undefined,
            };
          },
        }}
      >
        {children}
      </CopilotSidebar>
    </>
  );
}
