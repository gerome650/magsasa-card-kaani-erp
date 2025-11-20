# Load Testing – Batch Orders

This guide explains how to generate synthetic Batch Orders to exercise the UI/API under heavy load.

## Prerequisites

- MySQL database available (local or staging).
- `.env` populated with `DATABASE_URL`.
- Farms data seeded (run `scripts/seed-farms.mjs` or any farm seeding script).

## Script

`scripts/generate-stress-test-batch-orders.ts`

### Usage

```bash
# Default: 5 orders x 25 items (createdByUserId=1)
pnpm tsx scripts/generate-stress-test-batch-orders.ts

# Custom load
pnpm tsx scripts/generate-stress-test-batch-orders.ts \
  --orders=40 \
  --items=80 \
  --createdBy=2 \
  --supplierId=SUP-9001 \
  --inputType=fertilizer
```

### Arguments

| Flag | Description | Default |
| --- | --- | --- |
| `--orders` | Number of batch orders to create | `5` |
| `--items` | Items per batch order | `25` |
| `--createdBy` | `createdByUserId` stored on each order | `1` |
| `--supplierId` | Optional supplier identifier | `null` |
| `--inputType` | Optional fixed input type (otherwise randomized) | random |

### What the script does

- Loads all farms (cycling through them when more items are needed than farms available).
- Generates realistic quantities, supplier prices, and per-unit margins.
- Computes line/header totals client-side to match the server’s margin model.
- Inserts orders + items using the same database helper as production (transactional).

## Manual Load Test Ideas

1. Seed 50 orders × 100 items.
2. Open `/batch-orders` and filter by date + status.
3. Drill into multiple detail pages to ensure item rendering stays responsive.
4. Submit several drafts for approval to confirm status transitions remain fast.

Document findings in `docs/FOURTH-PASS-LOAD-QA-BATCH-ORDERS.md`.

