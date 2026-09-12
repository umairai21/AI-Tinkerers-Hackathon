import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Scoped to return/replacement eligibility only.
export const checkReturnEligibility = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();
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

    return {
      eligible: true,
      reason: "Order is within the eligible window for return/replacement.",
      replacementAvailable: product?.replacementAvailable ?? false,
    };
  },
});

export const createReplacement = mutation({
  args: { orderId: v.string(), caseId: v.optional(v.id("supportCases")) },
  handler: async (ctx, { orderId, caseId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();
    if (!order) {
      return { success: false as const, reason: "Order not found." };
    }
    if (!order.returnEligible) {
      return { success: false as const, reason: "Order is not eligible for replacement." };
    }

    const product = await ctx.db
      .query("products")
      .withIndex("by_productId", (q) => q.eq("productId", order.productId))
      .unique();
    if (!product?.replacementAvailable) {
      return { success: false as const, reason: "Replacement is not available for this product." };
    }

    const replacementId = await ctx.db.insert("replacements", {
      orderId,
      caseId,
      status: "requested",
      createdAt: Date.now(),
    });

    const now = Date.now();
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
    const replacements = await ctx.db
      .query("replacements")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .collect();
    if (replacements.length === 0) return null;
    const latest = replacements.sort((a, b) => b.createdAt - a.createdAt)[0];
    return { replacementId: latest._id, status: latest.status, createdAt: latest.createdAt };
  },
});
