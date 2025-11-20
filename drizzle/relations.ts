import { relations } from "drizzle-orm";
import { users, farms, batchOrders, batchOrderItems } from "./schema";

// Batch Order relations
export const batchOrdersRelations = relations(batchOrders, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [batchOrders.createdByUserId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [batchOrders.approvedByUserId],
    references: [users.id],
  }),
  items: many(batchOrderItems),
}));

export const batchOrderItemsRelations = relations(batchOrderItems, ({ one }) => ({
  batchOrder: one(batchOrders, {
    fields: [batchOrderItems.batchOrderId],
    references: [batchOrders.id],
  }),
  farm: one(farms, {
    fields: [batchOrderItems.farmId],
    references: [farms.id],
  }),
  farmer: one(users, {
    fields: [batchOrderItems.farmerId],
    references: [users.id],
  }),
}));
