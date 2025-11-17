ALTER TABLE `boundaries` MODIFY COLUMN `area` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `costs` MODIFY COLUMN `amount` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` MODIFY COLUMN `latitude` decimal(10,6) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` MODIFY COLUMN `longitude` decimal(10,6) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` MODIFY COLUMN `size` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` MODIFY COLUMN `crops` json NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` MODIFY COLUMN `status` enum('active','inactive','fallow') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `yields` MODIFY COLUMN `quantity` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `barangay` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `municipality` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `farms` ADD `soilType` varchar(100);--> statement-breakpoint
ALTER TABLE `farms` ADD `irrigationType` enum('Irrigated','Rainfed','Upland');--> statement-breakpoint
ALTER TABLE `farms` ADD `averageYield` decimal(10,2);--> statement-breakpoint
ALTER TABLE `farms` DROP COLUMN `location`;