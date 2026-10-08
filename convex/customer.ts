import { QueryCtx } from "./_generated/server";

// Demo identity: there is no sign-in yet, so every request acts as this customer.
// The customer is resolved server-side (never taken from client args), so swapping
// this for `ctx.auth.getUserIdentity()` later is the only change real auth needs.
const DEMO_CUSTOMER_ID = "C102";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getCurrentCustomerId(_ctx: QueryCtx): Promise<string> {
  return DEMO_CUSTOMER_ID;
}

// Loads an order only if it belongs to the current customer. Returns null otherwise,
// so callers can't distinguish "someone else's order" from "no such order".
export async function getOwnedOrder(ctx: QueryCtx, orderId: string) {
  const customerId = await getCurrentCustomerId(ctx);
  const order = await ctx.db
    .query("orders")
    .withIndex("by_orderId", (q) => q.eq("orderId", orderId))
    .unique();
  if (!order || order.customerId !== customerId) return null;
  return order;
}
