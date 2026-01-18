import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClientRole } from "@/const";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Permission,
  PERMISSION_DESCRIPTIONS,
  getRolePermissions,
  groupPermissionsByCategory
} from "@/lib/permissions";
import {
  createPermissionRequest,
  UrgencyLevel,
  getUrgencyDisplayName
} from "@/data/permissionRequestsData";
import { addAuditLog, AuditActionType } from "@/data/auditLogData";

interface RequestPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedPermissions?: Permission[];
}

export default function RequestPermissionDialog({
  open,
  onOpenChange,
  suggestedPermissions = []
}: RequestPermissionDialogProps) {
  const { user } = useAuth();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(suggestedPermissions);
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all available permissions (permissions user doesn't have)
  // Use getClientRole to map server role to client role
  const clientRole = getClientRole(user);
  const userPermissions = clientRole ? getRolePermissions(clientRole) : [];
  const allPermissions: Permission[] = [
    'retention_settings:view',
    'retention_settings:edit',
    'retention_settings:delete',
    'audit_log:view',
    'audit_log:export',
    'audit_archive:view',
    'audit_archive:restore',
    'audit_archive:delete',
    'batch_orders:create',
    'batch_orders:manage',
    'supplier_portal:access',
    'farmer_data:view',
    'farmer_data:edit'
  ];

  const availablePermissions = allPermissions.filter(
    perm => !userPermissions.includes(perm)
  );

  const groupedAvailablePermissions = groupPermissionsByCategory(availablePermissions);

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSubmit = () => {
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setIsSubmitting(true);

    // Create permission request
    // Convert user.id to string and use getClientRole for role
    const clientRole = getClientRole(user) || 'farmer';
    const request = createPermissionRequest(
      String(user.id),
      user.name || 'Unknown',
      user.email || '',
      clientRole,
      selectedPermissions,
      reason.trim(),
      urgency
    );

    // Log to audit
    addAuditLog({
      userId: String(user.id),
      userName: user.name || 'Unknown',
      userRole: clientRole,
      actionType: 'single_order_confirm' as AuditActionType,
      actionDescription: `Requested ${selectedPermissions.length} additional permissions`,
      affectedItemsCount: selectedPermissions.length,
      affectedItems: selectedPermissions,
      details: {
        requestId: request.id,
        permissions: selectedPermissions,
        reason: reason.trim(),
        urgency
      },
      category: 'orders'
    });

    toast.success("Permission request submitted!", {
      description: `Your request for ${selectedPermissions.length} permission(s) has been sent to managers for review.`
    });

    // Reset form
    setSelectedPermissions([]);
    setReason("");
    setUrgency("medium");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Additional Permissions</DialogTitle>
          <DialogDescription>
            Select the permissions you need and provide a justification for your request.
            A manager will review and approve or reject your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Permissions Info */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Your Current Permissions</p>
                  <p className="text-muted-foreground">
                    You currently have {userPermissions.length} permission(s). Select additional permissions below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Permissions */}
          <div>
            <Label className="text-base mb-3 block">Select Permissions to Request</Label>
            {availablePermissions.length === 0 ? (
              <Card className="bg-gray-50 dark:bg-gray-900">
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">You have all available permissions</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No additional permissions to request for your role
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAvailablePermissions).map(([category, permissions]) => (
                  <div key={category}>
                    <h4 className="font-semibold mb-2">{category}</h4>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <Card
                          key={permission}
                          className={`cursor-pointer transition-colors ${
                            selectedPermissions.includes(permission)
                              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                          }`}
                          onClick={() => handlePermissionToggle(permission)}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedPermissions.includes(permission)}
                                onCheckedChange={() => handlePermissionToggle(permission)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{permission}</p>
                                <p className="text-sm text-muted-foreground">
                                  {PERMISSION_DESCRIPTIONS[permission]}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedPermissions.length > 0 && (
            <Card className="bg-green-50 dark:bg-green-950 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium">
                    {selectedPermissions.length} permission(s) selected
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Urgency Level */}
          <div>
            <Label className="text-base mb-3 block">Urgency Level</Label>
            <RadioGroup value={urgency} onValueChange={(value) => setUrgency(value as UrgencyLevel)}>
              <div className="space-y-2">
                {(['low', 'medium', 'high'] as UrgencyLevel[]).map((level) => (
                  <Card
                    key={level}
                    className={`cursor-pointer transition-colors ${
                      urgency === level
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                    }`}
                    onClick={() => setUrgency(level)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={level} id={level} />
                        <Label htmlFor={level} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getUrgencyDisplayName(level)}</span>
                            {level === 'high' && (
                              <Badge className="bg-red-500 text-white">Priority</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {level === 'low' && 'Can wait for regular review cycle'}
                            {level === 'medium' && 'Standard priority, review within 2-3 days'}
                            {level === 'high' && 'Urgent, needs immediate attention'}
                          </p>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Justification */}
          <div>
            <Label htmlFor="reason" className="text-base mb-2 block">
              Justification <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need these permissions and how they will help you perform your duties..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Provide a clear explanation to help managers understand your request
            </p>
          </div>

          {/* Warning */}
          {selectedPermissions.length > 0 && (
            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Review Required</p>
                    <p className="text-muted-foreground">
                      Your request will be reviewed by a manager. You'll be notified when a decision is made.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPermissions.length === 0 || !reason.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
