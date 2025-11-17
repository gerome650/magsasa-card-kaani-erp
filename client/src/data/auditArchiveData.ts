import { AuditLogEntry, auditLogs } from "./auditLogData";

export interface ArchivedBatch {
  id: string;
  archivedDate: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  entryCount: number;
  originalSize: number; // in bytes
  compressedSize: number; // in bytes
  compressionRatio: number; // percentage
  entries: AuditLogEntry[];
  status: 'archived' | 'restored';
}

export interface RetentionPolicy {
  retentionDays: number;
  autoArchiveEnabled: boolean;
  lastArchiveRun: string | null;
  nextScheduledRun: string | null;
}

// Mock archived batches
export const archivedBatches: ArchivedBatch[] = [
  {
    id: 'archive-2024-08',
    archivedDate: '2024-11-01T00:00:00Z',
    dateRangeStart: '2024-08-01T00:00:00Z',
    dateRangeEnd: '2024-08-31T23:59:59Z',
    entryCount: 45,
    originalSize: 125000,
    compressedSize: 35000,
    compressionRatio: 72,
    entries: [], // Would contain actual archived entries
    status: 'archived'
  },
  {
    id: 'archive-2024-07',
    archivedDate: '2024-10-01T00:00:00Z',
    dateRangeStart: '2024-07-01T00:00:00Z',
    dateRangeEnd: '2024-07-31T23:59:59Z',
    entryCount: 38,
    originalSize: 98000,
    compressedSize: 28000,
    compressionRatio: 71,
    entries: [],
    status: 'archived'
  },
  {
    id: 'archive-2024-06',
    archivedDate: '2024-09-01T00:00:00Z',
    dateRangeStart: '2024-06-01T00:00:00Z',
    dateRangeEnd: '2024-06-30T23:59:59Z',
    entryCount: 52,
    originalSize: 142000,
    compressedSize: 41000,
    compressionRatio: 71,
    entries: [],
    status: 'archived'
  }
];

// Retention policy configuration
export const retentionPolicy: RetentionPolicy = {
  retentionDays: 90,
  autoArchiveEnabled: true,
  lastArchiveRun: '2024-11-17T00:00:00Z',
  nextScheduledRun: '2024-11-18T00:00:00Z'
};

// Helper functions

/**
 * Get logs that are older than the retention period
 */
export function getLogsForArchiving(logs: AuditLogEntry[], retentionDays: number = 90): AuditLogEntry[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  return logs.filter(log => new Date(log.timestamp) < cutoffDate);
}

/**
 * Check if logs need archiving
 */
export function needsArchiving(logs: AuditLogEntry[], retentionDays: number = 90): boolean {
  return getLogsForArchiving(logs, retentionDays).length > 0;
}

/**
 * Create an archive batch from logs
 */
export function createArchiveBatch(logs: AuditLogEntry[]): ArchivedBatch {
  if (logs.length === 0) {
    throw new Error("Cannot create archive batch from empty logs");
  }

  // Sort logs by timestamp
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const dateRangeStart = sortedLogs[0].timestamp;
  const dateRangeEnd = sortedLogs[sortedLogs.length - 1].timestamp;

  // Estimate sizes (in real implementation, would calculate actual JSON size)
  const originalSize = logs.length * 2500; // ~2.5KB per entry
  const compressedSize = Math.floor(originalSize * 0.28); // ~72% compression
  const compressionRatio = Math.floor(((originalSize - compressedSize) / originalSize) * 100);

  return {
    id: `archive-${new Date().getTime()}`,
    archivedDate: new Date().toISOString(),
    dateRangeStart,
    dateRangeEnd,
    entryCount: logs.length,
    originalSize,
    compressedSize,
    compressionRatio,
    entries: logs,
    status: 'archived'
  };
}

/**
 * Archive old logs
 */
export function archiveOldLogs(logs: AuditLogEntry[], retentionDays: number = 90): {
  archivedBatch: ArchivedBatch | null;
  remainingLogs: AuditLogEntry[];
} {
  const logsToArchive = getLogsForArchiving(logs, retentionDays);
  
  if (logsToArchive.length === 0) {
    return {
      archivedBatch: null,
      remainingLogs: logs
    };
  }

  const archivedBatch = createArchiveBatch(logsToArchive);
  const archivedIds = new Set(logsToArchive.map(log => log.id));
  const remainingLogs = logs.filter(log => !archivedIds.has(log.id));

  // Add to archived batches
  archivedBatches.unshift(archivedBatch);

  return {
    archivedBatch,
    remainingLogs
  };
}

/**
 * Restore an archived batch
 */
export function restoreArchivedBatch(batchId: string): AuditLogEntry[] {
  const batch = archivedBatches.find(b => b.id === batchId);
  
  if (!batch) {
    throw new Error(`Archive batch ${batchId} not found`);
  }

  batch.status = 'restored';
  return batch.entries;
}

/**
 * Get archive statistics
 */
export function getArchiveStats() {
  const totalArchived = archivedBatches.reduce((sum, batch) => sum + batch.entryCount, 0);
  const totalOriginalSize = archivedBatches.reduce((sum, batch) => sum + batch.originalSize, 0);
  const totalCompressedSize = archivedBatches.reduce((sum, batch) => sum + batch.compressedSize, 0);
  const storageSaved = totalOriginalSize - totalCompressedSize;
  const avgCompressionRatio = archivedBatches.length > 0
    ? Math.floor(archivedBatches.reduce((sum, batch) => sum + batch.compressionRatio, 0) / archivedBatches.length)
    : 0;

  const oldestArchive = archivedBatches.length > 0
    ? archivedBatches[archivedBatches.length - 1]
    : null;

  return {
    totalBatches: archivedBatches.length,
    totalArchived,
    totalOriginalSize,
    totalCompressedSize,
    storageSaved,
    avgCompressionRatio,
    oldestArchive: oldestArchive ? {
      date: oldestArchive.dateRangeStart,
      entryCount: oldestArchive.entryCount
    } : null
  };
}

/**
 * Get archived batches with filtering
 */
export function getArchivedBatches(filters?: {
  status?: 'archived' | 'restored';
  startDate?: string;
  endDate?: string;
}): ArchivedBatch[] {
  let filtered = [...archivedBatches];

  if (filters?.status) {
    filtered = filtered.filter(batch => batch.status === filters.status);
  }

  if (filters?.startDate) {
    filtered = filtered.filter(batch => 
      new Date(batch.dateRangeEnd) >= new Date(filters.startDate!)
    );
  }

  if (filters?.endDate) {
    filtered = filtered.filter(batch => 
      new Date(batch.dateRangeStart) <= new Date(filters.endDate!)
    );
  }

  return filtered.sort((a, b) => 
    new Date(b.archivedDate).getTime() - new Date(a.archivedDate).getTime()
  );
}

/**
 * Calculate days until next archiving
 */
export function getDaysUntilArchiving(logs: AuditLogEntry[], retentionDays: number = 90): number {
  if (logs.length === 0) return retentionDays;

  const newestLog = logs.reduce((newest, log) => 
    new Date(log.timestamp) > new Date(newest.timestamp) ? log : newest
  );

  const newestDate = new Date(newestLog.timestamp);
  const archiveDate = new Date(newestDate);
  archiveDate.setDate(archiveDate.getDate() + retentionDays);

  const now = new Date();
  const daysUntil = Math.ceil((archiveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysUntil);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
