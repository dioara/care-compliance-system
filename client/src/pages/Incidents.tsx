import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Plus, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Incidents() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<number | null>(null);

  // Fetch data
  const { data: incidents = [], refetch } = trpc.incidents.getByTenant.useQuery({ limit: 100 });
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: serviceUsers = [] } = trpc.serviceUsers.list.useQuery();
  const { data: staff = [] } = trpc.staff.list.useQuery();

  // Mutations
  const createMutation = trpc.incidents.create.useMutation({
    onSuccess: () => {
      toast.success("Incident reported successfully");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create incident: ${error.message}`);
    },
  });

  const logNotificationMutation = trpc.incidents.logNotification.useMutation({
    onSuccess: () => {
      toast.success("Notification logged");
      refetch();
    },
  });

  const closeMutation = trpc.incidents.close.useMutation({
    onSuccess: () => {
      toast.success("Incident closed");
      refetch();
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    locationId: "",
    incidentNumber: `INC-${Date.now()}`,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    incidentType: "",
    severity: "",
    locationDescription: "",
    affectedPersonType: "",
    serviceUserId: "",
    affectedStaffId: "",
    affectedPersonName: "",
    staffInvolved: "",
    description: "",
    immediateActions: "",
    witnessStatements: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.locationId || !formData.incidentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      locationId: parseInt(formData.locationId),
      incidentNumber: formData.incidentNumber,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentType: formData.incidentType,
      severity: formData.severity || undefined,
      locationDescription: formData.locationDescription || undefined,
      affectedPersonType: formData.affectedPersonType || undefined,
      serviceUserId: formData.serviceUserId ? parseInt(formData.serviceUserId) : undefined,
      affectedStaffId: formData.affectedStaffId ? parseInt(formData.affectedStaffId) : undefined,
      affectedPersonName: formData.affectedPersonName || undefined,
      staffInvolved: formData.staffInvolved || undefined,
      description: formData.description || undefined,
      immediateActions: formData.immediateActions || undefined,
      witnessStatements: formData.witnessStatements || undefined,
    });
  };

  // Statistics
  const totalIncidents = incidents.length;
  const openIncidents = incidents.filter(i => i.status === "open" || i.status === "under_investigation").length;
  const cqcNotified = incidents.filter(i => i.reportedToCqc).length;
  const criticalIncidents = incidents.filter(i => i.severity === "critical" || i.severity === "high").length;

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "open": return <Clock className="h-4 w-4" />;
      case "under_investigation": return <AlertTriangle className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Reporting</h1>
          <p className="text-muted-foreground mt-2">
            Log and track incidents with automatic categorisation and regulatory reporting
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentNumber">Incident Number *</Label>
                  <Input
                    id="incidentNumber"
                    value={formData.incidentNumber}
                    onChange={(e) => setFormData({ ...formData, incidentNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentDate">Date *</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="incidentTime">Time</Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentType">Incident Type *</Label>
                  <Select value={formData.incidentType} onValueChange={(value) => setFormData({ ...formData, incidentType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="safeguarding">Safeguarding</SelectItem>
                      <SelectItem value="medication_error">Medication Error</SelectItem>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="pressure_ulcer">Pressure Ulcer</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="locationDescription">Location Description</Label>
                <Input
                  id="locationDescription"
                  placeholder="e.g., Main hallway, Room 12"
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="affectedPersonType">Affected Person Type</Label>
                  <Select value={formData.affectedPersonType} onValueChange={(value) => setFormData({ ...formData, affectedPersonType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_user">Service User</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.affectedPersonType === "service_user" && (
                  <div>
                    <Label htmlFor="serviceUserId">Service User</Label>
                    <Select value={formData.serviceUserId} onValueChange={(value) => setFormData({ ...formData, serviceUserId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service user" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceUsers.map((su: any) => (
                          <SelectItem key={su.id} value={su.id.toString()}>{su.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.affectedPersonType === "staff" && (
                  <div>
                    <Label htmlFor="affectedStaffId">Staff Member</Label>
                    <Select value={formData.affectedStaffId} onValueChange={(value) => setFormData({ ...formData, affectedStaffId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(formData.affectedPersonType === "visitor" || formData.affectedPersonType === "other") && (
                  <div>
                    <Label htmlFor="affectedPersonName">Person Name</Label>
                    <Input
                      id="affectedPersonName"
                      value={formData.affectedPersonName}
                      onChange={(e) => setFormData({ ...formData, affectedPersonName: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what happened..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="immediateActions">Immediate Actions Taken</Label>
                <Textarea
                  id="immediateActions"
                  placeholder="What actions were taken immediately?"
                  value={formData.immediateActions}
                  onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="witnessStatements">Witness Statements (JSON format)</Label>
                <Textarea
                  id="witnessStatements"
                  placeholder='[{"name": "John Doe", "statement": "I saw..."}]'
                  value={formData.witnessStatements}
                  onChange={(e) => setFormData({ ...formData, witnessStatements: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="staffInvolved">Staff Involved</Label>
                <Textarea
                  id="staffInvolved"
                  placeholder="List staff members involved"
                  value={formData.staffInvolved}
                  onChange={(e) => setFormData({ ...formData, staffInvolved: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting..." : "Submit Incident"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CQC Notified</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cqcNotified}</div>
            <p className="text-xs text-muted-foreground mt-1">Regulatory reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalIncidents}</div>
            <p className="text-xs text-muted-foreground mt-1">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No incidents reported yet</p>
            ) : (
              incidents.map((incident: any) => (
                <div key={incident.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setSelectedIncident(incident.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{incident.incidentNumber}</span>
                        <Badge variant="outline" className={`${getSeverityColor(incident.severity)} text-white`}>
                          {incident.severity || "Unknown"}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getStatusIcon(incident.status)}
                          {incident.status || "Open"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {incident.incidentType} • {new Date(incident.incidentDate).toLocaleDateString()} {incident.incidentTime && `at ${incident.incidentTime}`}
                      </p>
                      <p className="text-sm">{incident.description || "No description provided"}</p>
                      <div className="flex gap-2 mt-2">
                        {incident.reportedToCqc && <Badge variant="secondary">CQC Notified</Badge>}
                        {incident.reportedToCouncil && <Badge variant="secondary">Council Notified</Badge>}
                        {incident.reportedToIco && <Badge variant="secondary">ICO Notified</Badge>}
                        {incident.reportedToPolice && <Badge variant="secondary">Police Notified</Badge>}
                        {incident.reportedToFamily && <Badge variant="secondary">Family Notified</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
