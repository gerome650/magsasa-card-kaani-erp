CREATE TABLE `boundaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`parcelIndex` int NOT NULL,
	`geoJson` text NOT NULL,
	`area` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boundaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`date` varchar(50) NOT NULL,
	`category` enum('Fertilizer','Pesticides','Seeds','Labor','Equipment','Other') NOT NULL,
	`description` text,
	`amount` varchar(50) NOT NULL,
	`parcelIndex` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`farmerName` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`latitude` varchar(50),
	`longitude` varchar(50),
	`size` varchar(100),
	`crops` text,
	`status` enum('Active','Inactive','Pending') NOT NULL DEFAULT 'Active',
	`registrationDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `yields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`parcelIndex` int NOT NULL,
	`cropType` varchar(100) NOT NULL,
	`harvestDate` varchar(50) NOT NULL,
	`quantity` varchar(50) NOT NULL,
	`unit` enum('kg','tons') NOT NULL,
	`qualityGrade` enum('Premium','Standard','Below Standard') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `yields_id` PRIMARY KEY(`id`)
);
