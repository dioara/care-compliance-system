import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AuditSchedules() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  const [formData, setFormData] = useState({
    auditTypeId: "",
    locationId: "",
    frequency: "monthly",
    nextAuditDue: "",
    reminderDays: "7",
    isActive: true,
  });

  const { data: schedules, isLoading, refetch } = trpc.audits.getSchedules.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  const { data: auditTypes } = trpc.audits.getAuditTypes.useQuery();
  const { data: locations } = trpc.locations.list.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  const createMutation = trpc.audits.createSchedule.useMutation({
    onSuccess: () => {
      toast.success("Audit schedule created successfully");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const updateMutation = trpc.audits.updateSchedule.useMutation({
    onSuccess: () => {
      toast.success("Audit schedule updated successfully");
      setIsEditOpen(false);
      refetch();
      setSelectedSchedule(null);
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const deleteMutation = trpc.audits.deleteSchedule.useMutation({
    onSuccess: () => {
      toast.success("Audit schedule deleted successfully");
      setIsDeleteOpen(false);
      refetch();
      setSelectedSchedule(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      auditTypeId: "",
      locationId: "",
      frequency: "monthly",
      nextAuditDue: "",
      reminderDays: "7",
      isActive: true,
    });
  };

  const handleCreate = () => {
    if (!user?.tenantId || !formData.auditTypeId || !formData.locationId || !formData.nextAuditDue) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      tenantId: user.tenantId,
      auditTypeId: parseInt(formData.auditTypeId),
      locationId: parseInt(formData.locationId),
      frequency: formData.frequency,
      nextAuditDue: new Date(formData.nextAuditDue),
      reminderDays: parseInt(formData.reminderDays),
      isActive: formData.isActive,
    });
  };

  const handleEdit = () => {
    if (!selectedSchedule) return;

    updateMutation.mutate({
      id: selectedSchedule.schedule.id,
      frequency: formData.frequency,
      nextAuditDue: formData.nextAuditDue ? new Date(formData.nextAuditDue) : undefined,
      reminderDays: parseInt(formData.reminderDays),
      isActive: formData.isActive,
    });
  };

  const handleDelete = () => {
    if (!selectedSchedule) return;
    deleteMutation.mutate({ id: selectedSchedule.schedule.id });
  };

  const openEditDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    setFormData({
      auditTypeId: schedule.schedule.auditTypeId.toString(),
      locationId: schedule.schedule.locationId.toString(),
      frequency: schedule.schedule.frequency,
      nextAuditDue: schedule.schedule.nextAuditDue
        ? new Date(schedule.schedule.nextAuditDue).toISOString().split("T")[0]
        : "",
      reminderDays: schedule.schedule.reminderDaysBefore?.toString() || "7",
      isActive: schedule.schedule.isActive,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsDeleteOpen(true);
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      daily: "bg-blue-100 text-blue-800",
      weekly: "bg-green-100 text-green-800",
      monthly: "bg-purple-100 text-purple-800",
      quarterly: "bg-orange-100 text-orange-800",
      annually: "bg-red-100 text-red-800",
    };
    return colors[frequency] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Audit Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Manage recurring audit schedules and reminders
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {schedules && schedules.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first audit schedule to automate recurring audits
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules?.map((item) => (
            <Card key={item.schedule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {item.auditType?.name || "Unknown Audit"}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadge(
                        item.schedule.frequency
                      )}`}
                    >
                      {item.schedule.frequency}
                    </span>
                    {item.schedule.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Paused
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location?.name || "All Locations"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Next Due:{" "}
                        {item.schedule.nextAuditDue
                          ? new Date(item.schedule.nextAuditDue).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Reminder: {item.schedule.reminderDaysBefore || 7} days before</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Audit Schedule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="auditType">Audit Type *</Label>
              <Select
                value={formData.auditTypeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, auditTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audit type" />
                </SelectTrigger>
                <SelectContent>
                  {auditTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location *</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) =>
                  setFormData({ ...formData, locationId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nextAuditDue">Next Audit Due *</Label>
              <Input
                id="nextAuditDue"
                type="date"
                value={formData.nextAuditDue}
                onChange={(e) =>
                  setFormData({ ...formData, nextAuditDue: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminderDays">Reminder Days Before</Label>
              <Input
                id="reminderDays"
                type="number"
                value={formData.reminderDays}
                onChange={(e) =>
                  setFormData({ ...formData, reminderDays: e.target.value })
                }
                min="1"
                max="30"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Audit Schedule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Audit Type</Label>
              <Input
                value={selectedSchedule?.auditType?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={selectedSchedule?.location?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-nextAuditDue">Next Audit Due</Label>
              <Input
                id="edit-nextAuditDue"
                type="date"
                value={formData.nextAuditDue}
                onChange={(e) =>
                  setFormData({ ...formData, nextAuditDue: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-reminderDays">Reminder Days Before</Label>
              <Input
                id="edit-reminderDays"
                type="number"
                value={formData.reminderDays}
                onChange={(e) =>
                  setFormData({ ...formData, reminderDays: e.target.value })
                }
                min="1"
                max="30"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Audit Schedule</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-1">
                  Are you sure you want to delete this schedule?
                </p>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete the schedule for{" "}
                  <strong>{selectedSchedule?.auditType?.name}</strong> at{" "}
                  <strong>{selectedSchedule?.location?.name}</strong>. This action
                  cannot be undone.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
