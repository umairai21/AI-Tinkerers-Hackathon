import { mutation } from "./_generated/server";

// Wipes and recreates demo data. Run with: npx convex run seed:seed
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    for (const table of [
      "orders",
      "products",
      "supportCases",
      "replacements",
      "trackingEvents",
    ] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    await ctx.db.insert("products", {
      productId: "iphone16",
      name: "iPhone 16",
      category: "smartphone",
      replacementAvailable: true,
      warrantyDays: 365,
    });
    await ctx.db.insert("products", {
      productId: "airpods-pro",
      name: "AirPods Pro",
      category: "audio",
      replacementAvailable: true,
      warrantyDays: 180,
    });
    await ctx.db.insert("products", {
      productId: "macbook-air",
      name: "MacBook Air M3",
      category: "laptop",
      replacementAvailable: false,
      warrantyDays: 365,
    });

    // Primary demo order: iPhone 16, delivered, eligible for replacement.
    await ctx.db.insert("orders", {
      orderId: "4821",
      customerId: "C102",
      productId: "iphone16",
      status: "delivered",
      trackingStatus: "Delivered",
      trackingLocation: "Customer address, Dubai",
      eta: "Delivered",
      purchasedAt: now - 5 * day,
      returnEligible: true,
    });

    await ctx.db.insert("trackingEvents", {
      orderId: "4821",
      status: "Order placed",
      location: "Online",
      timestamp: now - 5 * day,
    });
    await ctx.db.insert("trackingEvents", {
      orderId: "4821",
      status: "Shipped",
      location: "Dubai Distribution Center",
      timestamp: now - 3 * day,
    });
    await ctx.db.insert("trackingEvents", {
      orderId: "4821",
      status: "Out for delivery",
      location: "Dubai Distribution Center",
      timestamp: now - 1 * day,
    });
    await ctx.db.insert("trackingEvents", {
      orderId: "4821",
      status: "Delivered",
      location: "Customer address, Dubai",
      timestamp: now - 0.5 * day,
    });

    // Secondary orders for realism.
    await ctx.db.insert("orders", {
      orderId: "3310",
      customerId: "C102",
      productId: "airpods-pro",
      status: "shipped",
      trackingStatus: "In transit",
      trackingLocation: "Abu Dhabi Hub",
      eta: "Tomorrow by 8 PM",
      purchasedAt: now - 2 * day,
      returnEligible: true,
    });
    await ctx.db.insert("trackingEvents", {
      orderId: "3310",
      status: "Shipped",
      location: "Abu Dhabi Hub",
      timestamp: now - 1 * day,
    });

    await ctx.db.insert("orders", {
      orderId: "2207",
      customerId: "C201",
      productId: "macbook-air",
      status: "delivered",
      trackingStatus: "Delivered",
      trackingLocation: "Customer address, Sharjah",
      eta: "Delivered",
      purchasedAt: now - 60 * day,
      returnEligible: false,
    });

    return { success: true };
  },
});
