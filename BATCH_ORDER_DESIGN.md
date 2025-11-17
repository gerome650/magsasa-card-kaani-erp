# Order Batching & Distribution Management System - Design Document

## Executive Summary

The Order Batching & Distribution Management System addresses a critical challenge in agricultural ERP: **aggregating small farmer orders to meet supplier MOQs while optimizing logistics and cost sharing**. This system transforms individual farmer purchases into efficient bulk orders, maximizing CARD MRI's negotiating power and reducing per-unit costs for farmers.

---

## Problem Statement

### Current Challenges

1. **Supplier MOQ Barriers**: Agricultural input suppliers require minimum order quantities (e.g., 100 bags of fertilizer, 50kg of seeds) that individual farmers cannot meet
2. **High Individual Costs**: Small orders incur higher per-unit prices and delivery fees
3. **Logistics Inefficiency**: Multiple small deliveries to the same barangay waste time and money
4. **Coordination Overhead**: Manual coordination of group orders via phone/text is error-prone
5. **Payment Collection**: Tracking individual farmer payments in group orders is complex
6. **Delivery Confusion**: Farmers unsure when orders will arrive or where to collect them

### Business Impact

- **Lost Purchasing Power**: Farmers pay 15-30% more for individual orders
- **Supplier Friction**: Suppliers reluctant to service small orders
- **Delivery Delays**: Inefficient routing extends delivery times by 2-3 days
- **Administrative Burden**: Field Officers spend 40% of time coordinating orders

---

## Solution Architecture

### Core Concepts

#### 1. Batch Order Lifecycle

```
Individual Orders → Batch Collection → MOQ Met → Supplier Order → Delivery → Distribution
```

**Phases:**
1. **Collection Phase** (3-7 days): Farmers place orders, system aggregates by product/supplier
2. **Ready Phase** (1 day): MOQ met, batch closed, payment collection begins
3. **Ordered Phase** (1-2 days): Batch submitted to supplier, confirmation received
4. **In-Transit Phase** (2-5 days): Supplier ships, tracking updates provided
5. **Delivered Phase** (1 day): Arrives at barangay collection point
6. **Distributed Phase**: Individual farmers collect their orders

#### 2. MOQ Aggregation Logic

**Product-Level Aggregation:**
- Each product has supplier-defined MOQ (e.g., Urea Fertilizer: 100 bags)
- System tracks cumulative quantity across all farmer orders
- Progress indicator shows: "67/100 bags (67% to MOQ)"
- Auto-close batch when MOQ reached OR manual close by Manager

**Multi-Product Batches:**
- Single supplier can have multiple concurrent batches (one per product)
- Example: Atlas Fertilizer batch for Urea (100 bags) + separate batch for NPK (50 bags)

#### 3. Cost Sharing Model

**Pricing Tiers:**
```
Individual Order:  ₱1,200/bag (retail price)
Batch 50-99 units: ₱1,100/bag (8% discount)
Batch 100-199:     ₱1,000/bag (17% discount) ← MOQ tier
Batch 200+:        ₱950/bag (21% discount)
```

**Delivery Cost Sharing:**
- **Option A - Proportional**: Split by quantity ordered (farmer ordering 10 bags pays 2x farmer ordering 5)
- **Option B - Equal**: Split evenly among all farmers in batch
- **Option C - Subsidized**: CARD MRI covers delivery for batches over 100 units

**Formula:**
```
Farmer Total = (Quantity × Unit Price) + (Delivery Cost ÷ Farmers) + Processing Fee
```

#### 4. Logistics Optimization

**Barangay-Based Routing:**
- Group deliveries by barangay to minimize trips
- Establish collection points (e.g., Barangay Hall, CARD MRI office)
- Schedule deliveries on specific days (e.g., San Pedro: Tuesdays/Fridays)

**Route Planning:**
```
Supplier Warehouse → Municipality Hub → Barangay Collection Points → Farmer Pickup
```

**Delivery Windows:**
- Morning Slot: 8:00 AM - 12:00 PM
- Afternoon Slot: 1:00 PM - 5:00 PM

---

## System Components

### 1. Batch Order Dashboard (Manager/Field Officer)

**Key Metrics:**
- Active Batches: 12
- Total Value: ₱2.4M
- Farmers Participating: 87
- Avg Savings per Farmer: ₱3,200

**Batch List View:**
```
┌─────────────────────────────────────────────────────────────┐
│ Batch #BO-2024-001 | Atlas Fertilizer - Urea 46-0-0         │
│ Status: Collecting | 67/100 bags (67%) | 23 farmers         │
│ Closes: Nov 20, 2024 | Est. Delivery: Nov 28, 2024          │
│ Savings: ₱200/bag × 67 = ₱13,400 total                      │
│ [View Details] [Add Farmers] [Close Early] [Cancel]         │
└─────────────────────────────────────────────────────────────┘
```

**Batch Detail View:**
- Participating Farmers List (name, quantity, total cost, payment status)
- MOQ Progress Bar with visual indicator
- Cost Breakdown (product cost, delivery, processing fee)
- Timeline (created, MOQ met, ordered, shipped, delivered)
- Delivery Route Map (barangay pins)
- Supplier Communication Log

### 2. Farmer Order Interface

**Join Existing Batch:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Join Batch Order & Save ₱200/bag!                        │
│                                                              │
│ Atlas Fertilizer - Urea 46-0-0                              │
│ Regular Price: ₱1,200/bag                                   │
│ Batch Price: ₱1,000/bag (17% savings!)                     │
│                                                              │
│ Progress: 67/100 bags ████████████░░░░░░ 67%                │
│ 23 farmers already joined                                   │
│                                                              │
│ Quantity: [  5  ] bags                                      │
│ Your Cost: ₱5,000 (save ₱1,000 vs individual order)        │
│                                                              │
│ Estimated Delivery: Nov 28, 2024 to San Pedro               │
│ Collection Point: Barangay Hall                             │
│                                                              │
│ [Join Batch Order]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Order Confirmation:**
- Order summary with batch details
- Payment instructions (loan deduction, cash on delivery, bank transfer)
- Delivery schedule and collection point
- SMS/email confirmation sent

### 3. Delivery Management Interface

**Delivery Schedule Calendar:**
```
Week of Nov 25-29, 2024

Monday 25:
  - Batch #BO-001: Calamba (3 barangays, 15 farmers)
  - Batch #BO-003: Bay (2 barangays, 8 farmers)

Tuesday 26:
  - Batch #BO-002: San Pedro (4 barangays, 23 farmers)
  
Wednesday 27:
  - Batch #BO-004: Los Baños (5 barangays, 31 farmers)
```

**Route Optimization:**
- Map view with delivery stops
- Estimated travel time between points
- Driver assignment
- Real-time GPS tracking (future enhancement)

**Delivery Confirmation:**
- Photo upload of delivered goods
- Farmer signature/acknowledgment
- Quantity verification
- Issue reporting (damaged goods, shortages)

### 4. Supplier Coordination Portal

**Batch Order Submission:**
```
To: Atlas Fertilizer Corp.
From: CARD MRI - MAGSASA Platform

Purchase Order #PO-2024-001
Date: November 20, 2024

Product: Urea Fertilizer 46-0-0
Quantity: 100 bags (50kg each)
Unit Price: ₱1,000/bag
Total: ₱100,000

Delivery Address: CARD MRI Warehouse, San Pedro, Laguna
Requested Delivery Date: November 28, 2024
Contact: Pedro Garcia (Field Officer) - 0917-123-4567

[Confirm Order] [Request Changes] [Decline]
```

**Supplier Dashboard:**
- Pending orders from CARD MRI
- Order history and fulfillment rate
- Inventory status updates
- Delivery schedule coordination
- Payment status tracking

---

## Data Models

### BatchOrder

```typescript
interface BatchOrder {
  id: string;                    // BO-2024-001
  productId: string;             // P001 (Urea Fertilizer)
  supplierId: string;            // SUP-001 (Atlas)
  status: BatchStatus;           // collecting | ready | ordered | in-transit | delivered | distributed
  moq: number;                   // 100 (bags)
  currentQuantity: number;       // 67 (bags)
  unitPrice: number;             // ₱1,000
  deliveryCost: number;          // ₱5,000
  createdAt: Date;
  closesAt: Date;                // Auto-close date
  orderedAt?: Date;
  deliveryDate?: Date;
  deliveryLocation: string;      // "San Pedro Barangay Hall"
  farmerOrders: FarmerOrder[];
  notes: string;
}

enum BatchStatus {
  COLLECTING = 'collecting',     // Accepting farmer orders
  READY = 'ready',               // MOQ met, ready to order
  ORDERED = 'ordered',           // Submitted to supplier
  IN_TRANSIT = 'in-transit',     // Shipped by supplier
  DELIVERED = 'delivered',       // Arrived at collection point
  DISTRIBUTED = 'distributed',   // All farmers collected
  CANCELLED = 'cancelled'        // Batch cancelled
}
```

### FarmerOrder

```typescript
interface FarmerOrder {
  id: string;
  batchOrderId: string;
  farmerId: string;
  quantity: number;              // 5 bags
  unitPrice: number;             // ₱1,000
  deliveryShare: number;         // ₱208 (₱5,000 ÷ 24 farmers)
  totalCost: number;             // ₱5,208
  paymentStatus: PaymentStatus;  // pending | paid | loan-approved
  paymentMethod: string;         // loan | cash | bank-transfer
  collectedAt?: Date;            // When farmer picked up order
  notes: string;
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  LOAN_APPROVED = 'loan-approved',
  OVERDUE = 'overdue'
}
```

### DeliveryRoute

```typescript
interface DeliveryRoute {
  id: string;
  batchOrderIds: string[];       // Multiple batches in one route
  driverId?: string;
  vehicleId?: string;
  scheduledDate: Date;
  stops: DeliveryStop[];
  status: 'planned' | 'in-progress' | 'completed';
  totalDistance: number;         // km
  estimatedDuration: number;     // minutes
}

interface DeliveryStop {
  barangay: string;
  municipality: string;
  coordinates: { lat: number; lng: number };
  farmerCount: number;
  totalQuantity: number;
  arrivalTime?: Date;
  completedAt?: Date;
  notes: string;
}
```

---

## User Workflows

### Workflow 1: Farmer Joins Batch Order

1. Farmer browses Marketplace
2. Sees "Join Batch & Save ₱200!" badge on Urea Fertilizer
3. Clicks product → sees batch details (67/100 bags, 23 farmers)
4. Enters quantity (5 bags) → sees cost breakdown (₱5,000 + ₱208 delivery = ₱5,208)
5. Clicks "Join Batch Order" → order added to batch
6. Receives SMS: "You joined Batch #BO-001! Delivery Nov 28 to San Pedro Barangay Hall"
7. Batch reaches 100 bags → SMS: "Batch complete! Order submitted to supplier"
8. Delivery day → SMS: "Your order arrived! Collect at Barangay Hall 8AM-5PM"

### Workflow 2: Field Officer Creates Batch

1. Field Officer logs in → navigates to "Batch Orders"
2. Clicks "Create New Batch"
3. Selects product (Urea Fertilizer), supplier (Atlas), MOQ (100 bags)
4. Sets closing date (Nov 20), delivery location (San Pedro)
5. Batch created with status "Collecting"
6. Field Officer manually adds farmers or farmers self-join via marketplace
7. When 100 bags reached → Field Officer clicks "Submit to Supplier"
8. Supplier confirms → status changes to "Ordered"
9. Supplier ships → Field Officer updates status to "In-Transit"
10. Delivery arrives → Field Officer marks "Delivered", notifies farmers

### Workflow 3: Manager Reviews Batch Performance

1. Manager opens Batch Orders Dashboard
2. Views analytics: 12 active batches, ₱2.4M total value, 87 farmers
3. Filters by status "Delivered" → sees 8 completed batches this month
4. Clicks Batch #BO-001 → views details:
   - 100 bags delivered to 24 farmers
   - Total savings: ₱20,000 (₱200/bag × 100)
   - Avg savings per farmer: ₱833
   - Delivery efficiency: 95% (23/24 farmers collected on time)
5. Exports batch report to PDF for CARD MRI management
6. Identifies top-performing suppliers and products for future negotiations

---

## Technical Implementation Plan

### Phase 1: Core Batch Management (Week 1)

**Components:**
- `BatchOrderDashboard.tsx` - Manager/Field Officer view
- `BatchOrderCard.tsx` - Individual batch display
- `CreateBatchDialog.tsx` - Batch creation form
- `BatchDetailView.tsx` - Detailed batch information

**Data:**
- `batchOrdersData.ts` - Mock batch orders (5 samples)
- `batchOrderService.ts` - CRUD operations

**Features:**
- Create batch with product, MOQ, closing date
- Display batch list with status badges
- Show MOQ progress bars
- Add farmers to batch manually

### Phase 2: Farmer Integration (Week 1)

**Components:**
- `BatchOrderBadge.tsx` - "Join Batch & Save!" indicator on products
- `JoinBatchDialog.tsx` - Farmer order form
- `FarmerBatchOrders.tsx` - Farmer's batch order history

**Features:**
- Display active batches on marketplace products
- Calculate savings vs individual order
- Join batch with quantity selection
- Show farmer's orders in batch

### Phase 3: Logistics & Delivery (Week 2)

**Components:**
- `DeliverySchedule.tsx` - Calendar view of deliveries
- `DeliveryRouteMap.tsx` - Map with delivery stops
- `DeliveryConfirmation.tsx` - Photo upload, signature

**Features:**
- Schedule deliveries by barangay
- Optimize routes (manual grouping)
- Track delivery status
- Confirm farmer pickup

### Phase 4: Analytics & Reporting (Week 2)

**Components:**
- `BatchAnalytics.tsx` - Performance metrics
- `BatchReport.tsx` - PDF export

**Features:**
- Cost savings dashboard
- Delivery efficiency metrics
- Supplier performance tracking
- Export reports

---

## Key Metrics & KPIs

### Operational Metrics
- **Batch Completion Rate**: % of batches that reach MOQ
- **Avg Time to MOQ**: Days from batch creation to MOQ met
- **Farmer Participation Rate**: % of active farmers joining batches
- **Delivery On-Time Rate**: % of deliveries completed on scheduled date

### Financial Metrics
- **Total Cost Savings**: ₱ saved vs individual orders
- **Avg Savings per Farmer**: ₱ saved per farmer per batch
- **Batch Order Volume**: Total ₱ value of batch orders per month
- **Payment Collection Rate**: % of farmers who paid on time

### Efficiency Metrics
- **Orders per Batch**: Avg number of farmer orders per batch
- **Delivery Stops per Route**: Avg barangays per delivery route
- **Pickup Completion Rate**: % of farmers who collected orders
- **Supplier Fulfillment Rate**: % of batches delivered on time

---

## Success Criteria

### MVP (Minimum Viable Product)
✅ Field Officers can create batches with MOQ targets
✅ Farmers can join batches and see savings
✅ System tracks MOQ progress in real-time
✅ Batch auto-closes when MOQ is met
✅ Delivery schedule displays batch deliveries
✅ Farmers receive notifications (batch status, delivery)

### Full Production
✅ Automated batch creation based on demand patterns
✅ Real-time supplier inventory integration
✅ GPS tracking for in-transit deliveries
✅ Mobile app for farmer order management
✅ Payment gateway integration
✅ Route optimization algorithm (shortest path)

---

## Risk Mitigation

### Risk 1: Batch Doesn't Reach MOQ
**Mitigation:**
- Set realistic closing dates (7-14 days)
- Send reminders to farmers when batch is 70% full
- Allow Field Officers to manually add farmers
- Option to merge similar batches from different barangays

### Risk 2: Supplier Delays Delivery
**Mitigation:**
- Build buffer time into delivery estimates (add 2-3 days)
- Maintain relationships with backup suppliers
- Track supplier performance and penalize delays
- Communicate delays immediately to farmers

### Risk 3: Farmers Don't Collect Orders
**Mitigation:**
- Require upfront payment or loan approval before batch closes
- Send multiple pickup reminders (SMS, call)
- Extend pickup window to 3 days
- Charge storage fee for uncollected orders after 7 days

### Risk 4: Payment Collection Issues
**Mitigation:**
- Integrate with CARD MRI loan system (auto-deduct)
- Require 50% deposit for cash payments
- Block farmers with overdue payments from joining new batches
- Offer flexible payment plans for large orders

---

## Future Enhancements

### Advanced Features
1. **Predictive Batching**: ML model predicts optimal batch timing based on planting seasons
2. **Dynamic Pricing**: Real-time price adjustments based on supplier inventory
3. **Farmer Cooperatives**: Allow farmer groups to create private batches
4. **Cross-Supplier Batching**: Combine orders from multiple suppliers in one delivery
5. **Subscription Model**: Recurring batch orders for regular inputs (monthly fertilizer)
6. **Quality Assurance**: Photo verification of delivered goods before farmer acceptance
7. **Insurance Integration**: Protect batch orders against supplier defaults or damaged goods

### Integration Opportunities
- **Logistics Partners**: Integrate with LBC, J&T for third-party delivery
- **Payment Gateways**: GCash, PayMaya for instant payment
- **Supplier APIs**: Direct integration with supplier inventory systems
- **Government Programs**: Link to DA subsidies and vouchers

---

## Conclusion

The Order Batching & Distribution Management System transforms MAGSASA-CARD from a simple marketplace into a **comprehensive agricultural supply chain platform**. By aggregating farmer demand, the system unlocks bulk purchasing power, reduces costs, and streamlines logistics—delivering tangible value to farmers, CARD MRI, and suppliers.

**Expected Impact:**
- **15-25% cost savings** for farmers on agricultural inputs
- **40% reduction** in Field Officer coordination time
- **3x increase** in order volume through improved accessibility
- **95% farmer satisfaction** with delivery reliability

This system positions MAGSASA-CARD as a **true ERP solution** that addresses real operational challenges in agricultural cooperatives.
