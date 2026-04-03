import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, FileText, CheckCircle, XCircle, Plus } from "lucide-react";
import { LeaveRequest } from "@/types/attendance";
import { format, differenceInDays } from "date-fns";

interface LeaveRequestPortalProps {
  leaveRequests: LeaveRequest[];
  isLoading?: boolean;
  isManager?: boolean;
  onSubmit?: (data: Partial<LeaveRequest>) => void;
  onApprove?: (id: string, reason?: string) => void;
  onReject?: (id: string, reason?: string) => void;
}

export function LeaveRequestPortal({
  leaveRequests,
  isLoading = false,
  isManager = false,
  onSubmit,
  onApprove,
  onReject,
}: LeaveRequestPortalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    leave_type: "vacation" as const,
    reason: "",
    contact_person: "",
    contact_phone: "",
  });
  const [openForm, setOpenForm] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    id: string | null;
    action: "approve" | "reject" | null;
  }>({ open: false, id: null, action: null });
  const [approvalReason, setApprovalReason] = useState("");

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(new Date(endDate), new Date(startDate)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    const numberOfDays = calculateDays(formData.start_date, formData.end_date);

    onSubmit?.({
      ...formData,
      number_of_days: numberOfDays,
    });

    setFormData({
      start_date: "",
      end_date: "",
      leave_type: "vacation",
      reason: "",
      contact_person: "",
      contact_phone: "",
    });
    setOpenForm(false);

    toast({
      title: "Success",
      description: "Leave request submitted successfully",
    });
  };

  const handleApprovalAction = (action: "approve" | "reject", requestId: string) => {
    setApprovalDialog({ open: true, id: requestId, action });
  };

  const confirmApprovalAction = () => {
    if (!approvalDialog.id || !approvalDialog.action) return;

    if (approvalDialog.action === "approve") {
      onApprove?.(approvalDialog.id, approvalReason);
      toast({
        title: "Approved",
        description: "Leave request has been approved",
      });
    } else {
      onReject?.(approvalDialog.id, approvalReason);
      toast({
        title: "Rejected",
        description: "Leave request has been rejected",
      });
    }

    setApprovalDialog({ open: false, id: null, action: null });
    setApprovalReason("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vacation: "Vacation",
      sick: "Sick Leave",
      emergency: "Emergency Leave",
      unpaid: "Unpaid Leave",
      maternity: "Maternity Leave",
      paternity: "Paternity Leave",
    };
    return labels[type] || type;
  };

  const myRequests = leaveRequests.filter((req) => req.status !== "cancelled");
  const pendingRequests = leaveRequests.filter((req) => req.status === "pending");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue={isManager ? "pending" : "my-requests"} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        {!isManager && <TabsTrigger value="my-requests">My Requests</TabsTrigger>}
        {isManager && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
        {isManager && <TabsTrigger value="history">Approval History</TabsTrigger>}
        {!isManager && <TabsTrigger value="approved">Approved Leaves</TabsTrigger>}
      </TabsList>

      {/* Employee: My Requests */}
      {!isManager && (
        <TabsContent value="my-requests" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Leave Requests</h3>
            <Dialog open={openForm} onOpenChange={setOpenForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Submit Leave Request</DialogTitle>
                  <DialogDescription>
                    Fill in the details of your leave request. HR will review and approve.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  {formData.start_date && formData.end_date && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        Duration: <span className="font-semibold">
                          {calculateDays(formData.start_date, formData.end_date)} days
                        </span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Leave Type</label>
                    <Select
                      value={formData.leave_type}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, leave_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Reason</label>
                    <Textarea
                      placeholder="Please provide a reason for your leave request..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                      <Input
                        placeholder="Contact person name"
                        value={formData.contact_person}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_person: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Phone</label>
                      <Input
                        placeholder="Phone number"
                        value={formData.contact_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {myRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No leave requests yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{getLeaveTypeLabel(request.leave_type)}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(request.start_date), "MMM dd")} to{" "}
                            {format(new Date(request.end_date), "MMM dd, yyyy")}
                          </div>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {request.number_of_days} days
                          </span>
                        </div>
                        {request.approved_at && (
                          <p className="text-xs text-green-600 mt-2">
                            Approved on {format(new Date(request.approved_at), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      )}

      {/* Employee: Approved Leaves */}
      {!isManager && (
        <TabsContent value="approved" className="space-y-4">
          <h3 className="text-lg font-semibold">Approved Leaves</h3>
          {leaveRequests.filter((req) => req.status === "approved").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No approved leaves</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaveRequests
                .filter((req) => req.status === "approved")
                .map((request) => (
                  <Card key={request.id} className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h4 className="font-semibold">{getLeaveTypeLabel(request.leave_type)}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(request.start_date), "MMM dd")} to{" "}
                              {format(new Date(request.end_date), "MMM dd, yyyy")}
                            </div>
                            <span>•</span>
                            <span className="font-semibold text-foreground">
                              {request.number_of_days} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      )}

      {/* Manager: Pending Approvals */}
      {isManager && (
        <TabsContent value="pending" className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Leave Approvals</h3>
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {request.employee?.first_name} {request.employee?.last_name}
                          </h4>
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getLeaveTypeLabel(request.leave_type)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(request.start_date), "MMM dd")} to{" "}
                            {format(new Date(request.end_date), "MMM dd, yyyy")}
                          </div>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {request.number_of_days} days
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleApprovalAction("reject", request.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovalAction("approve", request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      )}

      {/* Manager: Approval History */}
      {isManager && (
        <TabsContent value="history" className="space-y-4">
          <h3 className="text-lg font-semibold">Approval History</h3>
          {leaveRequests.filter((req) => req.status !== "pending").length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No approval history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaveRequests
                .filter((req) => req.status !== "pending")
                .map((request) => (
                  <Card
                    key={request.id}
                    className={
                      request.status === "approved"
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {request.status === "approved" ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <h4 className="font-semibold">
                              {request.employee?.first_name} {request.employee?.last_name}
                            </h4>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {getLeaveTypeLabel(request.leave_type)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(request.start_date), "MMM dd")} to{" "}
                              {format(new Date(request.end_date), "MMM dd, yyyy")}
                            </div>
                            <span>•</span>
                            <span className="font-semibold text-foreground">
                              {request.number_of_days} days
                            </span>
                          </div>
                          {request.approved_at && (
                            <p className="text-xs mt-2">
                              {request.status === "approved" ? "Approved" : "Rejected"} on{" "}
                              {format(new Date(request.approved_at), "MMM dd, yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      )}

      {/* Approval Dialog */}
      <AlertDialog
        open={approvalDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setApprovalDialog({ open: false, id: null, action: null });
            setApprovalReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approvalDialog.action === "approve" ? "Approve" : "Reject"} Leave Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approvalDialog.action === "approve"
                ? "Are you sure you want to approve this leave request?"
                : "Are you sure you want to reject this leave request?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <Textarea
                placeholder="Add a note for the employee..."
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprovalAction}
              className={
                approvalDialog.action === "approve" ? "bg-green-600" : "bg-red-600"
              }
            >
              {approvalDialog.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
