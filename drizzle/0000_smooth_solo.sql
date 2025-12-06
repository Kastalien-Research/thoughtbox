CREATE TABLE `config` (
	`install_id` text PRIMARY KEY NOT NULL,
	`data_dir` text NOT NULL,
	`disable_thought_logging` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notebooks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`language` text DEFAULT 'typescript' NOT NULL,
	`cell_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`thought_count` integer DEFAULT 0 NOT NULL,
	`branch_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`last_accessed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
