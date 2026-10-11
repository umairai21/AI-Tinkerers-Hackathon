import { query } from "./_generated/server";

// Public catalog for the shop page.
export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").take(50);
    return products.map((p) => ({
      productId: p.productId,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
    }));
  },
});

