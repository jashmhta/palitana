CREATE INDEX `idx_scan_logs_participant` ON `scan_logs` (`participantUuid`);--> statement-breakpoint
CREATE INDEX `idx_scan_logs_checkpoint` ON `scan_logs` (`checkpointId`);--> statement-breakpoint
CREATE INDEX `idx_scan_logs_scanned_at` ON `scan_logs` (`scannedAt`);--> statement-breakpoint
CREATE INDEX `idx_scan_logs_participant_checkpoint` ON `scan_logs` (`participantUuid`,`checkpointId`);