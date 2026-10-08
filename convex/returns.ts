import { mutation, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getOwnedOrder } from "./customer";

// Scoped to return/replacement eligibility only.

async function getActiveReplacement(ctx: QueryCtx, orderId: string) {
  return await ctx.db
    .query("replacements")
    .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
    .filter((q) => q.neq(q.field("status"), "cancelled"))
    .first();
}

export const checkReturnEligibility = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) {
      return { eligible: false, reason: "Order not found.", replacementAvailable: false };
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_productId", (q) => q.eq("productId", order.productId))
      .unique();

    if (!order.returnEligible) {
      return {
        eligible: false,
        reason: "This order is outside the return/replacement window.",
        replacementAvailable: false,
      };
    }

    if (await getActiveReplacement(ctx, orderId)) {
      return {
        eligible: false,
        reason: "A replacement has already been requested for this order.",
        replacementAvailable: false,
      };
    }

    return {
      eligible: true,
      reason: "Order is within the eligible window for return/replacement.",
      replacementAvailable: product?.replacementAvailable ?? false,
    };
  },
});

export const createReplacement = mutation({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) {
      return { success: false as const, reason: "Order not found." };
    }
    if (!order.returnEligible) {
      return { success: false as const, reason: "Order is not eligible for replacement." };
    }
    if (await getActiveReplacement(ctx, orderId)) {
      return {
        success: false as const,
        reason: "A replacement has already been requested for this order.",
      };
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_productId", (q) => q.eq("productId", order.productId))
      .unique();
    if (!product?.replacementAvailable) {
      return { success: false as const, reason: "Replacement is not available for this product." };
    }

    // Link the order's open support case server-side rather than trusting a client-supplied ID.
    const openCase = await ctx.db
      .query("supportCases")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    const now = Date.now();
    const replacementId = await ctx.db.insert("replacements", {
      orderId,
      caseId: openCase?._id,
      status: "requested",
      createdAt: now,
    });

    if (openCase) {
      await ctx.db.patch(openCase._id, { status: "resolved", resolution: "replacement_requested" });
    }
    await ctx.db.patch(order._id, {
      status: "replacement_requested",
      trackingStatus: "Replacement processing",
      trackingLocation: "Dubai Fulfillment Center",
      eta: "3-5 business days",
    });
    await ctx.db.insert("trackingEvents", {
      orderId,
      status: "Replacement requested",
      location: "Dubai Fulfillment Center",
      timestamp: now,
    });

    return { success: true as const, replacementId, status: "requested" };
  },
});

export const getReplacementStatus = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) return null;

    const latest = await ctx.db
      .query("replacements")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .order("desc")
      .first();
    if (!latest) return null;
    return { replacementId: latest._id, status: latest.status, createdAt: latest.createdAt };
  },
});
