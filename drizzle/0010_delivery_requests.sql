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
ALTER TABLE `delivery_requests` ADD CONSTRAINT `delivery_requests_batchOrderId_fk` FOREIGN KEY (`batchOrderId`) REFERENCES `batch_orders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `delivery_request_events` ADD CONSTRAINT `delivery_request_events_deliveryRequestId_fk` FOREIGN KEY (`deliveryRequestId`) REFERENCES `delivery_requests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_delivery_request_events_deliveryRequestId_createdAt` ON `delivery_request_events` (`deliveryRequestId`,`createdAt`);

