import { internalMutation } from "./_generated/server";

// Wipes order data and recreates the product catalog. Orders now come from real
// checkouts, each owned by the visitor's anonymous user. Internal so a public visitor
// can't call it. Run with: npx convex run seed:seed
export const seed = internalMutation({
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

    const products = [
      {
        productId: "iphone16",
        name: "iPhone 16",
        description: "6.1-inch display, A18 chip, 128 GB.",
        price: 3399,
        category: "smartphone",
        replacementAvailable: true,
        warrantyDays: 365,
      },
      {
        productId: "airpods-pro",
        name: "AirPods Pro",
        description: "Active noise cancellation with USB-C case.",
        price: 949,
        category: "audio",
        replacementAvailable: true,
        warrantyDays: 180,
      },
      {
        productId: "macbook-air",
        name: "MacBook Air M3",
        description: "13-inch, 8-core CPU, 256 GB SSD.",
        price: 4499,
        category: "laptop",
        replacementAvailable: false,
        warrantyDays: 365,
      },
      {
        productId: "apple-watch",
        name: "Apple Watch Series 10",
        description: "42 mm aluminium case with sport band.",
        price: 1599,
        category: "wearable",
        replacementAvailable: true,
        warrantyDays: 365,
      },
      {
        productId: "ipad-air",
        name: "iPad Air",
        description: "11-inch Liquid Retina display, M2 chip.",
        price: 2499,
        category: "tablet",
        replacementAvailable: true,
        warrantyDays: 365,
      },
    ];
    for (const product of products) await ctx.db.insert("products", product);

    return { success: true };
  },
});
