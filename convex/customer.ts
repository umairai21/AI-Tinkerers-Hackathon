import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Every visitor is signed in anonymously on first load, so each browser gets its own
// customer identity without a login form. The customer is resolved server-side from
// the auth token, never taken from client args. Returns null when signed out.
export async function getCurrentCustomerId(ctx: QueryCtx): Promise<Id<"users"> | null> {
  return await getAuthUserId(ctx);
}

export async function requireCustomerId(ctx: QueryCtx): Promise<Id<"users">> {
  const customerId = await getCurrentCustomerId(ctx);
  if (!customerId) throw new Error("Not signed in.");
  return customerId;
}

// Loads an order only if it belongs to the current customer. Returns null otherwise,
// so callers can't distinguish "someone else's order" from "no such order".
export async function getOwnedOrder(ctx: QueryCtx, orderId: string) {
  const customerId = await getCurrentCustomerId(ctx);
  if (!customerId) return null;
  const order = await ctx.db
    .query("orders")
    .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
    .unique();
  if (!order || order.customerId !== customerId) return null;
  return order;
}
