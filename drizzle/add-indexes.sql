-- Performance optimization indexes for Palitana Yatra database
-- These indexes significantly improve query performance for 25+ concurrent volunteers

-- Scan logs indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_scan_logs_participant ON scan_logs(participantUuid);
CREATE INDEX IF NOT EXISTS idx_scan_logs_checkpoint ON scan_logs(checkpointId);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scannedAt);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON scan_logs(createdAt);
-- Composite index for duplicate check (most important query)
CREATE INDEX IF NOT EXISTS idx_scan_logs_participant_checkpoint ON scan_logs(participantUuid, checkpointId);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_qr_token ON participants(qrToken);
CREATE INDEX IF NOT EXISTS idx_participants_updated_at ON participants(updatedAt);
CREATE INDEX IF NOT EXISTS idx_participants_group ON participants(groupName);

-- Sync metadata index
CREATE INDEX IF NOT EXISTS idx_sync_metadata_device ON sync_metadata(deviceId);

-- Checkpoint notes indexes
CREATE INDEX IF NOT EXISTS idx_checkpoint_notes_checkpoint ON checkpoint_notes(checkpointId);
CREATE INDEX IF NOT EXISTS idx_checkpoint_notes_participant ON checkpoint_notes(participantUuid);

-- Family group members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_group ON family_group_members(familyGroupUuid);
CREATE INDEX IF NOT EXISTS idx_family_members_participant ON family_group_members(participantUuid);

-- Volunteer checkpoints index
CREATE INDEX IF NOT EXISTS idx_volunteer_checkpoints_volunteer ON volunteer_checkpoints(volunteerUuid);
CREATE INDEX IF NOT EXISTS idx_volunteer_checkpoints_checkpoint ON volunteer_checkpoints(checkpointId);
