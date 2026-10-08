import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getOwnedOrder } from "./customer";

// Scoped to product-issue/support-case data only.

// Evidence photos go to Convex file storage; the case stores only the storage ID.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createSupportCase = mutation({
  args: {
    orderId: v.string(),
    issueType: v.string(),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { orderId, issueType, description, imageStorageId }) => {
    const order = await getOwnedOrder(ctx, orderId);
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
        imageStorageId: imageStorageId ?? existing.imageStorageId,
      });
      return { success: true as const, caseId: existing._id, status: existing.status };
    }

    const caseId = await ctx.db.insert("supportCases", {
      orderId,
      issueType,
      description,
      imageStorageId,
      status: "open",
      createdAt: Date.now(),
    });

    return { success: true as const, caseId, status: "open" };
  },
});

export const getSupportCase = query({
  args: { orderId: v.string() },
  handler: async (ctx, { orderId }) => {
    const order = await getOwnedOrder(ctx, orderId);
    if (!order) return null;

    const latest = await ctx.db
      .query("supportCases")
      .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
      .order("desc")
      .first();
    if (!latest) return null;
    return {
      caseId: latest._id,
      issueType: latest.issueType,
      description: latest.description,
      imageUrl: latest.imageStorageId
        ? await ctx.storage.getUrl(latest.imageStorageId)
        : (latest.imageUrl ?? null),
      status: latest.status,
    };
  },
});
