CREATE TABLE `batch_order_items` (
	`id` varchar(36) NOT NULL,
	`batchOrderId` varchar(36) NOT NULL,
	`farmId` int NOT NULL,
	`farmerId` int,
	`productId` varchar(36),
	`inputType` enum('fertilizer','seed','feed','pesticide','other'),
	`quantityOrdered` decimal(15,2) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`supplierUnitPrice` decimal(15,2) NOT NULL,
	`farmerUnitPrice` decimal(15,2) NOT NULL,
	`marginPerUnit` decimal(15,2) NOT NULL,
	`lineSupplierTotal` decimal(15,2) NOT NULL,
	`lineFarmerTotal` decimal(15,2) NOT NULL,
	`lineAgsenseRevenue` decimal(15,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batch_orders` (
	`id` varchar(36) NOT NULL,
	`referenceCode` varchar(50) NOT NULL,
	`status` enum('draft','pending_approval','approved','cancelled','completed') NOT NULL DEFAULT 'draft',
	`supplierId` varchar(36),
	`inputType` enum('fertilizer','seed','feed','pesticide','other'),
	`pricingMode` enum('margin') NOT NULL DEFAULT 'margin',
	`currency` varchar(10) NOT NULL DEFAULT 'PHP',
	`expectedDeliveryDate` varchar(50) NOT NULL,
	`deliveryWindowStart` timestamp,
	`deliveryWindowEnd` timestamp,
	`totalQuantity` decimal(15,2) NOT NULL DEFAULT '0',
	`totalSupplierTotal` decimal(15,2) NOT NULL DEFAULT '0',
	`totalFarmerTotal` decimal(15,2) NOT NULL DEFAULT '0',
	`totalAgsenseRevenue` decimal(15,2) NOT NULL DEFAULT '0',
	`createdByUserId` int NOT NULL,
	`approvedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `batch_orders_referenceCode_unique` UNIQUE(`referenceCode`)
);
--> statement-breakpoint
CREATE TABLE `delivery_request_events` (
	`id` varchar(36) NOT NULL,
	`deliveryRequestId` varchar(36) NOT NULL,
	`fromStatus` enum('DRAFT','QUEUED','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED') NOT NULL,
	`toStatus` enum('DRAFT','QUEUED','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED') NOT NULL,
	`actorUserId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_request_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_requests` (
	`id` varchar(36) NOT NULL,
	`batchOrderId` varchar(36),
	`status` enum('DRAFT','QUEUED','ASSIGNED','IN_TRANSIT','DELIVERED','FAILED') NOT NULL DEFAULT 'DRAFT',
	`createdByUserId` int,
	`assignedToUserId` int,
	`notes` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `delivery_request_events` ADD CONSTRAINT `delivery_request_events_deliveryRequestId_fk` FOREIGN KEY (`deliveryRequestId`) REFERENCES `delivery_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `delivery_requests` ADD CONSTRAINT `delivery_requests_batchOrderId_fk` FOREIGN KEY (`batchOrderId`) REFERENCES `batch_orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_delivery_request_events_deliveryRequestId_createdAt` ON `delivery_request_events` (`deliveryRequestId`,`createdAt`);