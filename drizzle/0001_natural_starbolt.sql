CREATE TABLE `patterns` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`derived_from_sessions` text DEFAULT '[]',
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `config` ADD `session_partition_granularity` text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `partition_path` text;