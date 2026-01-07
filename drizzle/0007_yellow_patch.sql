CREATE TABLE `farmer_profiles` (
	`farmer_profile_id` char(36) NOT NULL,
	`created_by_user_id` int,
	`province` varchar(255),
	`municipality` varchar(255),
	`barangay` varchar(255),
	`cropPrimary` varchar(100),
	`averageYield` decimal(10,2),
	`soilType` varchar(100),
	`irrigationType` enum('Irrigated','Rainfed','Upland'),
	`farmSize` decimal(10,2),
	`inputs` json,
	`prices` json,
	`additionalContext` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmer_profiles_farmer_profile_id` PRIMARY KEY(`farmer_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `identity_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmer_profile_id` char(36) NOT NULL,
	`partner` enum('card_mri','marketplace','other') NOT NULL,
	`partner_farmer_ref` varchar(255) NOT NULL,
	`link_method` enum('Manual','API','Import','Bulk') NOT NULL,
	`consent_obtained` int NOT NULL DEFAULT 0,
	`consent_text_version` varchar(50),
	`consent_timestamp` timestamp,
	`consent_actor_user_id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `identity_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `id_links_farmer_profile_partner_farmer_ref_uniq` UNIQUE(`farmer_profile_id`,`partner`,`partner_farmer_ref`)
);
--> statement-breakpoint
CREATE TABLE `kaani_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmer_profile_id` char(36) NOT NULL,
	`recommendationText` text NOT NULL,
	`recommendationType` varchar(100),
	`status` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kaani_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversations` ADD `farmer_profile_id` char(36);--> statement-breakpoint
ALTER TABLE `identity_links` ADD CONSTRAINT `identity_links_farmer_profile_id_fk` FOREIGN KEY (`farmer_profile_id`) REFERENCES `farmer_profiles`(`farmer_profile_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kaani_recommendations` ADD CONSTRAINT `kaani_recommendations_farmer_profile_id_fk` FOREIGN KEY (`farmer_profile_id`) REFERENCES `farmer_profiles`(`farmer_profile_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `farmer_profiles_created_by_user_id_idx` ON `farmer_profiles` (`created_by_user_id`);--> statement-breakpoint
CREATE INDEX `farmer_profiles_location_idx` ON `farmer_profiles` (`province`,`municipality`,`barangay`);--> statement-breakpoint
CREATE INDEX `farmer_profiles_crop_primary_idx` ON `farmer_profiles` (`cropPrimary`);--> statement-breakpoint
CREATE INDEX `identity_links_farmer_profile_id_idx` ON `identity_links` (`farmer_profile_id`);--> statement-breakpoint
CREATE INDEX `identity_links_partner_farmer_ref_idx` ON `identity_links` (`partner`,`partner_farmer_ref`);--> statement-breakpoint
CREATE INDEX `kaani_recommendations_farmer_profile_id_idx` ON `kaani_recommendations` (`farmer_profile_id`);--> statement-breakpoint
CREATE INDEX `conversations_farmer_profile_id_idx` ON `conversations` (`farmer_profile_id`);