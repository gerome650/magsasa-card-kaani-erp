import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  archivedBatches,
  getArchivedBatches,
  getArchiveStats,
  restoreArchivedBatch,
  formatBytes,
  ArchivedBatch
} from "@/data/auditArchiveData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  HardDrive,
  Calendar,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  FileText,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AuditArchive() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedBatch, setSelectedBatch] = useState<ArchivedBatch | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const stats = getArchiveStats();
  const batches = getArchivedBatches();

  const handleViewDetails = (batch: ArchivedBatch) => {
    setSelectedBatch(batch);
    setDetailDialogOpen(true);
  };

  const handleRestore = (batch: ArchivedBatch) => {
    try {
      const restoredEntries = restoreArchivedBatch(batch.id);
      toast.success("Archive restored!", {
        description: `${restoredEntries.length} audit log entries have been restored to active logs`
      });
    } catch (error) {
      toast.error("Failed to restore archive", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleDownload = (batch: ArchivedBatch) => {
    toast.success("Archive downloaded", {
      description: `${batch.id}.json will be downloaded shortly`
    });
  };

  // Check if user is supplier
  const isSupplier = user?.role === 'supplier';

  if (!isSupplier) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Supplier Access Only</h2>
            <p className="text-muted-foreground">
              Archive management is only accessible to registered suppliers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log Archives</h1>
          <p className="text-muted-foreground">
            View and manage archived audit logs (90+ days old)
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation('/supplier/retention-settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Total Archives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBatches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Archive batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Archived Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalArchived}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total log entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Storage Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatBytes(stats.storageSaved)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgCompressionRatio}% compression
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Oldest Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.oldestArchive ? (
              <>
                <div className="text-2xl font-bold">
                  {new Date(stats.oldestArchive.date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.oldestArchive.entryCount} entries
                </p>
              </>
            ) : (
              <div className="text-lg text-muted-foreground">No archives</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Retention Policy Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Retention Policy</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Audit logs older than <strong>90 days</strong> are automatically archived to save storage space.
                Archives are compressed and can be restored or downloaded at any time.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Auto-Archive</p>
                  <p className="font-medium">Enabled</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Retention Period</p>
                  <p className="font-medium">90 days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Run</p>
                  <p className="font-medium">Nov 17, 2024</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archives List */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Batches ({batches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No archives yet</h3>
              <p className="text-muted-foreground">
                Audit logs will be automatically archived after 90 days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Card key={batch.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Archive className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">
                            {new Date(batch.dateRangeStart).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h3>
                          <Badge className={
                            batch.status === 'restored' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }>
                            {batch.status === 'restored' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Restored
                              </>
                            ) : (
                              'Archived'
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(batch.dateRangeStart).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} - {new Date(batch.dateRangeEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Entries</p>
                        <p className="text-lg font-semibold">{batch.entryCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Original Size</p>
                        <p className="text-lg font-semibold">{formatBytes(batch.originalSize)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Compressed</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatBytes(batch.compressedSize)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Saved</p>
                        <p className="text-lg font-semibold text-green-600">
                          {batch.compressionRatio}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewDetails(batch)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {batch.status === 'archived' && (
                        <Button
                          variant="outline"
                          onClick={() => handleRestore(batch)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleDownload(batch)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archive Details</DialogTitle>
            <DialogDescription>
              Detailed information about this archive batch
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Archive ID</p>
                  <p className="font-mono text-sm">{selectedBatch.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Archived Date</p>
                  <p className="font-medium">
                    {new Date(selectedBatch.archivedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="font-medium">
                    {new Date(selectedBatch.dateRangeStart).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })} - {new Date(selectedBatch.dateRangeEnd).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={
                    selectedBatch.status === 'restored' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }>
                    {selectedBatch.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Storage Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Entries:</span>
                    <span className="font-medium">{selectedBatch.entryCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Size:</span>
                    <span className="font-medium">{formatBytes(selectedBatch.originalSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Compressed Size:</span>
                    <span className="font-medium text-green-600">
                      {formatBytes(selectedBatch.compressedSize)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Space Saved:</span>
                    <span className="font-bold text-green-600">
                      {formatBytes(selectedBatch.originalSize - selectedBatch.compressedSize)} ({selectedBatch.compressionRatio}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(selectedBatch)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
