# Logistics v0

**Status**: Internal-only, feature-flagged  
**Feature Flag**: `LOGISTICS_V0_ENABLED`  
**Last Updated**: PR-16 Implementation

---

## Purpose

Logistics v0 provides an internal-only delivery request lifecycle management system. This feature allows tracking delivery requests through a defined status workflow, with full audit trail via event logging.

This is a **v0 (initial) implementation** intended for internal testing and iteration before broader rollout.

---

## Data Model

### `delivery_requests` Table

Primary table storing delivery request records.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | varchar(36) | PRIMARY KEY | UUID (crypto.randomUUID()) |
| `batchOrderId` | varchar(36) | FK → batch_orders.id, nullable | Optional link to batch order (allows drafts) |
| `status` | enum | NOT NULL, DEFAULT 'DRAFT' | Current status (see Status Enum below) |
| `createdByUserId` | int | nullable | FK → users.id |
| `assignedToUserId` | int | nullable | FK → users.id (set on ASSIGNED) |
| `notes` | text | nullable | Free-form notes |
| `metadata` | json | nullable | Flexible JSON metadata |
| `createdAt` | timestamp | NOT NULL, DEFAULT now() | Creation timestamp |
| `updatedAt` | timestamp | NOT NULL, DEFAULT now(), ON UPDATE | Last update timestamp |

**Foreign Keys**:
- `batchOrderId` → `batch_orders.id` (ON DELETE set null)

### `delivery_request_events` Table

Append-only audit log of all status transitions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | varchar(36) | PRIMARY KEY | UUID |
| `deliveryRequestId` | varchar(36) | NOT NULL, FK → delivery_requests.id | Reference to request |
| `fromStatus` | enum | NOT NULL | Source status |
| `toStatus` | enum | NOT NULL | Target status |
| `actorUserId` | int | nullable | FK → users.id (user who triggered transition) |
| `metadata` | json | nullable | Optional transition metadata (e.g., reason, assignedToUserId) |
| `createdAt` | timestamp | NOT NULL, DEFAULT now() | Event timestamp |

**Foreign Keys**:
- `deliveryRequestId` → `delivery_requests.id` (ON DELETE cascade)

**Indexes**:
- `idx_delivery_request_events_deliveryRequestId_createdAt` on (`deliveryRequestId`, `createdAt`)

### Status Enum

```typescript
type DeliveryRequestStatus = 
  | "DRAFT"      // Initial state, not yet queued
  | "QUEUED"     // Ready for assignment
  | "ASSIGNED"   // Assigned to a user
  | "IN_TRANSIT" // Out for delivery
  | "DELIVERED"  // Successfully delivered (terminal)
  | "FAILED"     // Delivery failed (terminal)
```

---

## Transition Table

Only the following transitions are allowed:

| From | To | Notes |
|------|-----|-------|
| DRAFT | QUEUED | Initial activation |
| QUEUED | ASSIGNED | Assignment (requires `assignedToUserId` in metadata) |
| QUEUED | FAILED | Failure from queue |
| ASSIGNED | IN_TRANSIT | Start delivery |
| ASSIGNED | FAILED | Failure after assignment |
| IN_TRANSIT | DELIVERED | Successful completion |
| IN_TRANSIT | FAILED | Failure during transit |
| DELIVERED | _(none)_ | Terminal state |
| FAILED | _(none)_ | Terminal state |

**All other transitions are rejected** with error: "Invalid transition from {fromStatus} to {toStatus}"

---

## API Endpoints (tRPC)

All endpoints are under `logistics.*` namespace.

### Feature Flag Enforcement

All endpoints check `LOGISTICS_V0_ENABLED`. When disabled, endpoints return:
```typescript
TRPCError {
  code: "NOT_FOUND",
  message: "Logistics v0 feature is disabled"
}
```

### Procedures

#### `logistics.createDraft` (protectedProcedure)

Create a new draft delivery request.

**Input**:
```typescript
{
  batchOrderId?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}
```

**Returns**: `{ id: string }`

**Auth**: Requires authenticated user (`protectedProcedure`)

---

#### `logistics.queue` (protectedProcedure)

Transition a DRAFT request to QUEUED.

**Input**:
```typescript
{
  id: string;
}
```

**Returns**: `{ success: true }`

**Auth**: Requires authenticated user

---

#### `logistics.assign` (adminProcedure)

Assign a QUEUED request to a user (transition to ASSIGNED).

**Input**:
```typescript
{
  id: string;
  assignedToUserId: number;
}
```

**Returns**: `{ success: true }`

**Auth**: Requires admin role

---

#### `logistics.markInTransit` (adminProcedure)

Mark an ASSIGNED request as IN_TRANSIT.

**Input**:
```typescript
{
  id: string;
}
```

**Returns**: `{ success: true }`

**Auth**: Requires admin role

---

#### `logistics.markDelivered` (adminProcedure)

Mark an IN_TRANSIT request as DELIVERED.

**Input**:
```typescript
{
  id: string;
}
```

**Returns**: `{ success: true }`

**Auth**: Requires admin role

---

#### `logistics.fail` (adminProcedure)

Mark a request as FAILED (from QUEUED, ASSIGNED, or IN_TRANSIT).

**Input**:
```typescript
{
  id: string;
  reason?: string | null;
}
```

**Returns**: `{ success: true }`

**Auth**: Requires admin role

**Metadata**: `reason` is stored in event metadata

---

#### `logistics.getById` (protectedProcedure)

Fetch a single delivery request by ID.

**Input**:
```typescript
{
  id: string;
}
```

**Returns**: `DeliveryRequest` object

**Errors**: Returns `NOT_FOUND` if request doesn't exist

**Auth**: Requires authenticated user

---

#### `logistics.list` (protectedProcedure)

List delivery requests with optional filters.

**Input**:
```typescript
{
  status?: DeliveryRequestStatus[];
  batchOrderId?: string;
  assignedToUserId?: number;
  createdByUserId?: number;
  limit?: number;
  offset?: number;
}
```

**Returns**: `DeliveryRequest[]`

**Auth**: Requires authenticated user

---

## Service Layer

The service layer (`server/logistics/service.ts`) provides:

- **DeliveryRequestService**: Singleton service class
- **Transition guards**: Enforces valid transitions only
- **Event logging**: Automatically creates event records on transitions
- **Transaction safety**: All transitions run in database transactions
- **Feature flag checks**: All operations check `ENV.logisticsV0Enabled`

### Key Methods

- `createDraft(payload)` - Create new draft
- `transition(id, toStatus, actorUserId, metadata?)` - Generic transition
- `queue(id, actorUserId)` - Convenience wrapper
- `assign(id, assignedToUserId, actorUserId)` - Convenience wrapper with assignment
- `markInTransit(id, actorUserId)` - Convenience wrapper
- `markDelivered(id, actorUserId)` - Convenience wrapper
- `fail(id, reason, actorUserId)` - Convenience wrapper
- `getById(id)` - Fetch single request
- `list(filters?)` - List with filters

---

## Non-Goals (v0)

This v0 implementation does **NOT** include:

- External API integrations (tracking numbers, carrier APIs)
- Notifications (email, SMS, push)
- Real-time status updates
- Batch operations
- Export/reporting features
- Frontend UI components
- Delivery time estimates
- Route optimization
- Driver mobile app integration

---

## Upgrade Path

When ready to move beyond v0:

1. **Remove feature flag** - Set `LOGISTICS_V0_ENABLED=true` by default, then remove flag checks
2. **Add external integrations** - Carrier APIs, tracking services
3. **Enhance metadata** - Add structured fields (tracking numbers, delivery windows, etc.)
4. **Add notifications** - Email/SMS on status changes
5. **Frontend integration** - Build UI components
6. **Reporting** - Analytics, delivery performance metrics
7. **Batch operations** - Bulk status updates, bulk assignment

Migration strategy: v0 data model is designed to be forward-compatible. Additional fields can be added to `metadata` JSON column without schema changes, or new columns can be added via migration.

---

## Testing

Run tests with:

```bash
pnpm test -- server/logistics
```

Test coverage:
- Service: Feature flag, transitions (allowed/disallowed), CRUD
- Router: Feature flag, happy paths, auth requirements

---

## Environment Setup

Set the feature flag in your environment:

```bash
LOGISTICS_V0_ENABLED=true
```

Default: `false` (disabled)

---

## Database Migration

Migration file: `drizzle/0010_delivery_requests.sql`

Apply migration:
```bash
pnpm db:push
```

Or run the SQL file directly against your database.

---

## Implementation Notes

- All transitions are **transactional** - both request update and event creation occur atomically
- Event records are **append-only** - never updated or deleted
- Feature flag is checked at **both router and service layer** for defense-in-depth
- No database writes occur when feature flag is OFF
- Status enum values are **uppercase** (matches database enum definition)

