import { query } from "./_generated/server";
import { v } from "convex/values";
import { getOwnedOrder } from "./customer";

// Scoped to tracking data only.
export const getTrackingStatus = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) {
      return { found: false as const };
    }
    return {
      found: true as const,
      orderId: order.orderId,
      status: order.trackingStatus,
      location: order.trackingLocation,
      eta: order.eta,
    };
  },
});

export const getTrackingHistory = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) return [];

    const events = await ctx.db
      .query("trackingEvents")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .take(100);
    return events
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e) => ({
        status: e.status,
        location: e.location,
        timestamp: e.timestamp,
      }));
  },
});
