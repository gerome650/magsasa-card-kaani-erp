import { getDb } from "../db";
import { deliveryRequests, deliveryRequestEvents } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { ENV } from "../_core/env";
import { randomUUID } from "crypto";
import type { InsertDeliveryRequest, InsertDeliveryRequestEvent } from "../../drizzle/schema";

export type DeliveryRequestStatus = "DRAFT" | "QUEUED" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "FAILED";

const FEATURE_DISABLED_ERROR = new Error("Logistics v0 feature is disabled");

/**
 * Valid transition map: fromStatus -> allowed toStatus[]
 */
const ALLOWED_TRANSITIONS: Record<DeliveryRequestStatus, DeliveryRequestStatus[]> = {
  DRAFT: ["QUEUED"],
  QUEUED: ["ASSIGNED", "FAILED"],
  ASSIGNED: ["IN_TRANSIT", "FAILED"],
  IN_TRANSIT: ["DELIVERED", "FAILED"],
  DELIVERED: [], // Terminal state
  FAILED: [], // Terminal state
};

export class DeliveryRequestService {
  /**
   * Check if feature flag is enabled
   */
  private checkFeatureEnabled(): void {
    if (!ENV.logisticsV0Enabled) {
      throw FEATURE_DISABLED_ERROR;
    }
  }

  /**
   * Validate transition is allowed
   */
  private validateTransition(fromStatus: DeliveryRequestStatus, toStatus: DeliveryRequestStatus): void {
    const allowed = ALLOWED_TRANSITIONS[fromStatus];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Invalid transition from ${fromStatus} to ${toStatus}`);
    }
  }

  /**
   * Create a draft delivery request
   */
  async createDraft(payload: {
    batchOrderId?: string | null;
    createdByUserId?: number | null;
    notes?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<string> {
    this.checkFeatureEnabled();

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const id = randomUUID();

    const insertData: InsertDeliveryRequest = {
      id,
      batchOrderId: payload.batchOrderId ?? null,
      status: "DRAFT",
      createdByUserId: payload.createdByUserId ?? null,
      assignedToUserId: null,
      notes: payload.notes ?? null,
      metadata: payload.metadata ?? null,
    };

    await db.insert(deliveryRequests).values(insertData);
    return id;
  }

  /**
   * Transition delivery request to a new status (with event logging)
   */
  async transition(
    id: string,
    toStatus: DeliveryRequestStatus,
    actorUserId: number | null,
    metadata?: Record<string, unknown> | null
  ): Promise<void> {
    this.checkFeatureEnabled();

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    await db.transaction(async (tx) => {
      // Fetch current request
      const [request] = await tx
        .select()
        .from(deliveryRequests)
        .where(eq(deliveryRequests.id, id))
        .limit(1);

      if (!request) {
        throw new Error(`Delivery request ${id} not found`);
      }

      const fromStatus = request.status as DeliveryRequestStatus;

      // Validate transition
      this.validateTransition(fromStatus, toStatus);

      // Update delivery request (updatedAt will be set automatically by onUpdateNow)
      await tx
        .update(deliveryRequests)
        .set({
          status: toStatus,
          // Update assignedToUserId for ASSIGNED status if provided in metadata
          ...(toStatus === "ASSIGNED" && metadata && typeof metadata.assignedToUserId === "number"
            ? { assignedToUserId: metadata.assignedToUserId }
            : {}),
        })
        .where(eq(deliveryRequests.id, id));

      // Create event record (createdAt will be set automatically by defaultNow)
      const eventData: InsertDeliveryRequestEvent = {
        id: randomUUID(),
        deliveryRequestId: id,
        fromStatus,
        toStatus,
        actorUserId: actorUserId ?? null,
        metadata: metadata ?? null,
      };

      await tx.insert(deliveryRequestEvents).values(eventData);
    });
  }

  /**
   * Convenience wrapper: Queue a draft request
   */
  async queue(id: string, actorUserId: number | null): Promise<void> {
    return this.transition(id, "QUEUED", actorUserId);
  }

  /**
   * Convenience wrapper: Assign a queued request
   */
  async assign(id: string, assignedToUserId: number, actorUserId: number | null): Promise<void> {
    return this.transition(id, "ASSIGNED", actorUserId, { assignedToUserId });
  }

  /**
   * Convenience wrapper: Mark as in transit
   */
  async markInTransit(id: string, actorUserId: number | null): Promise<void> {
    return this.transition(id, "IN_TRANSIT", actorUserId);
  }

  /**
   * Convenience wrapper: Mark as delivered
   */
  async markDelivered(id: string, actorUserId: number | null): Promise<void> {
    return this.transition(id, "DELIVERED", actorUserId);
  }

  /**
   * Convenience wrapper: Mark as failed
   */
  async fail(id: string, reason: string | null, actorUserId: number | null): Promise<void> {
    return this.transition(id, "FAILED", actorUserId, { reason: reason ?? null });
  }

  /**
   * Get delivery request by ID
   */
  async getById(id: string) {
    this.checkFeatureEnabled();

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    const [request] = await db
      .select()
      .from(deliveryRequests)
      .where(eq(deliveryRequests.id, id))
      .limit(1);

    return request ?? null;
  }

  /**
   * List delivery requests with optional filters
   */
  async list(filters?: {
    status?: DeliveryRequestStatus[];
    batchOrderId?: string;
    assignedToUserId?: number;
    createdByUserId?: number;
    limit?: number;
    offset?: number;
  }) {
    this.checkFeatureEnabled();

    const db = await getDb();
    if (!db) {
      throw new Error("Database connection not available");
    }

    let query = db.select().from(deliveryRequests);

    const conditions = [];

    if (filters?.status && filters.status.length > 0) {
      conditions.push(
        ...filters.status.map((s) => eq(deliveryRequests.status, s))
      );
    }

    if (filters?.batchOrderId) {
      conditions.push(eq(deliveryRequests.batchOrderId, filters.batchOrderId));
    }

    if (filters?.assignedToUserId !== undefined) {
      conditions.push(eq(deliveryRequests.assignedToUserId, filters.assignedToUserId));
    }

    if (filters?.createdByUserId !== undefined) {
      conditions.push(eq(deliveryRequests.createdByUserId, filters.createdByUserId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(deliveryRequests.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
  }
}

// Export singleton instance
export const deliveryRequestService = new DeliveryRequestService();

