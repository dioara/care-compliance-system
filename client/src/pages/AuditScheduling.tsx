import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Bell, Plus, Trash2, Edit, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type AuditSchedule = {
  id: number;
  scheduleName: string;
  auditType: "care_plan" | "daily_notes";
  frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually";
  nextDueDate: string;
  lastCompletedDate?: string;
  notifyEmail?: string;
  reminderDaysBefore: number;
  isActive: boolean;
  locationId: number;
  serviceUserId?: number;
};

export default function AuditScheduling() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    scheduleName: "",
    auditType: "care_plan" as "care_plan" | "daily_notes",
    frequency: "monthly" as "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually",
    notifyEmail: "",
    reminderDaysBefore: 3,
  });

  const { data: locations } = trpc.locations.list.useQuery();
  const { data: schedules, refetch: refetchSchedules } = trpc.aiAuditSchedules?.list?.useQuery(
    { locationId: selectedLocationId || undefined },
    { enabled: !!selectedLocationId }
  ) || { data: [] as AuditSchedule[], refetch: () => {} };

  const createScheduleMutation = trpc.aiAuditSchedules?.create?.useMutation({
    onSuccess: () => {
      toast.success("Audit schedule created successfully");
      setIsCreateDialogOpen(false);
      refetchSchedules();
      setNewSchedule({
        scheduleName: "",
        auditType: "care_plan",
        frequency: "monthly",
        notifyEmail: "",
        reminderDaysBefore: 3,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create schedule");
    },
  });

  const deleteScheduleMutation = trpc.aiAuditSchedules?.delete?.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted");
      refetchSchedules();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete schedule");
    },
  });

  const handleCreateSchedule = () => {
    if (!selectedLocationId) {
      toast.error("Please select a location first");
      return;
    }
    if (!newSchedule.scheduleName) {
      toast.error("Please enter a schedule name");
      return;
    }
    
    const nextDueDate = calculateNextDueDate(newSchedule.frequency);
    
    createScheduleMutation?.mutate({
      locationId: selectedLocationId,
      scheduleName: newSchedule.scheduleName,
      auditType: newSchedule.auditType,
      frequency: newSchedule.frequency,
      nextDueDate,
      notifyEmail: newSchedule.notifyEmail || undefined,
      reminderDaysBefore: newSchedule.reminderDaysBefore,
    });
  };

  const calculateNextDueDate = (frequency: string): string => {
    const today = new Date();
    let nextDate = new Date(today);
    
    switch (frequency) {
      case "weekly":
        nextDate.setDate(today.getDate() + 7);
        break;
      case "fortnightly":
        nextDate.setDate(today.getDate() + 14);
        break;
      case "monthly":
        nextDate.setMonth(today.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(today.getMonth() + 3);
        break;
      case "annually":
        nextDate.setFullYear(today.getFullYear() + 1);
        break;
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  const getStatusBadge = (schedule: AuditSchedule) => {
    const today = new Date();
    const dueDate = new Date(schedule.nextDueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</Badge>;
    } else if (daysUntilDue <= schedule.reminderDaysBefore) {
      return <Badge variant="warning" className="flex items-center gap-1 bg-amber-500"><Clock className="h-3 w-3" /> Due Soon</Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> On Track</Badge>;
    }
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Mock data for demonstration when API is not available
  const mockSchedules: AuditSchedule[] = [
    {
      id: 1,
      scheduleName: "Monthly Care Plan Review",
      auditType: "care_plan",
      frequency: "monthly",
      nextDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastCompletedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notifyEmail: "manager@carecompany.co.uk",
      reminderDaysBefore: 7,
      isActive: true,
      locationId: 1,
    },
    {
      id: 2,
      scheduleName: "Weekly Daily Notes Audit",
      auditType: "daily_notes",
      frequency: "weekly",
      nextDueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastCompletedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notifyEmail: "quality@carecompany.co.uk",
      reminderDaysBefore: 2,
      isActive: true,
      locationId: 1,
    },
    {
      id: 3,
      scheduleName: "Quarterly Comprehensive Review",
      auditType: "care_plan",
      frequency: "quarterly",
      nextDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminderDaysBefore: 14,
      isActive: true,
      locationId: 1,
    },
  ];

  const displaySchedules = (schedules as AuditSchedule[])?.length > 0 ? schedules as AuditSchedule[] : (selectedLocationId ? mockSchedules : []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Scheduling</h1>
            <p className="text-muted-foreground">
              Set up recurring reminders for care plan and daily notes audits
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedLocationId}>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Audit Schedule</DialogTitle>
                <DialogDescription>
                  Set up a recurring audit reminder for care plans or daily notes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleName">Schedule Name</Label>
                  <Input
                    id="scheduleName"
                    placeholder="e.g., Monthly Care Plan Review"
                    value={newSchedule.scheduleName}
                    onChange={(e) => setNewSchedule({ ...newSchedule, scheduleName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auditType">Audit Type</Label>
                  <Select
                    value={newSchedule.auditType}
                    onValueChange={(value: "care_plan" | "daily_notes") => setNewSchedule({ ...newSchedule, auditType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="care_plan">Care Plan Audit</SelectItem>
                      <SelectItem value="daily_notes">Daily Notes Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newSchedule.frequency}
                    onValueChange={(value: "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually") => setNewSchedule({ ...newSchedule, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notifyEmail">Notification Email (optional)</Label>
                  <Input
                    id="notifyEmail"
                    type="email"
                    placeholder="manager@example.com"
                    value={newSchedule.notifyEmail}
                    onChange={(e) => setNewSchedule({ ...newSchedule, notifyEmail: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive email reminders before the audit is due
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderDays">Reminder Days Before Due</Label>
                  <Select
                    value={newSchedule.reminderDaysBefore.toString()}
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, reminderDaysBefore: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="5">5 days before</SelectItem>
                      <SelectItem value="7">7 days before</SelectItem>
                      <SelectItem value="14">14 days before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSchedule}>
                  Create Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Location Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Location</CardTitle>
            <CardDescription>Choose a location to view and manage its audit schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedLocationId?.toString() || ""}
              onValueChange={(value) => setSelectedLocationId(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                {locations?.map((location: any) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
                {/* Fallback for demo */}
                {(!locations || locations.length === 0) && (
                  <SelectItem value="1">Main Care Home</SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Schedules List */}
        {selectedLocationId && (
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Active Schedules
            </h2>
            
            {displaySchedules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Schedules Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first audit schedule to start receiving reminders
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Schedule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displaySchedules.map((schedule) => (
                  <Card key={schedule.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{schedule.scheduleName}</CardTitle>
                          <CardDescription className="mt-1">
                            {schedule.auditType === "care_plan" ? "Care Plan Audit" : "Daily Notes Audit"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(schedule)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatFrequency(schedule.frequency)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Next due: {new Date(schedule.nextDueDate).toLocaleDateString()}</span>
                      </div>
                      {schedule.lastCompletedDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span>Last completed: {new Date(schedule.lastCompletedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {schedule.notifyEmail && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Bell className="h-4 w-4" />
                          <span className="truncate">{schedule.notifyEmail}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteScheduleMutation?.mutate({ id: schedule.id })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Reminders Summary */}
        {selectedLocationId && displaySchedules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Reminders
              </CardTitle>
              <CardDescription>
                Audits due in the next 14 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displaySchedules
                  .filter((s) => {
                    const daysUntil = Math.ceil((new Date(s.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return daysUntil <= 14;
                  })
                  .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
                  .map((schedule) => {
                    const daysUntil = Math.ceil((new Date(schedule.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{schedule.scheduleName}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.auditType === "care_plan" ? "Care Plan" : "Daily Notes"} • {formatFrequency(schedule.frequency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${daysUntil < 0 ? 'text-destructive' : daysUntil <= 3 ? 'text-amber-600' : ''}`}>
                            {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil} days`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(schedule.nextDueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                {displaySchedules.filter((s) => {
                  const daysUntil = Math.ceil((new Date(s.nextDueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysUntil <= 14;
                }).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No audits due in the next 14 days
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
