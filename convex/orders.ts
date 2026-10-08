import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentCustomerId, getOwnedOrder } from "./customer";

// Lists the current customer's orders for the "My Orders" page.
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const customerId = await getCurrentCustomerId(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_customerId", (q) => q.eq("customerId", customerId))
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
        status: order.status,
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
      status: order.status,
    };
  },
});
