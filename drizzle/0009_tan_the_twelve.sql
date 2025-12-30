CREATE TABLE `farmacy_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` varchar(64) NOT NULL,
	`tenant_id` varchar(64),
	`deployment_profile` varchar(50),
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`province` varchar(255),
	`municipality` varchar(255),
	`crop` varchar(100) NOT NULL,
	`season` varchar(50),
	`year` int,
	`soil_estimate` json,
	`soil_source` enum('gis','farmer_reported','lab') NOT NULL,
	`soil_confidence` enum('low','medium','high') NOT NULL,
	`evidence_level` int NOT NULL DEFAULT 0,
	`recommendations` json NOT NULL,
	`actions_taken` json,
	`yield_estimate` json,
	`issues` json,
	`feedback` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farmacy_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `farmacy_cases_case_id_unique` UNIQUE(`case_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_farmacy_cases_case_id` ON `farmacy_cases` (`case_id`);--> statement-breakpoint
CREATE INDEX `idx_farmacy_cases_tenant_id` ON `farmacy_cases` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `idx_farmacy_cases_crop` ON `farmacy_cases` (`crop`);--> statement-breakpoint
CREATE INDEX `idx_farmacy_cases_createdAt` ON `farmacy_cases` (`createdAt`);