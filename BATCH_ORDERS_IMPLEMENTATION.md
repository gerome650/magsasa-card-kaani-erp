# Batch Orders Implementation Summary

## Overview
This document summarizes the implementation of the **Agri Input Batch Orders v1** feature for the MAGSASA-CARD ERP system.

**Implementation Date:** November 20, 2025  
**Feature:** Batch Orders with Margin Model v1  
**Status:** ✅ Complete (Build Phase)

---

## What Was Implemented

### 1. Backend (Drizzle + tRPC)

#### Database Schema (`drizzle/schema.ts`)
- **`batch_orders` table**
  - UUID primary key
  - Reference code (unique, auto-generated format: `BATCH-YYYYMMDD-XXXX`)
  - Status enum: draft, pending_approval, approved, cancelled, completed
  - Supplier ID, input type, pricing mode, currency
  - Expected delivery date with optional delivery window
  - Financial totals: quantity, supplier total, farmer total, AgSense revenue
  - Created by user ID, approved by user ID (nullable)
  - Timestamps: createdAt, updatedAt

- **`batch_order_items` table**
  - UUID primary key
  - Foreign keys: batchOrderId, farmId, farmerId (nullable), productId (nullable)
  - Input type enum
  - Quantity ordered, unit
  - Pricing: supplierUnitPrice, farmerUnitPrice, marginPerUnit
  - Derived totals: lineSupplierTotal, lineFarmerTotal, lineAgsenseRevenue
  - Notes (optional)
  - Timestamps: createdAt, updatedAt

#### Relations (`drizzle/relations.ts`)
- Defined relations between batch_orders ↔ users (createdBy, approvedBy)
- Defined relations between batch_orders ↔ batch_order_items (one-to-many)
- Defined relations between batch_order_items ↔ farms, users

#### Database Functions (`server/db.ts`)
- `createBatchOrder()` - Creates batch order with items in transaction
- `updateBatchOrder()` - Updates batch order and replaces items
- `getBatchOrderById()` - Fetches batch order with all items
- `listBatchOrders()` - Lists batch orders with filtering (status, supplier, date range)
- `deleteBatchOrder()` - Deletes batch order and cascades to items

#### tRPC Router (`server/routers.ts`)
- **`batchOrder.create`**
  - Validates delivery date (>= today - 2 days tolerance)
  - Validates all farms exist
  - Auto-generates reference code if not provided
  - Computes all financial totals on server (ignores client values)
  - Creates batch order as "draft" status
  
- **`batchOrder.update`**
  - Only allows updates for "draft" or "pending_approval" status
  - Validates delivery date and farm existence
  - Replaces all items (delete + insert)
  - Recomputes all financial totals
  
- **`batchOrder.getById`**
  - Fetches batch order with items
  - Protected by authentication
  
- **`batchOrder.list`**
  - Supports filtering by status, supplier, date range
  - Pagination with limit/offset
  - Sorted by createdAt DESC

---

### 2. Frontend (React + TypeScript)

#### Pages Created

**`BatchOrdersList.tsx`** (`/batch-orders`)
- Displays table of all batch orders
- Filters: status, from date, to date
- Shows: reference code, status badge, input type, delivery date, totals, revenue
- "Create Batch Order" button
- Click row to navigate to detail page

**`BatchOrderCreate.tsx`** (`/batch-orders/new`)
- Form for creating new batch orders
- Fields: supplier ID, input type, expected delivery date, delivery windows
- Add farms from dropdown
- For each farm item:
  - Quantity, unit, supplier price, farmer price
  - Real-time calculated: margin/unit, line totals, revenue
- Sticky summary panel showing:
  - Number of farms
  - Total quantity
  - Total supplier cost
  - Total farmer billing
  - Estimated AgSense revenue
- "Save as Draft" button
- Client-side validation before submission

**`BatchOrderDetail.tsx`** (`/batch-orders/:id`)
- View mode: displays all batch order information and items
- Edit mode (for draft/pending_approval):
  - Inline editing of delivery date, input type
  - Add/remove farm items
  - Update quantities and prices
  - Real-time recalculation of totals
- "Submit for Approval" button (draft only)
- "Save Changes" button (edit mode)
- Read-only for approved/cancelled/completed orders
- Sticky summary panel

#### Routing (`client/src/App.tsx`)
- Added imports for new pages
- Configured routes:
  - `/batch-orders` → BatchOrdersList
  - `/batch-orders/new` → BatchOrderCreate
  - `/batch-orders/:id` → BatchOrderDetail
- All routes protected with `allowedRoles: ['manager', 'field_officer']`

---

## Key Implementation Details

### Margin Model v1 Formula
```
AgSense Revenue = (farmerUnitPrice - supplierUnitPrice) × quantityOrdered
```

### Server-Side Computation
All financial totals are **computed on the server** and client values are ignored:
- `marginPerUnit = farmerUnitPrice - supplierUnitPrice`
- `lineSupplierTotal = quantityOrdered × supplierUnitPrice`
- `lineFarmerTotal = quantityOrdered × farmerUnitPrice`
- `lineAgsenseRevenue = quantityOrdered × marginPerUnit`
- Header totals = sum of all line totals

### Validation Rules
- ✅ Items array must have at least 1 item
- ✅ All farm IDs must exist in database
- ✅ Expected delivery date >= today (with 2-day tolerance)
- ✅ Quantity ordered > 0
- ✅ Supplier and farmer prices >= 0
- ✅ Unit must be non-empty
- ✅ Only draft/pending_approval orders can be edited

### Reference Code Format
Auto-generated format: `BATCH-YYYYMMDD-XXXX`
- Example: `BATCH-20251120-4827`

### ID Strategy
- **Batch orders:** UUID (string)
- **Batch order items:** UUID (string)
- **Foreign keys:** int (farmId, farmerId, createdByUserId) - matches existing schema

---

## Files Modified/Created

### Backend
- ✅ `drizzle/schema.ts` - Added batch_orders and batch_order_items tables
- ✅ `drizzle/relations.ts` - Added relations for batch orders
- ✅ `server/db.ts` - Added CRUD functions for batch orders
- ✅ `server/routers.ts` - Added batchOrder tRPC router

### Frontend
- ✅ `client/src/pages/BatchOrdersList.tsx` - List page (NEW)
- ✅ `client/src/pages/BatchOrderCreate.tsx` - Create page (NEW)
- ✅ `client/src/pages/BatchOrderDetail.tsx` - Detail/edit page (NEW)
- ✅ `client/src/App.tsx` - Updated routing configuration

---

## What Was NOT Implemented (Out of Scope)

As per the BUILD ONLY directive:
- ❌ Unit/integration tests
- ❌ QA validation
- ❌ Performance optimizations
- ❌ Observability/logging
- ❌ Advanced error handling
- ❌ Approval workflow automation
- ❌ Integration with inventory/delivery modules
- ❌ Supplier management features
- ❌ Product catalog integration

---

## Next Steps (For QA/Cursor)

1. **Database Migration**
   - Run `pnpm drizzle-kit generate` to create migration files
   - Run `pnpm drizzle-kit migrate` to apply schema changes

2. **Testing**
   - Test batch order creation with multiple farms
   - Verify margin calculations are correct
   - Test edit functionality for draft orders
   - Test status transitions (draft → pending_approval)
   - Verify validation rules work correctly

3. **QA Checklist**
   - [ ] Can create a valid batch order via UI
   - [ ] Can see it in `/batch-orders` list with correct totals
   - [ ] Can open detail view and edit while in draft
   - [ ] AgSense revenue (margin) is computed correctly on line and header
   - [ ] Invalid inputs are blocked client-side and server-side
   - [ ] No debug logs or console.log in the new code

---

## Technical Notes

- **Database:** MySQL (using Drizzle ORM)
- **API:** tRPC with Zod validation
- **Frontend:** React + TypeScript + Wouter (routing)
- **UI Components:** Shadcn UI (Button, Card, Table, Select, Input, Badge, Label)
- **State Management:** React hooks + tRPC queries/mutations
- **Form Handling:** Controlled components with local state

---

## Repository Location
`/home/ubuntu/magsasa-card-kaani-erp`

---

**Implementation completed successfully. Ready for QA review.**
