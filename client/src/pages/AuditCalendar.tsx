import { useState, useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import enUS from "date-fns/locale/en-US";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  auditTypeId: number;
  auditTypeName: string;
  locationId: number;
  locationName: string;
  status: string;
  scheduledDate: Date;
}

export default function AuditCalendar() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAutoSuggestDialog, setShowAutoSuggestDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedAuditType, setSelectedAuditType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // Fetch calendar events
  const { data: calendarEvents = [], refetch } = trpc.audits.getCalendarEvents.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  // Fetch audit types for dropdown
  const { data: auditTypes = [] } = trpc.audits.getAuditTypes.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  // Fetch locations
  const { data: locations = [] } = trpc.locations.getAll.useQuery(
    { tenantId: user?.tenantId || 0 },
    { enabled: !!user?.tenantId }
  );

  // Transform calendar events for react-big-calendar
  const events: CalendarEvent[] = useMemo(() => {
    return calendarEvents.map((event) => ({
      id: event.id,
      title: `${event.auditTypeName} - ${event.locationName}`,
      start: new Date(event.scheduledDate),
      end: new Date(new Date(event.scheduledDate).getTime() + 2 * 60 * 60 * 1000), // 2 hours duration
      auditTypeId: event.auditTypeId,
      auditTypeName: event.auditTypeName,
      locationId: event.locationId,
      locationName: event.locationName,
      status: event.status,
      scheduledDate: new Date(event.scheduledDate),
    }));
  }, [calendarEvents]);

  // Create calendar event mutation
  const createEventMutation = trpc.audits.createCalendarEvent.useMutation({
    onSuccess: () => {
      toast.success("Audit scheduled successfully");
      refetch();
      setShowCreateDialog(false);
      setSelectedAuditType("");
      setSelectedLocation("");
    },
    onError: (error) => {
      toast.error(`Failed to schedule audit: ${error.message}`);
    },
  });

  // Auto-suggest dates mutation
  const autoSuggestMutation = trpc.audits.autoSuggestAuditDates.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created} audits scheduled for the next 12 months`);
      refetch();
      setShowAutoSuggestDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to auto-suggest dates: ${error.message}`);
    },
  });

  // Delete calendar event mutation
  const deleteEventMutation = trpc.audits.deleteCalendarEvent.useMutation({
    onSuccess: () => {
      toast.success("Audit removed from calendar");
      refetch();
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete audit: ${error.message}`);
    },
  });

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCreateEvent = (formData: FormData) => {
    const auditTypeId = parseInt(selectedAuditType);
    const locationId = parseInt(selectedLocation);
    const scheduledDate = formData.get("scheduledDate") as string;

    if (!user?.tenantId || !auditTypeId || !locationId || !scheduledDate) {
      toast.error("Please fill in all fields");
      return;
    }

    createEventMutation.mutate({
      tenantId: user.tenantId,
      auditTypeId,
      locationId,
      scheduledDate: new Date(scheduledDate),
    });
  };

  const handleAutoSuggest = () => {
    if (!user?.tenantId) return;

    autoSuggestMutation.mutate({
      tenantId: user.tenantId,
    });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent) return;

    deleteEventMutation.mutate({
      eventId: selectedEvent.id,
    });
  };

  // Event style getter for color coding
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6"; // blue

    if (event.status === "completed") {
      backgroundColor = "#16a34a"; // green
    } else if (event.status === "overdue") {
      backgroundColor = "#dc2626"; // red
    } else if (event.status === "in_progress") {
      backgroundColor = "#d97706"; // amber
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Calendar</h1>
            <p className="text-sm text-muted-foreground">
              Schedule and track upcoming audits across all locations
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={showAutoSuggestDialog} onOpenChange={setShowAutoSuggestDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Auto-Suggest
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Auto-Suggest Audit Dates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Automatically generate audit schedules for the next 12 months based on audit frequency requirements.
                  Monthly audits will be distributed across the month for better workload management.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAutoSuggestDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAutoSuggest} disabled={autoSuggestMutation.isPending}>
                    {autoSuggestMutation.isPending ? "Generating..." : "Generate Schedules"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Audit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Audit</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateEvent(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="auditTypeId">Audit Type</Label>
                  <Select value={selectedAuditType} onValueChange={setSelectedAuditType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select audit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {auditTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Scheduling..." : "Schedule Audit"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Audit Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Audit Type</Label>
                <p className="font-medium">{selectedEvent.auditTypeName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-medium">{selectedEvent.locationName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Scheduled Date</Label>
                <p className="font-medium">
                  {format(selectedEvent.scheduledDate, "PPP 'at' p")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="font-medium capitalize">{selectedEvent.status.replace("_", " ")}</p>
              </div>
              {user?.role === "admin" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteEvent}
                    disabled={deleteEventMutation.isPending}
                  >
                    {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
