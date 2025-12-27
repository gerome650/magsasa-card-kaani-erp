CREATE TABLE `kaani_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`source` enum('public','erp') NOT NULL DEFAULT 'public',
	`audience` enum('loan_officer','farmer') NOT NULL,
	`dialect` varchar(20),
	`conversation_id` int,
	`farmer_profile_id` char(36),
	`session_token` char(64) NOT NULL,
	`landing_path` varchar(255),
	`utm_source` varchar(100),
	`utm_medium` varchar(100),
	`utm_campaign` varchar(100),
	`consent_obtained` int NOT NULL DEFAULT 0,
	`consent_text_version` varchar(50),
	`consent_timestamp` timestamp,
	`captured_name` varchar(255),
	`captured_email` varchar(255),
	`captured_phone` varchar(50),
	CONSTRAINT `kaani_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `kaani_leads_session_token_unique` UNIQUE(`session_token`)
);
--> statement-breakpoint
CREATE INDEX `idx_leads_session_token` ON `kaani_leads` (`session_token`);--> statement-breakpoint
CREATE INDEX `idx_leads_conversation_id` ON `kaani_leads` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `idx_leads_farmer_profile_id` ON `kaani_leads` (`farmer_profile_id`);--> statement-breakpoint
CREATE INDEX `idx_leads_createdAt` ON `kaani_leads` (`createdAt`);