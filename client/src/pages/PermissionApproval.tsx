import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getClientRole } from "@/const";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import {
  getPermissionRequests,
  getRequestsByStatus,
  approveRequest,
  rejectRequest,
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
import { addAuditLog } from "@/data/auditLogData";

export default function PermissionApproval() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  const allRequests = getPermissionRequests();
  const pendingRequests = getRequestsByStatus('pending');
  const approvedRequests = getRequestsByStatus('approved');
  const rejectedRequests = getRequestsByStatus('rejected');

  // Check if user is manager/admin using getClientRole to map server role to client role
  const clientRole = getClientRole(user);
  const canReview = clientRole === 'manager' || clientRole === 'admin';

  const handleReviewClick = (request: PermissionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewReason("");
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = () => {
    if (!selectedRequest || !user || !reviewAction) return;

    if (reviewAction === 'reject' && !reviewReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (reviewAction === 'approve') {
      // Use getClientRole to map server role to client role, convert id to string
      const clientRole = getClientRole(user) || 'manager';
      const approved = approveRequest(
        selectedRequest.id,
        String(user.id),
        user.name || 'Unknown',
        clientRole,
        reviewReason.trim() || undefined
      );

      if (approved) {
        // Log to audit
        addAuditLog({
          userId: String(user.id),
          userName: user.name || 'Unknown',
          userRole: clientRole,
          actionType: 'permission_request_approved',
          actionDescription: `Approved permission request from ${selectedRequest.requesterName}`,
          affectedItemsCount: selectedRequest.requestedPermissions.length,
          affectedItems: selectedRequest.requestedPermissions,
          details: {
            requestId: selectedRequest.id,
            requester: selectedRequest.requesterName,
            permissions: selectedRequest.requestedPermissions,
            reason: reviewReason.trim()
          },
          category: 'permissions'
        });

        toast.success("Request approved!", {
          description: `${selectedRequest.requesterName} has been granted ${selectedRequest.requestedPermissions.length} permission(s)`
        });
      }
    } else if (reviewAction === 'reject') {
      // Use getClientRole to map server role to client role, convert id to string
      const clientRole = getClientRole(user) || 'manager';
      const rejected = rejectRequest(
        selectedRequest.id,
        String(user.id),
        user.name || 'Unknown',
        clientRole,
        reviewReason.trim()
      );

      if (rejected) {
        // Log to audit
        addAuditLog({
          userId: String(user.id),
          userName: user.name || 'Unknown',
          userRole: clientRole,
          actionType: 'permission_request_rejected',
          actionDescription: `Rejected permission request from ${selectedRequest.requesterName}`,
          affectedItemsCount: selectedRequest.requestedPermissions.length,
          affectedItems: selectedRequest.requestedPermissions,
          details: {
            requestId: selectedRequest.id,
            requester: selectedRequest.requesterName,
            permissions: selectedRequest.requestedPermissions,
            reason: reviewReason.trim()
          },
          category: 'permissions'
        });

        toast.info("Request rejected", {
          description: `${selectedRequest.requesterName} will be notified of the decision`
        });
      }
    }

    setReviewDialogOpen(false);
    setSelectedRequest(null);
    setReviewAction(null);
    setReviewReason("");
  };

  const renderRequestCard = (request: PermissionRequest) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{request.requesterName}</h3>
                <Badge className={`${getRoleBadgeColor(request.requesterRole)} text-white text-xs`}>
                  {getRoleDisplayName(request.requesterRole)}
                </Badge>
                <Badge className={`${getStatusColor(request.status)} text-white text-xs`}>
                  {getStatusDisplayName(request.status)}
                </Badge>
                <Badge className={`${getUrgencyColor(request.urgency)} text-white text-xs`}>
                  {getUrgencyDisplayName(request.urgency)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3" />
                {new Date(request.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs">
                {new Date(request.submittedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
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
            <Label className="text-sm font-semibold mb-2 block">Justification</Label>
            <p className="text-sm text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900 rounded">
              {request.reason}
            </p>
          </div>

          {/* Review Info (for approved/rejected) */}
          {request.status !== 'pending' && request.reviewerName && (
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
                      <p className="text-xs text-muted-foreground">
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
                    <p className="text-sm mt-2">
                      {request.approvalReason || request.rejectionReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions (for pending requests) */}
          {request.status === 'pending' && canReview && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleReviewClick(request, 'approve')}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReviewClick(request, 'reject')}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!canReview) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Manager Access Only</h2>
            <p className="text-muted-foreground">
              Permission approval is only accessible to managers and administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Permission Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve permission requests from team members
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-3xl font-bold">{approvedRequests.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-3xl font-bold">{rejectedRequests.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{allRequests.length}</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p className="font-medium">No pending requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All permission requests have been reviewed
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(renderRequestCard)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No approved requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Approved requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedRequests.map(renderRequestCard)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No rejected requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rejected requests will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            rejectedRequests.map(renderRequestCard)
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Permission Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'Provide an optional note explaining your approval decision.'
                : 'Please provide a reason for rejecting this request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Requester</Label>
                <p className="text-sm">{selectedRequest.requesterName}</p>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Permissions ({selectedRequest.requestedPermissions.length})
                </Label>
                <div className="space-y-1">
                  {selectedRequest.requestedPermissions.map((perm) => (
                    <p key={perm} className="text-sm text-muted-foreground">• {perm}</p>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="review-reason" className="text-sm font-semibold mb-2 block">
                  {reviewAction === 'approve' ? 'Approval Note (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="review-reason"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Add a note about why this request was approved...'
                      : 'Explain why this request is being rejected...'
                  }
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={reviewAction === 'reject' && !reviewReason.trim()}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
