import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    orderId: v.string(),
    customerId: v.string(),
    productId: v.string(),
    status: v.string(),
    trackingStatus: v.string(),
    trackingLocation: v.string(),
    eta: v.string(),
    purchasedAt: v.number(),
    returnEligible: v.boolean(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_customerId", ["customerId"]),

  products: defineTable({
    productId: v.string(),
    name: v.string(),
    category: v.string(),
    replacementAvailable: v.boolean(),
    warrantyDays: v.number(),
  }).index("by_productId", ["productId"]),

  supportCases: defineTable({
    orderId: v.string(),
    issueType: v.string(),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    // Legacy: inline data URLs from before file storage. New cases use imageStorageId.
    imageUrl: v.optional(v.string()),
    status: v.string(),
    resolution: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_orderId", ["orderId"]),

  replacements: defineTable({
    orderId: v.string(),
    caseId: v.optional(v.id("supportCases")),
    status: v.string(),
    createdAt: v.number(),
  }).index("by_orderId", ["orderId"]),

  trackingEvents: defineTable({
    orderId: v.string(),
    status: v.string(),
    location: v.string(),
    timestamp: v.number(),
  }).index("by_orderId", ["orderId"]),
});
