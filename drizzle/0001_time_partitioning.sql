-- Add time partitioning support
-- Migration: 0001_time_partitioning

-- Add partition_path column to sessions table
-- NULL for legacy sessions created before time-partitioning
ALTER TABLE `sessions` ADD COLUMN `partition_path` text;
--> statement-breakpoint

-- Add session_partition_granularity to config table
-- Valid values: 'monthly', 'weekly', 'daily', 'none'
ALTER TABLE `config` ADD COLUMN `session_partition_granularity` text DEFAULT 'monthly' NOT NULL;
