import { internalMutation, mutation, MutationCtx, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getCurrentCustomerId, getOwnedOrder, requireCustomerId } from "./customer";

// Lists the current customer's orders for the "My Orders" page, newest first.
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const customerId = await getCurrentCustomerId(ctx);
    if (!customerId) return [];
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customerId", (q) => q.eq("customerId", customerId))
      .order("desc")
      .take(50);

    const results = [];
    for (const order of orders) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_productId", (q) => q.eq("productId", order.productId))
        .unique();
      results.push({
        orderId: order.orderId,
        productName: product?.name ?? "Unknown product",
        category: product?.category ?? "other",
        quantity: order.quantity,
        status: order.status,
        purchasedAt: order.purchasedAt,
      });
    }
    return results;
  },
});

// Returns only the context an agent needs: customer/order/product basics.
export const getOrder = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) return null;

    const product = await ctx.db
      .query("products")
      .withIndex("by_productId", (q) => q.eq("productId", order.productId))
      .unique();

    return {
      orderId: order.orderId,
      customerId: order.customerId,
      productId: order.productId,
      productName: product?.name ?? "Unknown product",
      category: product?.category ?? "other",
      quantity: order.quantity,
      status: order.status,
      purchasedAt: order.purchasedAt,
      eta: order.eta,
    };
  },
});

const MAX_CART_LINES = 10;
const MAX_QUANTITY = 5;

// Checkout: one order per cart line, so each product gets its own tracking and support.
export const placeOrder = mutation({
  args: {
    items: v.array(v.object({ productId: v.string(), quantity: v.number() })),
  },
  handler: async (ctx, { items }) => {
    const customerId = await requireCustomerId(ctx);
    if (items.length === 0) throw new ConvexError("Your cart is empty.");
    if (items.length > MAX_CART_LINES) throw new ConvexError("Too many items in one order.");

    const now = Date.now();
    const orderIds: string[] = [];
    for (const { productId, quantity } of items) {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        throw new ConvexError(`Quantity must be between 1 and ${MAX_QUANTITY}.`);
      }
      const product = await ctx.db
        .query("products")
        .withIndex("by_productId", (q) => q.eq("productId", productId))
        .unique();
      if (!product) throw new ConvexError("A product in your cart is no longer available.");

      const orderId = await newOrderId(ctx);
      await ctx.db.insert("orders", {
        orderId,
        customerId,
        productId,
        quantity,
        status: "processing",
        trackingStatus: "Order placed",
        trackingLocation: "Online",
        eta: "2-3 business days",
        purchasedAt: now,
        returnEligible: true,
      });
      await ctx.db.insert("trackingEvents", {
        orderId,
        status: "Order placed",
        location: "Online",
        timestamp: now,
      });
      await ctx.scheduler.runAfter(SHIPMENT_STEP_MS, internal.orders.advanceShipment, { orderId });
      orderIds.push(orderId);
    }
    return { orderIds };
  },
});

async function newOrderId(ctx: MutationCtx) {
  for (;;) {
    const candidate = String(100000 + Math.floor(Math.random() * 900000));
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", candidate))
      .first();
    if (!existing) return candidate;
  }
}

// Demo delivery simulation: a new order moves to delivered over a couple of minutes,
// so testers can try tracking and then report an issue on a delivered item.
const SHIPMENT_STEP_MS = 30_000;
const SHIPMENT_STAGES: Record<
  string,
  { status: string; trackingStatus: string; location: string; eta: string }
> = {
  processing: {
    status: "shipped",
    trackingStatus: "Shipped",
    location: "Dubai Distribution Center",
    eta: "Tomorrow by 8 PM",
  },
  shipped: {
    status: "out_for_delivery",
    trackingStatus: "Out for delivery",
    location: "Dubai Distribution Center",
    eta: "Today by 8 PM",
  },
  out_for_delivery: {
    status: "delivered",
    trackingStatus: "Delivered",
    location: "Customer address, Dubai",
    eta: "Delivered",
  },
};

export const advanceShipment = internalMutation({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();
    // Stops on its own once delivered, or if something else (e.g. a replacement) took over.
    const next = order && SHIPMENT_STAGES[order.status];
    if (!order || !next) return;

    await ctx.db.patch(order._id, {
      status: next.status,
      trackingStatus: next.trackingStatus,
      trackingLocation: next.location,
      eta: next.eta,
    });
    await ctx.db.insert("trackingEvents", {
      orderId,
      status: next.trackingStatus,
      location: next.location,
      timestamp: Date.now(),
    });
    if (SHIPMENT_STAGES[next.status]) {
      await ctx.scheduler.runAfter(SHIPMENT_STEP_MS, internal.orders.advanceShipment, { orderId });
    }
  },
});
