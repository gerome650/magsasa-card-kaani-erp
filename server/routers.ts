import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Farm management routers
  farms: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFarmsByUserId(ctx.user.id);
    }),
    
    getById: publicProcedure  // Temporarily public for testing
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getFarmById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        farmerName: z.string(),
        barangay: z.string(),
        municipality: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        size: z.number(),
        crops: z.array(z.string()),
        soilType: z.string().optional(),
        irrigationType: z.enum(["Irrigated", "Rainfed", "Upland"]).optional(),
        averageYield: z.number().optional(),
        status: z.enum(["active", "inactive", "fallow"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const farmId = await db.createFarm({
          ...input,
          userId: ctx.user.id,
        });
        return { farmId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        farmerName: z.string().optional(),
        barangay: z.string().optional(),
        municipality: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        size: z.number().optional(),
        crops: z.array(z.string()).optional(),
        soilType: z.string().optional(),
        irrigationType: z.enum(["Irrigated", "Rainfed", "Upland"]).optional(),
        averageYield: z.number().optional(),
        status: z.enum(["active", "inactive", "fallow"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateFarm(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteFarm(input.id);
        return { success: true };
      }),
    
    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const results = {
          success: [] as number[],
          failed: [] as { id: number; error: string }[],
        };
        
        for (const id of input.ids) {
          try {
            await db.deleteFarm(id);
            results.success.push(id);
          } catch (error) {
            results.failed.push({
              id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
        
        return results;
      }),
  }),
  
  boundaries: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBoundariesByFarmId(input.farmId);
      }),
    
    save: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        boundaries: z.array(z.object({
        parcelIndex: z.number(),
        geoJson: z.string(),
        area: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.saveBoundaries(input.farmId, input.boundaries);
        return { success: true };
      }),
  }),
  
  yields: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getYieldsByFarmId(input.farmId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        parcelIndex: z.number(),
        cropType: z.string(),
        harvestDate: z.string(),
        quantity: z.number(),
        unit: z.enum(["kg", "tons"]),
        qualityGrade: z.enum(["Premium", "Standard", "Below Standard"]),
      }))
      .mutation(async ({ input }) => {
        const yieldId = await db.createYield(input);
        return { yieldId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteYield(input.id);
        return { success: true };
      }),
  }),
  
  costs: router({
    getByFarmId: protectedProcedure
      .input(z.object({ farmId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCostsByFarmId(input.farmId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        farmId: z.number(),
        date: z.string(),
        category: z.enum(["Fertilizer", "Pesticides", "Seeds", "Labor", "Equipment", "Other"]),
        description: z.string().optional(),
        amount: z.number(),
        parcelIndex: z.number().nullable(),
      }))
      .mutation(async ({ input }) => {
        const costId = await db.createCost(input);
        return { costId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCost(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
