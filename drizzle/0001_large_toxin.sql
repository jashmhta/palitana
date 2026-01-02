CREATE TABLE `checkpoint_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`checkpointId` int NOT NULL,
	`participantUuid` varchar(36),
	`volunteerUuid` varchar(36),
	`note` text NOT NULL,
	`noteType` enum('general','medical','assistance','other') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkpoint_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `checkpoint_notes_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `family_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyGroupUuid` varchar(36) NOT NULL,
	`participantUuid` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`headOfFamilyUuid` varchar(36),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_groups_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `lost_found_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`itemType` enum('lost','found') NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`reportedBy` varchar(255),
	`photoUri` text,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lost_found_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `lost_found_items_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`mobile` varchar(20),
	`qrToken` varchar(64) NOT NULL,
	`groupName` varchar(255),
	`emergencyContact` varchar(20),
	`emergencyContactName` varchar(255),
	`emergencyContactRelation` varchar(100),
	`notes` text,
	`photoUri` text,
	`bloodGroup` varchar(10),
	`medicalConditions` text,
	`allergies` text,
	`medications` text,
	`age` int,
	`gender` enum('male','female','other'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `participants_qrToken_unique` UNIQUE(`qrToken`)
);
--> statement-breakpoint
CREATE TABLE `scan_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`participantUuid` varchar(36) NOT NULL,
	`checkpointId` int NOT NULL,
	`deviceId` varchar(64),
	`gpsLat` decimal(10,7),
	`gpsLng` decimal(10,7),
	`scannedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_logs_id` PRIMARY KEY(`id`),
	CONSTRAINT `scan_logs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `sync_metadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`lastSyncAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sync_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `sync_metadata_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `volunteer_checkpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerUuid` varchar(36) NOT NULL,
	`checkpointId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `volunteer_checkpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`mobile` varchar(20),
	`pin` varchar(10),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteers_uuid_unique` UNIQUE(`uuid`)
);
