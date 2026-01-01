import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { retentionPolicy } from "@/data/auditArchiveData";
import { auditLogs } from "@/data/auditLogData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Database,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { addAuditLog } from "@/data/auditLogData";
import { useLocation } from "wouter";
import RequestPermissionDialog from "@/components/RequestPermissionDialog";
import {
  canModifyRetentionSettings,
  canEnablePermanentDeletion,
  canViewRetentionSettings,
  getRoleDisplayName,
  getRoleBadgeColor,
  getRolePermissions,
  PERMISSION_DESCRIPTIONS
} from "@/lib/permissions";

export default function RetentionSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [retentionDays, setRetentionDays] = useState(retentionPolicy.retentionDays);
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(retentionPolicy.autoArchiveEnabled);
  const [permanentDeletionEnabled, setPermanentDeletionEnabled] = useState(false);
  const [permanentDeletionDays, setPermanentDeletionDays] = useState(365);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'disable' | 'reset' | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // Check for changes
  useEffect(() => {
    const changed = 
      retentionDays !== retentionPolicy.retentionDays ||
      autoArchiveEnabled !== retentionPolicy.autoArchiveEnabled;
    setHasChanges(changed);
  }, [retentionDays, autoArchiveEnabled]);

  // Calculate impact
  const getImpactPreview = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const affectedLogs = auditLogs.filter(log => 
      new Date(log.timestamp) < cutoffDate
    );

    return {
      count: affectedLogs.length,
      percentage: auditLogs.length > 0 
        ? Math.round((affectedLogs.length / auditLogs.length) * 100)
        : 0
    };
  };

  const impact = getImpactPreview();

  const handleSave = () => {
    if (!canEdit) {
      // Log unauthorized access attempt
      addAuditLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        userRole: user?.role || 'farmer',
        actionType: 'single_order_decline',
        actionDescription: `Attempted to modify retention settings without permission`,
        affectedItemsCount: 0,
        affectedItems: ['retention-settings'],
        details: {
          requiredPermission: 'retention_settings:edit',
          userRole: user?.role
        },
        category: 'orders'
      });
      
      toast.error("Access Denied", {
        description: "You don't have permission to modify retention settings"
      });
      return;
    }
    
    setConfirmAction('save');
    setConfirmDialogOpen(true);
  };

  const handleDisableAutoArchive = (checked: boolean) => {
    if (!canEdit) {
      addAuditLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        userRole: user?.role || 'farmer',
        actionType: 'single_order_decline',
        actionDescription: `Attempted to toggle auto-archive without permission`,
        affectedItemsCount: 0,
        affectedItems: ['auto-archive-setting'],
        details: {
          requiredPermission: 'retention_settings:edit',
          userRole: user?.role
        },
        category: 'orders'
      });
      return;
    }
    
    if (!checked && autoArchiveEnabled) {
      setConfirmAction('disable');
      setConfirmDialogOpen(true);
    } else {
      setAutoArchiveEnabled(checked);
    }
  };

  const handleReset = () => {
    if (!canEdit) {
      addAuditLog({
        userId: user?.id || 'unknown',
        userName: user?.name || 'Unknown User',
        userRole: user?.role || 'farmer',
        actionType: 'single_order_decline',
        actionDescription: `Attempted to reset retention settings without permission`,
        affectedItemsCount: 0,
        affectedItems: ['retention-settings'],
        details: {
          requiredPermission: 'retention_settings:edit',
          userRole: user?.role
        },
        category: 'orders'
      });
      
      toast.error("Access Denied", {
        description: "You don't have permission to reset retention settings"
      });
      return;
    }
    
    setConfirmAction('reset');
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (confirmAction === 'save') {
      // Save settings
      retentionPolicy.retentionDays = retentionDays;
      retentionPolicy.autoArchiveEnabled = autoArchiveEnabled;

      // Add audit log
      addAuditLog({
        userId: user?.id || 'admin-001',
        userName: user?.name || 'Administrator',
        userRole: user?.role || 'manager',
        actionType: 'single_inventory_update',
        actionDescription: `Updated retention settings: ${retentionDays} days, auto-archive ${autoArchiveEnabled ? 'enabled' : 'disabled'}`,
        affectedItemsCount: 1,
        affectedItems: ['retention-policy'],
        details: {
          retentionDays,
          autoArchiveEnabled,
          previousRetentionDays: retentionPolicy.retentionDays,
          previousAutoArchiveEnabled: retentionPolicy.autoArchiveEnabled
        },
        category: 'inventory'
      });

      toast.success("Settings saved!", {
        description: `Retention period: ${retentionDays} days, Auto-archive: ${autoArchiveEnabled ? 'Enabled' : 'Disabled'}`
      });
      setHasChanges(false);
    } else if (confirmAction === 'disable') {
      setAutoArchiveEnabled(false);
      toast.warning("Auto-archive disabled", {
        description: "Logs will no longer be automatically archived"
      });
    } else if (confirmAction === 'reset') {
      setRetentionDays(90);
      setAutoArchiveEnabled(true);
      setPermanentDeletionEnabled(false);
      setPermanentDeletionDays(365);
      toast.info("Settings reset to defaults");
    }

    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const presetDays = [30, 60, 90, 180];

  // Check permissions
  const canView = canViewRetentionSettings(user?.role);
  const canEdit = canModifyRetentionSettings(user?.role);
  const canDelete = canEnablePermanentDeletion(user?.role);

  if (!canView) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You do not have permission to view retention settings.
            </p>
            <p className="text-sm text-muted-foreground">
              Required permission: <strong>retention_settings:view</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Your role: <strong>{user?.role ? getRoleDisplayName(user.role) : 'Unknown'}</strong>
            </p>
            <Button onClick={() => setRequestDialogOpen(true)}>
              Request Access
            </Button>
          </CardContent>
        </Card>
        <RequestPermissionDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          suggestedPermissions={['retention_settings:view']}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Retention Settings</h1>
            <Badge className={`${getRoleBadgeColor(user?.role || 'farmer')} text-white`}>
              {getRoleDisplayName(user?.role || 'farmer')}
            </Badge>
            {!canEdit && (
              <Badge 
                variant="outline" 
                className="border-orange-500 text-orange-600 cursor-pointer hover:bg-orange-50"
                onClick={() => setLocation('/role-permissions')}
              >
                Read-Only (View Permissions)
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Configure data retention and archiving policies
          </p>
        </div>
        {hasChanges && canEdit && (
          <Badge className="bg-yellow-500 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Current Status */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">Current Configuration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Retention Period</p>
                  <p className="font-medium text-lg">{retentionPolicy.retentionDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auto-Archive</p>
                  <p className="font-medium text-lg">
                    {retentionPolicy.autoArchiveEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Modified</p>
                  <p className="font-medium">Nov 17, 2024</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Modified By</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retention Period Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Retention Period
          </CardTitle>
          <CardDescription>
            Configure how long audit logs are kept before archiving
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Slider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base">Days Before Archiving</Label>
              <div className="text-3xl font-bold text-blue-600">
                {retentionDays} days
              </div>
            </div>
            <Slider
              value={[retentionDays]}
              onValueChange={(value) => canEdit && setRetentionDays(value[0])}
              min={30}
              max={180}
              step={1}
              className="mb-4"
              disabled={!canEdit}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>30 days</span>
              <span>180 days</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <Label className="text-sm mb-2 block">Quick Presets</Label>
            <div className="flex gap-2">
              {presetDays.map((days) => (
                <Button
                  key={days}
                  variant={retentionDays === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => canEdit && setRetentionDays(days)}
                  disabled={!canEdit}
                >
                  {days} days
                </Button>
              ))}
            </div>
          </div>

          {/* Impact Preview */}
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Impact Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Logs to be archived:</span>
                  <span className="font-medium">{impact.count} entries</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage of total:</span>
                  <span className="font-medium">{impact.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active logs remaining:</span>
                  <span className="font-medium">{auditLogs.length - impact.count} entries</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Auto-Archive Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Auto-Archive Settings
          </CardTitle>
          <CardDescription>
            Configure automatic archiving behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="auto-archive" className="text-base">
                Enable Automatic Archiving
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically archive logs older than the retention period
              </p>
            </div>
            <Switch
              id="auto-archive"
              checked={autoArchiveEnabled}
              onCheckedChange={handleDisableAutoArchive}
              disabled={!canEdit}
            />
          </div>

          {autoArchiveEnabled && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>
                    Archiving runs daily at midnight. Next run: {
                      retentionPolicy.nextScheduledRun 
                        ? new Date(retentionPolicy.nextScheduledRun).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Not scheduled'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Advanced settings that permanently delete data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="permanent-deletion" className="text-base">
                Enable Permanent Deletion
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete archived logs older than a specified threshold
              </p>
            </div>
            <Switch
              id="permanent-deletion"
              checked={permanentDeletionEnabled}
              onCheckedChange={(checked) => canDelete && setPermanentDeletionEnabled(checked)}
              disabled={!canDelete}
            />
          </div>

          {permanentDeletionEnabled && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm mb-2 block">
                  Delete archives older than {permanentDeletionDays} days
                </Label>
                <Slider
                  value={[permanentDeletionDays]}
                  onValueChange={(value) => canDelete && setPermanentDeletionDays(value[0])}
                  min={180}
                  max={730}
                  step={30}
                  className="mb-2"
                  disabled={!canDelete}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>180 days (6 months)</span>
                  <span>730 days (2 years)</span>
                </div>
              </div>

              <Card className="bg-red-50 dark:bg-red-950 border-red-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-red-600">
                      <strong>Warning:</strong> Permanently deleted archives cannot be recovered.
                      Ensure compliance with data retention regulations before enabling.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || !canEdit}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!canEdit}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'save' && 'Confirm Settings Change'}
              {confirmAction === 'disable' && 'Disable Auto-Archive?'}
              {confirmAction === 'reset' && 'Reset to Defaults?'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'save' && (
                <>
                  You are about to change the retention settings:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Retention period: <strong>{retentionDays} days</strong></li>
                    <li>Auto-archive: <strong>{autoArchiveEnabled ? 'Enabled' : 'Disabled'}</strong></li>
                    <li>Affected logs: <strong>{impact.count} entries</strong></li>
                  </ul>
                </>
              )}
              {confirmAction === 'disable' && (
                <>
                  Disabling auto-archive means logs will no longer be automatically archived.
                  You will need to manually trigger archiving from the Audit Log page.
                </>
              )}
              {confirmAction === 'reset' && (
                <>
                  This will reset all retention settings to their default values:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Retention period: <strong>90 days</strong></li>
                    <li>Auto-archive: <strong>Enabled</strong></li>
                    <li>Permanent deletion: <strong>Disabled</strong></li>
                  </ul>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
