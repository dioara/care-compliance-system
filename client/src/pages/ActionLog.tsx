import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList, Search, Filter, Download, CheckCircle2, Clock, AlertCircle, Calendar, User, FileText, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useLocation } from "@/contexts/LocationContext";

export default function ActionLog() {
  const { user } = useAuth();
  const { activeLocationId, permissions } = useLocation();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRag, setFilterRag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateCompletionDate, setUpdateCompletionDate] = useState<string>("");
  
  // Add action dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    issueDescription: "",
    ragStatus: "amber" as "red" | "amber" | "green",
    responsiblePersonId: 0,
    targetCompletionDate: "",
    locationId: 0,
    notes: "",
  });

  // Fetch all action plans across locations
  const { data: actionPlans, isLoading, refetch } = trpc.audits.getAllActionPlans.useQuery({
    locationId: filterLocation === "all" ? undefined : parseInt(filterLocation),
  });

  // Fetch staff for assignment
  const { data: staff = [] } = trpc.staff.list.useQuery();

  const createActionMutation = trpc.audits.createActionPlan.useMutation({
    onSuccess: () => {
      toast.success("Action created successfully");
      setIsAddDialogOpen(false);
      setNewAction({
        issueDescription: "",
        ragStatus: "amber",
        responsiblePersonId: 0,
        targetCompletionDate: "",
        locationId: 0,
        notes: "",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create action: ${error.message}`);
    },
  });

  const handleCreateAction = () => {
    if (!user?.tenantId || !newAction.issueDescription || !newAction.locationId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createActionMutation.mutate({
      tenantId: user.tenantId,
      locationId: newAction.locationId,
      issueDescription: newAction.issueDescription,
      ragStatus: newAction.ragStatus,
      responsiblePersonId: newAction.responsiblePersonId || user.id,
      targetCompletionDate: newAction.targetCompletionDate ? new Date(newAction.targetCompletionDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: newAction.notes,
    });
  };

  const generatePdfMutation = trpc.audits.generateActionLogPDF.useMutation({
    onSuccess: (data) => {
      // Open PDF in new tab
      window.open(data.url, "_blank");
      toast.success("PDF report generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const handleDownloadPDF = () => {
    generatePdfMutation.mutate({
      locationId: filterLocation === "all" ? undefined : parseInt(filterLocation),
      filterStatus: filterStatus,
      filterRag: filterRag,
    });
  };

  const updateActionMutation = trpc.audits.updateActionPlanStatus.useMutation({
    onSuccess: () => {
      toast.success("Action updated successfully");
      setIsUpdateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update action: ${error.message}`);
    },
  });

  const handleUpdateAction = () => {
    if (!selectedAction) return;
    
    updateActionMutation.mutate({
      id: selectedAction.id,
      status: updateStatus as "not_started" | "in_progress" | "partially_completed" | "completed",
      actionTaken: updateNotes,
      actualCompletionDate: updateCompletionDate ? new Date(updateCompletionDate) : undefined,
    });
  };

  const openUpdateDialog = (action: any) => {
    setSelectedAction(action);
    setUpdateStatus(action.status);
    setUpdateNotes(action.actionTaken || "");
    setUpdateCompletionDate(action.actualCompletionDate ? format(new Date(action.actualCompletionDate), "yyyy-MM-dd") : "");
    setIsUpdateDialogOpen(true);
  };

  // Filter actions
  const filteredActions = actionPlans?.filter((action) => {
    if (filterStatus !== "all" && action.status !== filterStatus) return false;
    if (filterRag !== "all" && action.ragStatus !== filterRag) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        action.issueDescription?.toLowerCase().includes(query) ||
        action.auditOrigin?.toLowerCase().includes(query) ||
        action.responsiblePersonName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800", icon: Clock },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
      partially_completed: { label: "Partial", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    };
    const config = statusConfig[status] || statusConfig.not_started;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getRagBadge = (rag: string) => {
    const ragConfig: Record<string, { label: string; color: string }> = {
      red: { label: "High Priority", color: "bg-red-500 text-white" },
      amber: { label: "Medium", color: "bg-amber-500 text-white" },
      green: { label: "Low", color: "bg-green-500 text-white" },
    };
    const config = ragConfig[rag] || ragConfig.amber;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const isOverdue = (targetDate: string | Date) => {
    return new Date(targetDate) < new Date();
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    if (!filteredActions || filteredActions.length === 0) {
      toast.error("No actions to download");
      return;
    }

    const headers = [
      "Issue Number",
      "Description",
      "Audit Origin",
      "Location",
      "Priority",
      "Assigned To",
      "Target Date",
      "Status",
      "Action Taken",
      "Completion Date",
    ];

    const rows = filteredActions.map((action) => [
      action.issueNumber || `ACT-${action.id}`,
      `"${(action.issueDescription || "").replace(/"/g, '""')}"`,
      action.auditOrigin || "",
      action.locationName || "",
      action.ragStatus || "",
      action.responsiblePersonName || "",
      action.targetCompletionDate ? format(new Date(action.targetCompletionDate), "yyyy-MM-dd") : "",
      action.status || "",
      `"${(action.actionTaken || "").replace(/"/g, '""')}"`,
      action.actualCompletionDate ? format(new Date(action.actualCompletionDate), "yyyy-MM-dd") : "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `action-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Action log downloaded");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to view action log</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Master Action Log</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all action items from audits across your organization
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadCSV} className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={generatePdfMutation.isPending} className="shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            {generatePdfMutation.isPending ? "Generating..." : "PDF"}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-md hover:shadow-lg transition-all duration-200">
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="partially_completed">Partially Completed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRag} onValueChange={setFilterRag}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="red">High Priority</SelectItem>
                <SelectItem value="amber">Medium</SelectItem>
                <SelectItem value="green">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{actionPlans?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {actionPlans?.filter((a) => a.status !== "completed" && isOverdue(a.targetCompletionDate)).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {actionPlans?.filter((a) => a.status === "in_progress").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {actionPlans?.filter((a) => a.status === "completed").length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>
            {filteredActions?.length || 0} actions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredActions && filteredActions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Issue #</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Audit Origin</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.map((action) => (
                  <TableRow key={action.id} className={action.status !== "completed" && isOverdue(action.targetCompletionDate) ? "bg-red-50" : ""}>
                    <TableCell className="font-mono text-sm font-medium">{action.issueNumber || `ACT-${action.id}`}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{action.issueDescription}</TableCell>
                    <TableCell>{action.auditOrigin}</TableCell>
                    <TableCell>{action.locationName}</TableCell>
                    <TableCell>{getRagBadge(action.ragStatus)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {action.responsiblePersonName || "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(action.targetCompletionDate), "dd MMM yyyy")}
                        {action.status !== "completed" && isOverdue(action.targetCompletionDate) && (
                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(action.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openUpdateDialog(action)}>
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No action items found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Action Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Action</DialogTitle>
            <DialogDescription>
              Create a new action item to track in the Master Action Log
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issue">Issue Description *</Label>
              <Textarea
                id="issue"
                placeholder="Describe the issue or action required..."
                value={newAction.issueDescription}
                onChange={(e) => setNewAction({ ...newAction, issueDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select
                  value={newAction.locationId ? newAction.locationId.toString() : ""}
                  onValueChange={(value) => setNewAction({ ...newAction, locationId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select
                  value={newAction.ragStatus}
                  onValueChange={(value: "red" | "amber" | "green") => setNewAction({ ...newAction, ragStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">High Priority (Red)</SelectItem>
                    <SelectItem value="amber">Medium (Amber)</SelectItem>
                    <SelectItem value="green">Low (Green)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={newAction.responsiblePersonId ? newAction.responsiblePersonId.toString() : ""}
                  onValueChange={(value) => setNewAction({ ...newAction, responsiblePersonId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Completion Date</Label>
                <Input
                  type="date"
                  value={newAction.targetCompletionDate}
                  onChange={(e) => setNewAction({ ...newAction, targetCompletionDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or context..."
                value={newAction.notes}
                onChange={(e) => setNewAction({ ...newAction, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAction} disabled={createActionMutation.isPending}>
              {createActionMutation.isPending ? "Creating..." : "Create Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Action</DialogTitle>
            <DialogDescription>
              Update the status and add notes for this action item
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium">{selectedAction.issueDescription}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  From: {selectedAction.auditOrigin} • Assigned to: {selectedAction.responsiblePersonName}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="partially_completed">Partially Completed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action Taken / Notes</Label>
                <Textarea
                  placeholder="Describe the action taken or add notes..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Input
                  type="date"
                  value={updateCompletionDate}
                  onChange={(e) => setUpdateCompletionDate(e.target.value)}
                  placeholder="Select completion date"
                />
                <p className="text-xs text-muted-foreground">Enter the date when this action was completed</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAction} disabled={updateActionMutation.isPending}>
              {updateActionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
