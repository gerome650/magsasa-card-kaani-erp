import { useEffect, useState } from "react";
import { auditLogs } from "@/data/auditLogData";
import {
  archiveOldLogs,
  needsArchiving,
  getDaysUntilArchiving,
  retentionPolicy
} from "@/data/auditArchiveData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play
} from "lucide-react";
import { toast } from "sonner";

/**
 * AutoArchiveManager - Displays archiving status and allows manual triggers
 * In production, this would be a background service/cron job
 */
export default function AutoArchiveManager() {
  const [isArchiving, setIsArchiving] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [logsNeedArchiving, setLogsNeedArchiving] = useState(false);
  const [daysUntilNext, setDaysUntilNext] = useState(0);

  // Check if archiving is needed
  useEffect(() => {
    const checkArchiving = () => {
      const needsArch = needsArchiving(auditLogs, retentionPolicy.retentionDays);
      const daysUntil = getDaysUntilArchiving(auditLogs, retentionPolicy.retentionDays);
      
      setLogsNeedArchiving(needsArch);
      setDaysUntilNext(daysUntil);
      setLastCheck(new Date());
    };

    checkArchiving();
    
    // Check every hour in production (for demo, check every minute)
    const interval = setInterval(checkArchiving, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleManualArchive = async () => {
    setIsArchiving(true);
    
    // Simulate archiving process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const result = archiveOldLogs(auditLogs, retentionPolicy.retentionDays);
      
      if (result.archivedBatch) {
        toast.success("Archiving completed!", {
          description: `${result.archivedBatch.entryCount} audit log entries have been archived`
        });
        setLogsNeedArchiving(false);
      } else {
        toast.info("No logs to archive", {
          description: "All logs are within the retention period"
        });
      }
    } catch (error) {
      toast.error("Archiving failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Card className={
      logsNeedArchiving 
        ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200" 
        : "bg-green-50 dark:bg-green-950 border-green-200"
    }>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            logsNeedArchiving ? 'bg-yellow-500' : 'bg-green-500'
          }`}>
            {logsNeedArchiving ? (
              <AlertCircle className="w-5 h-5 text-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">Automatic Archiving</h3>
              <Badge className={
                retentionPolicy.autoArchiveEnabled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-500 text-white'
              }>
                {retentionPolicy.autoArchiveEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {logsNeedArchiving ? (
                <>
                  <strong>Action required:</strong> Logs older than {retentionPolicy.retentionDays} days are ready for archiving.
                  Click "Run Now" to archive them.
                </>
              ) : (
                <>
                  All logs are within the retention period. Next archiving check in <strong>{daysUntilNext} days</strong>.
                </>
              )}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Retention Period</p>
                <p className="font-medium">{retentionPolicy.retentionDays} days</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Check</p>
                <p className="font-medium">
                  {lastCheck.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Run</p>
                <p className="font-medium">
                  {retentionPolicy.lastArchiveRun 
                    ? new Date(retentionPolicy.lastArchiveRun).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Never'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Next Scheduled</p>
                <p className="font-medium">
                  {retentionPolicy.nextScheduledRun 
                    ? new Date(retentionPolicy.nextScheduledRun).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Not scheduled'
                  }
                </p>
              </div>
            </div>

            {logsNeedArchiving && (
              <Button
                onClick={handleManualArchive}
                disabled={isArchiving}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isArchiving ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
