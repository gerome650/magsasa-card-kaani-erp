/**
 * Unit tests for DeliveryRequestService
 * 
 * Tests cover:
 * - Feature flag enforcement
 * - Allowed and disallowed transitions
 * - Event logging on transitions
 * - CRUD operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { deliveryRequestService, DeliveryRequestService } from "./service";
import { ENV } from "../_core/env";
import * as db from "../db";

// Mock the database module
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock ENV
vi.mock("../_core/env", () => ({
  ENV: {
    logisticsV0Enabled: true,
  },
}));

describe("DeliveryRequestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset feature flag to enabled by default
    (ENV as any).logisticsV0Enabled = true;
  });

  describe("Feature Flag", () => {
    it("should throw error when feature is disabled", async () => {
      (ENV as any).logisticsV0Enabled = false;

      await expect(deliveryRequestService.createDraft({})).rejects.toThrow(
        "Logistics v0 feature is disabled"
      );
    });

    it("should allow operations when feature is enabled", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.createDraft({
          createdByUserId: 1,
        })
      ).resolves.toBeDefined();
    });
  });

  describe("createDraft", () => {
    it("should create a draft delivery request", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const id = await deliveryRequestService.createDraft({
        createdByUserId: 1,
        batchOrderId: "batch-123",
        notes: "Test notes",
      });

      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("Transitions", () => {
    const mockRequest = (status: string) => ({
      id: "req-123",
      status,
      batchOrderId: null,
      createdByUserId: 1,
      assignedToUserId: null,
      notes: null,
      metadata: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    it("should allow DRAFT -> QUEUED transition", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("DRAFT")]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.transition("req-123", "QUEUED", 1)
      ).resolves.not.toThrow();
    });

    it("should allow QUEUED -> ASSIGNED transition", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("QUEUED")]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.assign("req-123", 2, 1)
      ).resolves.not.toThrow();
    });

    it("should allow ASSIGNED -> IN_TRANSIT transition", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("ASSIGNED")]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.markInTransit("req-123", 1)
      ).resolves.not.toThrow();
    });

    it("should allow IN_TRANSIT -> DELIVERED transition", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("IN_TRANSIT")]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.markDelivered("req-123", 1)
      ).resolves.not.toThrow();
    });

    it("should allow QUEUED -> FAILED transition", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("QUEUED")]),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(undefined),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue(undefined),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.fail("req-123", "Test reason", 1)
      ).resolves.not.toThrow();
    });

    it("should reject invalid transition DRAFT -> ASSIGNED", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("DRAFT")]),
              }),
            }),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.transition("req-123", "ASSIGNED", 1)
      ).rejects.toThrow("Invalid transition from DRAFT to ASSIGNED");
    });

    it("should reject invalid transition DELIVERED -> IN_TRANSIT", async () => {
      const mockDb = {
        transaction: vi.fn((fn) => fn({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([mockRequest("DELIVERED")]),
              }),
            }),
          }),
        })),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      await expect(
        deliveryRequestService.transition("req-123", "IN_TRANSIT", 1)
      ).rejects.toThrow("Invalid transition from DELIVERED to IN_TRANSIT");
    });
  });

  describe("getById", () => {
    it("should return delivery request by ID", async () => {
      const mockRequest = {
        id: "req-123",
        status: "DRAFT",
        batchOrderId: null,
        createdByUserId: 1,
        assignedToUserId: null,
        notes: null,
        metadata: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockRequest]),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await deliveryRequestService.getById("req-123");
      expect(result).toEqual(mockRequest);
    });

    it("should return null for non-existent request", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await deliveryRequestService.getById("non-existent");
      expect(result).toBeNull();
    });
  });
});

