import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";
import { deliveryRequestService } from "./service";

const FEATURE_DISABLED_ERROR = new TRPCError({
  code: "NOT_FOUND",
  message: "Logistics v0 feature is disabled",
});

/**
 * Check if feature flag is enabled, throw TRPCError if disabled
 */
function checkFeatureEnabled(): void {
  if (!ENV.logisticsV0Enabled) {
    throw FEATURE_DISABLED_ERROR;
  }
}

export const logisticsRouter = router({
  createDraft: protectedProcedure
    .input(
      z.object({
        batchOrderId: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      const id = await deliveryRequestService.createDraft({
        batchOrderId: input.batchOrderId ?? null,
        createdByUserId: ctx.user.id,
        notes: input.notes ?? null,
        metadata: input.metadata ?? null,
      });

      return { id };
    }),

  queue: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      await deliveryRequestService.queue(input.id, ctx.user.id);
      return { success: true };
    }),

  assign: adminProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToUserId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      await deliveryRequestService.assign(input.id, input.assignedToUserId, ctx.user.id);
      return { success: true };
    }),

  markInTransit: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      await deliveryRequestService.markInTransit(input.id, ctx.user.id);
      return { success: true };
    }),

  markDelivered: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      await deliveryRequestService.markDelivered(input.id, ctx.user.id);
      return { success: true };
    }),

  fail: adminProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      checkFeatureEnabled();

      await deliveryRequestService.fail(input.id, input.reason ?? null, ctx.user.id);
      return { success: true };
    }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      checkFeatureEnabled();

      const request = await deliveryRequestService.getById(input.id);
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Delivery request ${input.id} not found`,
        });
      }
      return request;
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          status: z
            .array(z.enum(["DRAFT", "QUEUED", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "FAILED"]))
            .optional(),
          batchOrderId: z.string().optional(),
          assignedToUserId: z.number().optional(),
          createdByUserId: z.number().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      checkFeatureEnabled();

      const requests = await deliveryRequestService.list(input);
      return requests;
    }),
});

