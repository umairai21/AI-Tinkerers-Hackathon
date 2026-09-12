import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Scoped to product-issue/support-case data only.
export const createSupportCase = mutation({
  args: {
    orderId: v.string(),
    issueType: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { orderId, issueType, description, imageUrl }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .unique();
    if (!order) {
      return { success: false as const, reason: "Order not found." };
    }

    // Reuse an existing open case for this order instead of creating duplicates.
    const existing = await ctx.db
      .query("supportCases")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .filter((q) => q.eq(q.field("status"), "open"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        issueType,
        description,
        imageUrl: imageUrl ?? existing.imageUrl,
      });
      return { success: true as const, caseId: existing._id, status: existing.status };
    }

    const caseId = await ctx.db.insert("supportCases", {
      orderId,
      issueType,
      description,
      imageUrl,
      status: "open",
      createdAt: Date.now(),
    });

    return { success: true as const, caseId, status: "open" };
  },
});

export const getSupportCase = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const cases = await ctx.db
      .query("supportCases")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .collect();
    if (cases.length === 0) return null;
    const latest = cases.sort((a, b) => b.createdAt - a.createdAt)[0];
    return {
      caseId: latest._id,
      issueType: latest.issueType,
      description: latest.description,
      imageUrl: latest.imageUrl,
      status: latest.status,
    };
  },
});
