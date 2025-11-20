# Local QA Checklist - Batch Orders

Quick checklist to verify Batch Orders works correctly in your local environment.

## Prerequisites

1. **Database Setup**
   ```bash
   # Ensure DATABASE_URL is set in .env
   # Run migrations to create batch_orders tables
   pnpm db:push
   ```

2. **Run Tests**
   ```bash
   # Run Batch Orders tests only
   pnpm test:batch-orders
   
   # Or run all tests
   pnpm test
   ```

## Manual Browser Verification

### 1. Create Batch Order (`/batch-orders/new`)

- [ ] Navigate to `/batch-orders/new`
- [ ] Fill in:
  - Expected Delivery Date (must be today or within past 2 days)
  - Input Type (e.g., "fertilizer")
  - Add 2-3 farms from dropdown
- [ ] For each farm item:
  - [ ] Set quantity > 0 (e.g., 50)
  - [ ] Set unit (e.g., "kg")
  - [ ] Set supplier price (e.g., 100)
  - [ ] Set farmer price (e.g., 120)
- [ ] Verify real-time calculations:
  - [ ] Margin/Unit = farmer price - supplier price (e.g., 20)
  - [ ] Line totals calculate correctly
  - [ ] Summary panel shows correct totals
- [ ] Click "Save as Draft"
- [ ] Verify: Order created, redirected to detail page

### 2. View Batch Orders List (`/batch-orders`)

- [ ] Navigate to `/batch-orders`
- [ ] Verify: Your new order appears in the table
- [ ] Check columns:
  - [ ] Reference Code (e.g., "BATCH-20241120-1234")
  - [ ] Status badge shows "Draft" (gray)
  - [ ] Total Quantity matches sum of items
  - [ ] Total Farmer Total matches sum of line totals
  - [ ] AgSense Revenue matches sum of line revenues
- [ ] Test filters:
  - [ ] Filter by status (e.g., "Draft") - order appears
  - [ ] Filter by date range - order appears if within range
- [ ] Click a table row
- [ ] Verify: Navigates to `/batch-orders/:id` detail page

### 3. Batch Order Detail (`/batch-orders/:id`)

- [ ] Verify header shows:
  - [ ] Reference Code
  - [ ] Status badge (should be "Draft")
  - [ ] "Edit" button visible
  - [ ] "Submit for Approval" button visible
- [ ] Verify order information:
  - [ ] Input Type
  - [ ] Expected Delivery Date
  - [ ] Currency: PHP
  - [ ] Pricing Mode: Margin
- [ ] Verify items table:
  - [ ] All farms listed with correct quantities
  - [ ] Prices and totals match what you entered
  - [ ] Margin calculations correct
- [ ] Verify summary panel:
  - [ ] Total Quantity = sum of item quantities
  - [ ] Total Supplier Cost = sum of line supplier totals
  - [ ] Total Billed to Farmers = sum of line farmer totals
  - [ ] Total AgSense Revenue = sum of line revenues

### 4. Edit Draft Order

- [ ] Click "Edit" button
- [ ] Modify:
  - [ ] Change expected delivery date
  - [ ] Change input type
  - [ ] Modify quantity of an item
  - [ ] Modify prices of an item
- [ ] Verify: Real-time totals recalculate
- [ ] Click "Save Changes"
- [ ] Verify: Changes saved, status remains "draft"

### 5. Submit for Approval

- [ ] On a draft order detail page
- [ ] Click "Submit for Approval"
- [ ] Verify: Status changes to "Pending Approval" (yellow badge)
- [ ] Verify: "Edit" button still visible (pending_approval is editable)
- [ ] Verify: "Submit for Approval" button hidden
- [ ] Navigate back to `/batch-orders`
- [ ] Verify: Order shows "Pending Approval" status in list

### 6. Read-Only Statuses (if you have approved/cancelled/completed orders)

- [ ] Navigate to an order with status "approved", "cancelled", or "completed"
- [ ] Verify: "Edit" button NOT visible
- [ ] Verify: "Submit for Approval" button NOT visible
- [ ] Verify: All fields are read-only (no edit mode available)

## Validation Tests

### Frontend Validation

- [ ] Try to create order with:
  - [ ] Empty items array → Error: "At least one item is required"
  - [ ] Quantity = 0 → Error: "Quantity must be greater than 0"
  - [ ] Negative prices → Error: "Prices cannot be negative"
  - [ ] Empty unit → Error: "Unit is required for all items"
  - [ ] Missing delivery date → Error: "Expected delivery date is required"

### Backend Validation (via direct tRPC call or devtools)

- [ ] Try to create order with:
  - [ ] Delivery date > 2 days in past → Error: "Expected delivery date must be today or within the past 2 days"
  - [ ] Invalid farmId → Error: "Farm with ID X does not exist"
  - [ ] Empty items array → Zod validation error

## Edge Cases

- [ ] Create order with 1 farm → Works
- [ ] Create order with 10+ farms → Works, totals calculate correctly
- [ ] Edit order and remove all items → Error: "At least one item is required"
- [ ] Try to update approved order → Error: "This batch order cannot be edited..."

## Quick Smoke Test (2 minutes)

1. Create one batch order with 2 farms
2. Verify totals in summary panel
3. Submit for approval
4. Verify status changed
5. View in list - verify it appears correctly

## If Something Fails

1. Check browser console for errors
2. Check server logs for structured log entries (should see batch order events)
3. Verify database connection
4. Run `pnpm test:batch-orders` to check if tests pass
5. Check that migrations are applied: `pnpm db:push`

---

**Expected Time:** 10-15 minutes for full checklist, 2 minutes for smoke test.

