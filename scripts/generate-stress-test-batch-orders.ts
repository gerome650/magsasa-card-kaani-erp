#!/usr/bin/env tsx
import "dotenv/config";
import { randomUUID } from "crypto";
import { closeDb, createBatchOrder, getFarmsByUserId } from "../server/db";
import type { InsertBatchOrder, InsertBatchOrderItem } from "../drizzle/schema";

type CliArgs = {
  orderCount: number;
  itemsPerOrder: number;
  createdByUserId: number;
  supplierId?: string;
  inputType?: "fertilizer" | "seed" | "feed" | "pesticide" | "other";
};

const DEFAULTS: CliArgs = {
  orderCount: 5,
  itemsPerOrder: 25,
  createdByUserId: 1,
};

const INPUT_TYPES: CliArgs["inputType"][] = ["fertilizer", "seed", "feed", "pesticide", "other"];

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = { ...DEFAULTS };

  args.forEach((arg) => {
    const [key, value] = arg.split("=");
    if (!key || !value) return;

    switch (key) {
      case "--orders":
        parsed.orderCount = Number(value);
        break;
      case "--items":
        parsed.itemsPerOrder = Number(value);
        break;
      case "--createdBy":
        parsed.createdByUserId = Number(value);
        break;
      case "--supplierId":
        parsed.supplierId = value;
        break;
      case "--inputType":
        if (INPUT_TYPES.includes(value as CliArgs["inputType"])) {
          parsed.inputType = value as CliArgs["inputType"];
        }
        break;
      default:
        break;
    }
  });

  return parsed;
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  const options = parseArgs();
  console.info(
    `⚙️  Generating ${options.orderCount} batch orders with ${options.itemsPerOrder} items each (createdByUserId=${options.createdByUserId})`
  );

  const farms = await getFarmsByUserId(options.createdByUserId);
  if (!farms || farms.length === 0) {
    throw new Error("No farms found. Seed farms before running this script.");
  }

  let created = 0;
  for (let i = 0; i < options.orderCount; i++) {
    const orderId = randomUUID();
    let totalQuantity = 0;
    let totalSupplierTotal = 0;
    let totalFarmerTotal = 0;
    let totalAgsenseRevenue = 0;

    const items: InsertBatchOrderItem[] = [];
    for (let j = 0; j < options.itemsPerOrder; j++) {
      const farm = farms[(i * options.itemsPerOrder + j) % farms.length];
      const quantityOrdered = Math.max(5, Math.floor(Math.random() * 200));
      const supplierUnitPrice = Math.max(10, Math.round(Math.random() * 3000) / 10);
      const marginPerUnit = Math.round(Math.random() * 20 * 100) / 100;
      const farmerUnitPrice = supplierUnitPrice + marginPerUnit;

      const lineSupplierTotal = quantityOrdered * supplierUnitPrice;
      const lineFarmerTotal = quantityOrdered * farmerUnitPrice;
      const lineAgsenseRevenue = quantityOrdered * marginPerUnit;

      totalQuantity += quantityOrdered;
      totalSupplierTotal += lineSupplierTotal;
      totalFarmerTotal += lineFarmerTotal;
      totalAgsenseRevenue += lineAgsenseRevenue;

      items.push({
        id: randomUUID(),
        batchOrderId: orderId,
        farmId: farm.id,
        farmerId: farm.userId ?? null,
        productId: null,
        inputType: options.inputType ?? pickRandom(INPUT_TYPES),
        quantityOrdered: quantityOrdered.toFixed(2),
        unit: "kg",
        supplierUnitPrice: supplierUnitPrice.toFixed(2),
        farmerUnitPrice: farmerUnitPrice.toFixed(2),
        marginPerUnit: marginPerUnit.toFixed(2),
        lineSupplierTotal: lineSupplierTotal.toFixed(2),
        lineFarmerTotal: lineFarmerTotal.toFixed(2),
        lineAgsenseRevenue: lineAgsenseRevenue.toFixed(2),
        notes: null,
      });
    }

    const batchOrder: InsertBatchOrder = {
      id: orderId,
      referenceCode: `BATCH-STRESS-${Date.now()}-${i.toString().padStart(4, "0")}`,
      status: "draft",
      supplierId: options.supplierId ?? null,
      inputType: options.inputType ?? pickRandom(INPUT_TYPES),
      pricingMode: "margin",
      currency: "PHP",
      expectedDeliveryDate: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
      deliveryWindowStart: null,
      deliveryWindowEnd: null,
      totalQuantity: totalQuantity.toFixed(2),
      totalSupplierTotal: totalSupplierTotal.toFixed(2),
      totalFarmerTotal: totalFarmerTotal.toFixed(2),
      totalAgsenseRevenue: totalAgsenseRevenue.toFixed(2),
      createdByUserId: options.createdByUserId,
      approvedByUserId: null,
    };

    await createBatchOrder(batchOrder, items);
    created += 1;
  }

  await closeDb();
  console.info(`✅ Created ${created} synthetic batch orders for stress testing.`);
}

main().catch(async (error) => {
  console.error("❌ Failed to generate stress-test batch orders:", error);
  await closeDb();
  process.exit(1);
});

