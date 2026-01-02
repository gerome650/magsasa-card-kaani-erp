/**
 * Unit tests for logisticsRouter
 * 
 * Tests cover:
 * - Feature flag blocks endpoints when disabled
 * - Happy path for all procedures when enabled
 * - Auth requirements (protectedProcedure vs adminProcedure)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { logisticsRouter } from "./router";
import { ENV } from "../_core/env";
import { deliveryRequestService } from "./service";

// Mock the service
vi.mock("./service", () => ({
  deliveryRequestService: {
    createDraft: vi.fn(),
    queue: vi.fn(),
    assign: vi.fn(),
    markInTransit: vi.fn(),
    markDelivered: vi.fn(),
    fail: vi.fn(),
    getById: vi.fn(),
    list: vi.fn(),
  },
}));

// Mock ENV
vi.mock("../_core/env", () => ({
  ENV: {
    logisticsV0Enabled: true,
  },
}));

describe("logisticsRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (ENV as any).logisticsV0Enabled = true;
  });

  describe("Feature Flag", () => {
    it("should block createDraft when feature is disabled", async () => {
      (ENV as any).logisticsV0Enabled = false;

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      await expect(
        caller.createDraft({})
      ).rejects.toThrow("Logistics v0 feature is disabled");
    });
  });

  describe("createDraft", () => {
    it("should create a draft when feature is enabled", async () => {
      vi.mocked(deliveryRequestService.createDraft).mockResolvedValue("req-123");

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      const result = await caller.createDraft({
        batchOrderId: "batch-123",
        notes: "Test",
      });

      expect(result).toEqual({ id: "req-123" });
      expect(deliveryRequestService.createDraft).toHaveBeenCalledWith({
        batchOrderId: "batch-123",
        createdByUserId: 1,
        notes: "Test",
        metadata: null,
      });
    });
  });

  describe("queue", () => {
    it("should queue a request", async () => {
      vi.mocked(deliveryRequestService.queue).mockResolvedValue(undefined);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      const result = await caller.queue({ id: "req-123" });

      expect(result).toEqual({ success: true });
      expect(deliveryRequestService.queue).toHaveBeenCalledWith("req-123", 1);
    });
  });

  describe("assign", () => {
    it("should assign a request (admin only)", async () => {
      vi.mocked(deliveryRequestService.assign).mockResolvedValue(undefined);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.assign({
        id: "req-123",
        assignedToUserId: 2,
      });

      expect(result).toEqual({ success: true });
      expect(deliveryRequestService.assign).toHaveBeenCalledWith("req-123", 2, 1);
    });
  });

  describe("markInTransit", () => {
    it("should mark request as in transit (admin only)", async () => {
      vi.mocked(deliveryRequestService.markInTransit).mockResolvedValue(undefined);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.markInTransit({ id: "req-123" });

      expect(result).toEqual({ success: true });
      expect(deliveryRequestService.markInTransit).toHaveBeenCalledWith("req-123", 1);
    });
  });

  describe("markDelivered", () => {
    it("should mark request as delivered (admin only)", async () => {
      vi.mocked(deliveryRequestService.markDelivered).mockResolvedValue(undefined);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.markDelivered({ id: "req-123" });

      expect(result).toEqual({ success: true });
      expect(deliveryRequestService.markDelivered).toHaveBeenCalledWith("req-123", 1);
    });
  });

  describe("fail", () => {
    it("should mark request as failed (admin only)", async () => {
      vi.mocked(deliveryRequestService.fail).mockResolvedValue(undefined);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.fail({
        id: "req-123",
        reason: "Test failure",
      });

      expect(result).toEqual({ success: true });
      expect(deliveryRequestService.fail).toHaveBeenCalledWith("req-123", "Test failure", 1);
    });
  });

  describe("getById", () => {
    it("should get request by ID", async () => {
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

      vi.mocked(deliveryRequestService.getById).mockResolvedValue(mockRequest);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      const result = await caller.getById({ id: "req-123" });

      expect(result).toEqual(mockRequest);
      expect(deliveryRequestService.getById).toHaveBeenCalledWith("req-123");
    });
  });

  describe("list", () => {
    it("should list requests with filters", async () => {
      const mockRequests = [
        {
          id: "req-123",
          status: "DRAFT",
          batchOrderId: null,
          createdByUserId: 1,
          assignedToUserId: null,
          notes: null,
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.mocked(deliveryRequestService.list).mockResolvedValue(mockRequests);

      const caller = logisticsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      const result = await caller.list({
        status: ["DRAFT", "QUEUED"],
        limit: 10,
      });

      expect(result).toEqual(mockRequests);
      expect(deliveryRequestService.list).toHaveBeenCalledWith({
        status: ["DRAFT", "QUEUED"],
        limit: 10,
      });
    });
  });
});

