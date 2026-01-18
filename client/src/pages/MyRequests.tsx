import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClientRole } from "@/const";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Calendar,
  Shield,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserRequests,
  cancelRequest,
  getStatusColor,
  getStatusDisplayName,
  getUrgencyColor,
  getUrgencyDisplayName,
  PermissionRequest
} from "@/data/permissionRequestsData";
import {
  PERMISSION_DESCRIPTIONS,
  getRoleDisplayName,
  getRoleBadgeColor
} from "@/lib/permissions";
import RequestPermissionDialog from "@/components/RequestPermissionDialog";
import { addAuditLog } from "@/data/auditLogData";

export default function MyRequests() {
  const { user } = useAuth();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Not Authenticated</h2>
            <p className="text-muted-foreground">
              Please log in to view your permission requests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert user.id to string for compatibility
  const userIdStr = String(user.id);
  const myRequests = getUserRequests(userIdStr);
  const pendingRequests = myRequests.filter(r => r.status === 'pending');
  const completedRequests = myRequests.filter(r => r.status !== 'pending');

  const handleCancelRequest = (request: PermissionRequest) => {
    const cancelled = cancelRequest(request.id, userIdStr);
    
    if (cancelled) {
      // Log to audit - use getClientRole to map server role to client role
      const clientRole = getClientRole(user) || 'farmer';
      addAuditLog({
        userId: userIdStr,
        userName: user.name || 'Unknown',
        userRole: clientRole,
        actionType: 'permission_request_cancelled',
        actionDescription: `Cancelled permission request`,
        affectedItemsCount: request.requestedPermissions.length,
        affectedItems: request.requestedPermissions,
        details: {
          requestId: request.id,
          permissions: request.requestedPermissions
        },
        category: 'permissions'
      });

      toast.info("Request cancelled", {
        description: "Your permission request has been cancelled"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'cancelled':
        return <Ban className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const renderRequestCard = (request: PermissionRequest) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(request.status)}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">Request #{request.id}</h3>
                  <Badge className={`${getStatusColor(request.status)} text-white text-xs`}>
                    {getStatusDisplayName(request.status)}
                  </Badge>
                  <Badge className={`${getUrgencyColor(request.urgency)} text-white text-xs`}>
                    {getUrgencyDisplayName(request.urgency)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Submitted {new Date(request.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelRequest(request)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Requested Permissions */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Requested Permissions ({request.requestedPermissions.length})
            </Label>
            <div className="space-y-2">
              {request.requestedPermissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded"
                >
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{permission}</p>
                    <p className="text-xs text-muted-foreground">
                      {PERMISSION_DESCRIPTIONS[permission]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Your Justification</Label>
            <p className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900 rounded">
              {request.reason}
            </p>
          </div>

          {/* Review Info */}
          {request.status !== 'pending' && request.status !== 'cancelled' && request.reviewerName && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Review Decision</Label>
              <Card className={`
                ${request.status === 'approved' ? 'bg-green-50 dark:bg-green-950 border-green-200' : ''}
                ${request.status === 'rejected' ? 'bg-red-50 dark:bg-red-950 border-red-200' : ''}
              `}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 mb-2">
                    {request.status === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.reviewerName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(request.reviewedAt!).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {(request.approvalReason || request.rejectionReason) && (
                    <div className="mt-2">
                      <Label className="text-xs font-semibold mb-1 block">Manager's Note</Label>
                      <p className="text-sm">
                        {request.approvalReason || request.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeline */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Request Timeline</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <span className="text-muted-foreground">Submitted</span>
                <span className="ml-auto">
                  {new Date(request.submittedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {request.reviewedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    request.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                  }`}></div>
                  <span className="text-muted-foreground">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'}
                  </span>
                  <span className="ml-auto">
                    {new Date(request.reviewedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Permission Requests</h1>
          <p className="text-muted-foreground">
            Track the status of your permission requests
          </p>
        </div>
        <Button onClick={() => setRequestDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedRequests.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{myRequests.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Role Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Your Current Role</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getRoleBadgeColor(getClientRole(user) || 'farmer')} text-white`}>
                  {getRoleDisplayName(getClientRole(user) || 'farmer')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Request additional permissions to expand your access
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Requests</h2>
        {myRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">No permission requests yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Request additional permissions to access more features
              </p>
              <Button onClick={() => setRequestDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          myRequests.map(renderRequestCard)
        )}
      </div>

      {/* Request Dialog */}
      <RequestPermissionDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
      />
    </div>
  );
}
