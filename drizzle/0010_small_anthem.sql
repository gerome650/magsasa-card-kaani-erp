CREATE TABLE `price_list_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`price_list_id` int NOT NULL,
	`product_id` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'PHP',
	`unit` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_list_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_list_items_price_list_id_product_id_unique` UNIQUE(`price_list_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `price_lists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`price_list_code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tenant_id` varchar(64),
	`deployment_profile` varchar(50),
	`active` int NOT NULL DEFAULT 1,
	`valid_from` timestamp,
	`valid_until` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `price_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_lists_price_list_code_unique` UNIQUE(`price_list_code`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_code` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`unit` varchar(50) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_product_code_unique` UNIQUE(`product_code`)
);
--> statement-breakpoint
ALTER TABLE `price_list_items` ADD CONSTRAINT `price_list_items_price_list_id_fk` FOREIGN KEY (`price_list_id`) REFERENCES `price_lists`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_list_items` ADD CONSTRAINT `price_list_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_price_list_items_price_list_id` ON `price_list_items` (`price_list_id`);--> statement-breakpoint
CREATE INDEX `idx_price_list_items_product_id` ON `price_list_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_price_lists_price_list_code` ON `price_lists` (`price_list_code`);--> statement-breakpoint
CREATE INDEX `idx_price_lists_tenant_id` ON `price_lists` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_price_lists_deployment_profile` ON `price_lists` (`deployment_profile`);--> statement-breakpoint
CREATE INDEX `idx_price_lists_active` ON `price_lists` (`active`);--> statement-breakpoint
CREATE INDEX `idx_products_product_code` ON `products` (`product_code`);--> statement-breakpoint
CREATE INDEX `idx_products_category` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_products_active` ON `products` (`active`);