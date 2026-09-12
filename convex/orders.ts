import { query } from "./_generated/server";
import { v } from "convex/values";

// Demo helper: list all orders for the "My Orders" page. Single-customer app for now.
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

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
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();
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
