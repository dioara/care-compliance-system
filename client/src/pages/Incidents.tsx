import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import { RichTextEditor, RichTextDisplay } from "@/components/ui/rich-text-editor";
import { IncidentAttachments, IncidentSignatures } from "@/components/IncidentAttachmentsSignatures";

import { Spinner, Warning, FileText, User, Shield, Phone, Buildings, Stethoscope, ClipboardText, Users, Eye, FileXls, Plus, CheckCircle, Clock, XCircle, DownloadSimple, MapPin, CalendarBlank, WarningCircle, Envelope, CaretRight, Pulse } from "@phosphor-icons/react";
// Incident types with icons and descriptions
const INCIDENT_TYPES = [
  { value: "fall", label: "Fall", description: "Slips, trips, and falls", icon: "🚶" },
  { value: "medication_error", label: "Medication Error", description: "Administration or dispensing errors", icon: "💊" },
  { value: "safeguarding", label: "Safeguarding Concern", description: "Abuse, neglect, or exploitation", icon: "🛡️" },
  { value: "pressure_ulcer", label: "Pressure Ulcer", description: "New or deteriorating pressure injuries", icon: "🩹" },
  { value: "infection", label: "Infection", description: "Healthcare-associated infections", icon: "🦠" },
  { value: "challenging_behaviour", label: "Challenging Behaviour", description: "Aggression or self-harm", icon: "⚠️" },
  { value: "missing_person", label: "Missing Person", description: "Absconding or unexplained absence", icon: "🔍" },
  { value: "equipment_failure", label: "Equipment Failure", description: "Medical device or equipment issues", icon: "🔧" },
  { value: "near_miss", label: "Near Miss", description: "Potential incident that was prevented", icon: "🎯" },
  { value: "complaint", label: "Complaint", description: "Formal complaint received", icon: "📝" },
  { value: "death", label: "Death", description: "Expected or unexpected death", icon: "🕊️" },
  { value: "other", label: "Other", description: "Other incident type", icon: "📋" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-blue-500", description: "Minor impact, no harm" },
  { value: "medium", label: "Medium", color: "bg-yellow-500", description: "Moderate impact, minor harm" },
  { value: "high", label: "High", color: "bg-orange-500", description: "Significant impact, serious harm" },
  { value: "critical", label: "Critical", color: "bg-red-500", description: "Severe impact, life-threatening" },
];

export default function Incidents() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Check URL params to auto-open report dialog
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('report') === 'true') {
      setIsCreateDialogOpen(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formStep, setFormStep] = useState(1);
  const intentionalSubmitRef = useRef(false); // Track if submission is intentional
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    actionDescription: "",
    assignedToId: "",
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days
  });

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
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create incident: ${error.message}`);
    },
  });

  const logNotificationMutation = trpc.incidents.logNotification.useMutation({
    onSuccess: (updatedIncident) => {
      toast.success("Notification logged");
      // Update the selected incident with the latest data
      if (selectedIncident && updatedIncident) {
        setSelectedIncident(updatedIncident);
      }
      refetch();
    },
  });

  const closeMutation = trpc.incidents.close.useMutation({
    onSuccess: () => {
      toast.success("Incident closed");
      setSelectedIncident(null);
      refetch();
    },
  });

  const generatePDFMutation = trpc.incidents.generatePDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF report generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const generateSinglePDFMutation = trpc.incidents.generateSinglePDF.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Incident PDF generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const generateExcelMutation = trpc.incidents.generateExcel.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Excel report generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate Excel: ${error.message}`);
    },
  });

  const addFollowUpMutation = trpc.incidents.addFollowUpAction.useMutation({
    onSuccess: () => {
      toast.success("Follow-up action added to Master Action Log");
      setShowFollowUpDialog(false);
      setFollowUpData({
        actionDescription: "",
        assignedToId: "",
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error(`Failed to add follow-up action: ${error.message}`);
    },
  });

  // Form state - comprehensive incident form
  const [formData, setFormData] = useState({
    // Basic Information
    locationId: "",
    incidentNumber: `INC-${Date.now()}`,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    incidentType: "",
    severity: "",
    
    // Location Details
    locationDescription: "",
    exactLocation: "",
    
    // Affected Person
    affectedPersonType: "",
    serviceUserId: "",
    affectedStaffId: "",
    affectedPersonName: "",
    affectedPersonDob: "",
    affectedPersonContact: "",
    
    // Incident Details (rich text)
    description: "",
    antecedents: "", // What happened before
    immediateActions: "",
    
    // Injuries & Treatment
    injuriesDescription: "",
    injurySeverity: "",
    firstAidGiven: false,
    firstAidDetails: "",
    medicalAttentionRequired: false,
    medicalAttentionDetails: "",
    hospitalAttendance: false,
    hospitalName: "",
    
    // Witnesses
    witnessesPresent: false,
    witnessStatements: "",
    
    // Staff Involvement
    staffInvolved: "",
    staffOnDuty: "",
    reportedBy: "",
    
    // Notifications
    familyNotified: false,
    familyNotificationDetails: "",
    gpNotified: false,
    gpNotificationDetails: "",
    
    // Risk Assessment
    riskAssessmentRequired: false,
    riskAssessmentNotes: "",
    
    // Follow-up Actions
    followUpRequired: false,
    followUpActions: "",
    preventativeMeasures: "",
    lessonsLearned: "",
  });

  const resetForm = () => {
    setFormData({
      locationId: "",
      incidentNumber: `INC-${Date.now()}`,
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: new Date().toTimeString().slice(0, 5),
      incidentType: "",
      severity: "",
      locationDescription: "",
      exactLocation: "",
      affectedPersonType: "",
      serviceUserId: "",
      affectedStaffId: "",
      affectedPersonName: "",
      affectedPersonDob: "",
      affectedPersonContact: "",
      description: "",
      antecedents: "",
      immediateActions: "",
      injuriesDescription: "",
      injurySeverity: "",
      firstAidGiven: false,
      firstAidDetails: "",
      medicalAttentionRequired: false,
      medicalAttentionDetails: "",
      hospitalAttendance: false,
      hospitalName: "",
      witnessesPresent: false,
      witnessStatements: "",
      staffInvolved: "",
      staffOnDuty: "",
      reportedBy: "",
      familyNotified: false,
      familyNotificationDetails: "",
      gpNotified: false,
      gpNotificationDetails: "",
      riskAssessmentRequired: false,
      riskAssessmentNotes: "",
      followUpRequired: false,
      followUpActions: "",
      preventativeMeasures: "",
      lessonsLearned: "",
    });
    setFormStep(1);
  };

  // Validate current step before moving to next
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.locationId) {
          toast.error("Please select a location");
          return false;
        }
        if (!formData.incidentType) {
          toast.error("Please select an incident type");
          return false;
        }
        if (!formData.severity) {
          toast.error("Please select a severity level");
          return false;
        }
        if (!formData.incidentDate) {
          toast.error("Please enter the incident date");
          return false;
        }
        return true;
      case 2:
        if (!formData.description) {
          toast.error("Please provide an incident description");
          return false;
        }
        return true;
      case 3:
        // Step 3 is optional (injuries), no required fields
        return true;
      case 4:
        // Step 4 is optional (follow-up), no required fields
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(formStep)) {
      setFormStep(formStep + 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // CRITICAL: Triple-check submission is intentional
    // 1. Must be on step 4
    // 2. Must have intentionalSubmitRef set to true (set by Submit button click)
    if (formStep !== 4) {
      console.warn(`[Incident Form] Blocked submission attempt on step ${formStep}. Not advancing.`);
      return; // Don't even advance - just block completely
    }
    
    // Check if this is an intentional submission from the Submit button
    if (!intentionalSubmitRef.current) {
      console.warn(`[Incident Form] Blocked unintentional submission on step ${formStep}`);
      return;
    }
    
    // Reset the ref for next submission
    intentionalSubmitRef.current = false;
    
    if (!formData.locationId || !formData.incidentType || !formData.severity) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      locationId: parseInt(formData.locationId),
      incidentNumber: formData.incidentNumber,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentType: formData.incidentType,
      severity: formData.severity,
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
  const openIncidents = incidents.filter((i: any) => i.status === "open" || i.status === "under_investigation").length;
  const cqcNotified = incidents.filter((i: any) => i.reportedToCqc).length;
  const criticalIncidents = incidents.filter((i: any) => i.severity === "critical" || i.severity === "high").length;
  const thisMonthIncidents = incidents.filter((i: any) => {
    const date = new Date(i.incidentDate);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "open": return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50"><Clock className="h-3 w-3 mr-1" weight="bold" />Open</Badge>;
      case "under_investigation": return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50"><Warning className="h-3 w-3 mr-1" weight="bold" />Investigating</Badge>;
      case "resolved": return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50"><CheckCircle className="h-3 w-3 mr-1" weight="bold" />Resolved</Badge>;
      case "closed": return <Badge variant="outline" className="border-gray-500 text-gray-600 bg-gray-50"><XCircle className="h-3 w-3 mr-1" weight="bold" />Closed</Badge>;
      default: return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  // Apply both status and location filters
  const filteredIncidents = incidents.filter((i: any) => {
    const statusMatch = activeTab === "all" || i.status === activeTab;
    const locationMatch = !filterLocationId || i.locationId === filterLocationId;
    return statusMatch && locationMatch;
  });

  return (
    <div className="space-y-6 md:space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center shadow-sm shrink-0">
            <Warning className="h-5 w-5 md:h-6 md:w-6 text-orange-500" weight="bold" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Incident Reporting
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
              Log and track incidents with comprehensive documentation, automatic categorisation, and regulatory reporting compliance.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Button
            variant="outline"
            onClick={() => generatePDFMutation.mutate({})}
            disabled={generatePDFMutation.isPending}
            className="shadow-sm"
          >
            {generatePDFMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => generateExcelMutation.mutate({})}
            disabled={generateExcelMutation.isPending}
            className="shadow-sm"
          >
            {generateExcelMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileXls className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-shadow">
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                  <Warning className="h-6 w-6 text-orange-500" weight="bold" />
                  Report New Incident
                </DialogTitle>
                <DialogDescription>
                  Complete this form to document an incident. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              {/* Progress Steps */}
              <div className="flex items-center justify-center py-4">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setFormStep(step)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        formStep >= step 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step}
                    </button>
                    {step < 4 && (
                      <div className={`w-16 h-1 mx-2 rounded ${formStep > step ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 md:gap-6 lg:gap-8 text-sm text-muted-foreground mb-6">
                <span className={formStep === 1 ? 'text-primary font-medium' : ''}>Basic Info</span>
                <span className={formStep === 2 ? 'text-primary font-medium' : ''}>Details</span>
                <span className={formStep === 3 ? 'text-primary font-medium' : ''}>Injuries</span>
                <span className={formStep === 4 ? 'text-primary font-medium' : ''}>Follow-up</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={(e) => {
                // Prevent Enter key from submitting the form on steps 1-3
                if (e.key === 'Enter' && formStep !== 4 && e.target instanceof HTMLInputElement) {
                  e.preventDefault();
                }
              }}>
                {/* Step 1: Basic Information */}
                {formStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Incident Number */}
                      <div className="space-y-2">
                        <Label htmlFor="incidentNumber" className="text-sm font-medium">
                          Incident Reference *
                        </Label>
                        <Input
                          id="incidentNumber"
                          value={formData.incidentNumber}
                          onChange={(e) => setFormData({ ...formData, incidentNumber: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                          <Buildings className="h-4 w-4" weight="bold" />
                          Location *
                        </Label>
                        <Select value={formData.locationId} onValueChange={(value) => setFormData({ ...formData, locationId: value })}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((loc: any) => (
                              <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date */}
                      <div className="space-y-2">
                        <Label htmlFor="incidentDate" className="text-sm font-medium flex items-center gap-2">
                          <CalendarBlank className="h-4 w-4" weight="bold" />
                          Date of Incident *
                        </Label>
                        <Input
                          id="incidentDate"
                          type="date"
                          value={formData.incidentDate}
                          onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>

                      {/* Time */}
                      <div className="space-y-2">
                        <Label htmlFor="incidentTime" className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" weight="bold" />
                          Time of Incident
                        </Label>
                        <Input
                          id="incidentTime"
                          type="time"
                          value={formData.incidentTime}
                          onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Incident Type Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Incident Type *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-3">
                        {INCIDENT_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, incidentType: type.value })}
                            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                              formData.incidentType === type.value
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="text-2xl">{type.icon}</span>
                            <div className="mt-2 font-medium text-sm">{type.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Severity Level *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3">
                        {SEVERITY_LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, severity: level.value })}
                            className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                              formData.severity === level.value
                                ? 'border-primary shadow-md'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full ${level.color} mx-auto mb-2`} />
                            <div className="font-medium text-sm">{level.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">{level.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Exact Location */}
                    <div className="space-y-2">
                      <Label htmlFor="locationDescription" className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" weight="bold" />
                        Exact Location of Incident
                      </Label>
                      <Input
                        id="locationDescription"
                        placeholder="e.g., Room 12, Main hallway near reception, Garden area"
                        value={formData.locationDescription}
                        onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Incident Details */}
                {formStep === 2 && (
                  <div className="space-y-6">
                    {/* Affected Person */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5" weight="bold" />
                          Affected Person
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Person Type</Label>
                            <Select value={formData.affectedPersonType} onValueChange={(value) => setFormData({ ...formData, affectedPersonType: value, serviceUserId: "", affectedStaffId: "", affectedPersonName: "" })}>
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="service_user">Service User</SelectItem>
                                <SelectItem value="staff">Staff Member</SelectItem>
                                <SelectItem value="visitor">Visitor</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.affectedPersonType === "service_user" && (
                            <div className="space-y-2">
                              <Label>Service User</Label>
                              <Select value={formData.serviceUserId} onValueChange={(value) => setFormData({ ...formData, serviceUserId: value })}>
                                <SelectTrigger className="h-11">
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
                            <div className="space-y-2">
                              <Label>Staff Member</Label>
                              <Select value={formData.affectedStaffId} onValueChange={(value) => setFormData({ ...formData, affectedStaffId: value })}>
                                <SelectTrigger className="h-11">
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
                            <div className="space-y-2">
                              <Label>Person Name</Label>
                              <Input
                                value={formData.affectedPersonName}
                                onChange={(e) => setFormData({ ...formData, affectedPersonName: e.target.value })}
                                placeholder="Enter full name"
                                className="h-11"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Incident Description */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        What Happened? *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Provide a detailed, factual account of the incident. Include who was involved, what happened, and the sequence of events.
                      </p>
                      <RichTextEditor
                        value={formData.description}
                        onChange={(value) => setFormData({ ...formData, description: value })}
                        placeholder="Describe the incident in detail..."
                        minHeight="180px"
                      />
                    </div>

                    {/* Antecedents */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Events Leading Up to Incident
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        What was happening before the incident? Any contributing factors or warning signs?
                      </p>
                      <RichTextEditor
                        value={formData.antecedents}
                        onChange={(value) => setFormData({ ...formData, antecedents: value })}
                        placeholder="Describe what happened before the incident..."
                        minHeight="120px"
                      />
                    </div>

                    {/* Immediate Actions */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Immediate Actions Taken
                      </Label>
                      <RichTextEditor
                        value={formData.immediateActions}
                        onChange={(value) => setFormData({ ...formData, immediateActions: value })}
                        placeholder="What actions were taken immediately after the incident?"
                        minHeight="120px"
                      />
                    </div>

                    {/* Staff Involved */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Staff Involved
                        </Label>
                        <Textarea
                          value={formData.staffInvolved}
                          onChange={(e) => setFormData({ ...formData, staffInvolved: e.target.value })}
                          placeholder="List staff members involved or present"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Reported By
                        </Label>
                        <Input
                          value={formData.reportedBy}
                          onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                          placeholder="Name of person reporting"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Injuries & Treatment */}
                {formStep === 3 && (
                  <div className="space-y-6">
                    {/* Injuries */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Stethoscope className="h-5 w-5" weight="bold" />
                          Injuries & Medical Treatment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Description of Injuries</Label>
                          <RichTextEditor
                            value={formData.injuriesDescription}
                            onChange={(value) => setFormData({ ...formData, injuriesDescription: value })}
                            placeholder="Describe any injuries sustained (or state 'No injuries')"
                            minHeight="100px"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                              <Label className="font-medium">First Aid Given</Label>
                              <p className="text-xs text-muted-foreground">Was first aid administered?</p>
                            </div>
                            <Switch
                              checked={formData.firstAidGiven}
                              onCheckedChange={(checked) => setFormData({ ...formData, firstAidGiven: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                              <Label className="font-medium">Medical Attention</Label>
                              <p className="text-xs text-muted-foreground">Required medical attention?</p>
                            </div>
                            <Switch
                              checked={formData.medicalAttentionRequired}
                              onCheckedChange={(checked) => setFormData({ ...formData, medicalAttentionRequired: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                              <Label className="font-medium">Hospital Visit</Label>
                              <p className="text-xs text-muted-foreground">Attended hospital?</p>
                            </div>
                            <Switch
                              checked={formData.hospitalAttendance}
                              onCheckedChange={(checked) => setFormData({ ...formData, hospitalAttendance: checked })}
                            />
                          </div>
                        </div>

                        {formData.firstAidGiven && (
                          <div className="space-y-2">
                            <Label>First Aid Details</Label>
                            <Textarea
                              value={formData.firstAidDetails}
                              onChange={(e) => setFormData({ ...formData, firstAidDetails: e.target.value })}
                              placeholder="Describe first aid treatment given"
                              rows={2}
                            />
                          </div>
                        )}

                        {formData.hospitalAttendance && (
                          <div className="space-y-2">
                            <Label>Hospital Name</Label>
                            <Input
                              value={formData.hospitalName}
                              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                              placeholder="Name of hospital attended"
                              className="h-11"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Witnesses */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="h-5 w-5" weight="bold" />
                          Witnesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div>
                            <Label className="font-medium">Witnesses Present</Label>
                            <p className="text-xs text-muted-foreground">Were there any witnesses to the incident?</p>
                          </div>
                          <Switch
                            checked={formData.witnessesPresent}
                            onCheckedChange={(checked) => setFormData({ ...formData, witnessesPresent: checked })}
                          />
                        </div>

                        {formData.witnessesPresent && (
                          <div className="space-y-2">
                            <Label>Witness Statements</Label>
                            <RichTextEditor
                              value={formData.witnessStatements}
                              onChange={(value) => setFormData({ ...formData, witnessStatements: value })}
                              placeholder="Record witness names and their statements"
                              minHeight="150px"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 4: Follow-up & Notifications */}
                {formStep === 4 && (
                  <div className="space-y-6">
                    {/* Notifications */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Phone className="h-5 w-5" weight="bold" />
                          Notifications Made
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                              <Label className="font-medium">Family/Next of Kin</Label>
                              <p className="text-xs text-muted-foreground">Has family been notified?</p>
                            </div>
                            <Switch
                              checked={formData.familyNotified}
                              onCheckedChange={(checked) => setFormData({ ...formData, familyNotified: checked })}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                            <div>
                              <Label className="font-medium">GP/Doctor</Label>
                              <p className="text-xs text-muted-foreground">Has GP been notified?</p>
                            </div>
                            <Switch
                              checked={formData.gpNotified}
                              onCheckedChange={(checked) => setFormData({ ...formData, gpNotified: checked })}
                            />
                          </div>
                        </div>

                        {formData.familyNotified && (
                          <div className="space-y-2">
                            <Label>Family Notification Details</Label>
                            <Textarea
                              value={formData.familyNotificationDetails}
                              onChange={(e) => setFormData({ ...formData, familyNotificationDetails: e.target.value })}
                              placeholder="Who was contacted, when, and what was discussed"
                              rows={2}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Risk Assessment */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5" weight="bold" />
                          Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                          <div>
                            <Label className="font-medium">Risk Assessment Required</Label>
                            <p className="text-xs text-muted-foreground">Does this incident require a risk assessment review?</p>
                          </div>
                          <Switch
                            checked={formData.riskAssessmentRequired}
                            onCheckedChange={(checked) => setFormData({ ...formData, riskAssessmentRequired: checked })}
                          />
                        </div>

                        {formData.riskAssessmentRequired && (
                          <div className="space-y-2">
                            <Label>Risk Assessment Notes</Label>
                            <Textarea
                              value={formData.riskAssessmentNotes}
                              onChange={(e) => setFormData({ ...formData, riskAssessmentNotes: e.target.value })}
                              placeholder="Notes for risk assessment review"
                              rows={3}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Follow-up Actions */}
                    <Card className="border-2">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ClipboardText className="h-5 w-5" weight="bold" />
                          Follow-up Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Preventative Measures</Label>
                          <RichTextEditor
                            value={formData.preventativeMeasures}
                            onChange={(value) => setFormData({ ...formData, preventativeMeasures: value })}
                            placeholder="What measures can be taken to prevent recurrence?"
                            minHeight="100px"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Lessons Learned</Label>
                          <RichTextEditor
                            value={formData.lessonsLearned}
                            onChange={(value) => setFormData({ ...formData, lessonsLearned: value })}
                            placeholder="Key learnings from this incident"
                            minHeight="100px"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => formStep > 1 ? setFormStep(formStep - 1) : setIsCreateDialogOpen(false)}
                  >
                    {formStep > 1 ? "Previous" : "Cancel"}
                  </Button>
                  
                  {formStep < 4 ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNextStep();
                      }}
                    >
                      Next
                      <CaretRight className="ml-2 h-4 w-4" weight="bold" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending} 
                      className="min-w-[150px]"
                      onClick={() => { intentionalSubmitRef.current = true; }}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" weight="bold" />
                          Submit Incident
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Incidents</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Pulse className="h-4 w-4 text-gray-600" weight="bold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalIncidents}</div>
            <p className="text-xs text-gray-500 mt-1">All time records</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" weight="bold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{openIncidents}</div>
            <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical/High</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Warning className="h-4 w-4 text-gray-600" weight="bold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{criticalIncidents}</div>
            <p className="text-xs text-gray-500 mt-1">High priority</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <CalendarBlank className="h-4 w-4 text-gray-600" weight="bold" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{thisMonthIncidents}</div>
            <p className="text-xs text-gray-500 mt-1">Current month</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CQC Notified</CardTitle>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{cqcNotified}</div>
            <p className="text-xs text-gray-500 mt-1">Regulatory reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Incident Records</CardTitle>
              <CardDescription>View and manage all reported incidents</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Location Filter */}
              <Select
                value={filterLocationId?.toString() || "all"}
                onValueChange={(value) => setFilterLocationId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" weight="bold" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-background border">
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="open" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Open
                  </TabsTrigger>
                  <TabsTrigger value="under_investigation" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    Investigating
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="data-[state=active]:bg-gray-500 data-[state=active]:text-white">
                    Closed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground">No incidents found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "all" ? "No incidents have been reported yet" : `No ${activeTab.replace("_", " ")} incidents`}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredIncidents.map((incident: any) => (
                <div 
                  key={incident.id} 
                  className="p-5 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-lg">{incident.incidentNumber}</span>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity || "Unknown"}
                        </Badge>
                        {getStatusBadge(incident.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="h-3.5 w-3.5" weight="bold" />
                          {new Date(incident.incidentDate).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                          {incident.incidentTime && ` at ${incident.incidentTime}`}
                        </span>
                        <span className="capitalize flex items-center gap-1">
                          <WarningCircle className="h-3.5 w-3.5" weight="bold" />
                          {incident.incidentType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        {incident.description ? (
                          <span dangerouslySetInnerHTML={{ __html: incident.description.replace(/<[^>]*>/g, ' ').substring(0, 200) }} />
                        ) : (
                          <span className="text-muted-foreground italic">No description provided</span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {incident.reportedToCqc && <Badge variant="secondary" className="text-xs">CQC Notified</Badge>}
                        {incident.reportedToCouncil && <Badge variant="secondary" className="text-xs">Council Notified</Badge>}
                        {incident.reportedToPolice && <Badge variant="secondary" className="text-xs">Police Notified</Badge>}
                        {incident.reportedToFamily && <Badge variant="secondary" className="text-xs">Family Notified</Badge>}
                      </div>
                    </div>
                    <CaretRight className="h-5 w-5 text-muted-foreground flex-shrink-0" weight="bold" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Detail Dialog - Enhanced with full width, notification tracking, and edit capability */}
      <Dialog open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedIncident && (
            <>
              <DialogHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-semibold">
                      {selectedIncident.incidentNumber}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Reported on {new Date(selectedIncident.incidentDate).toLocaleDateString('en-GB', { 
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                      {selectedIncident.incidentTime && ` at ${selectedIncident.incidentTime}`}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(selectedIncident.severity)}>
                      {selectedIncident.severity}
                    </Badge>
                    {getStatusBadge(selectedIncident.status)}
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Incident Type */}
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="text-xl sm:text-2xl lg:text-3xl">
                      {INCIDENT_TYPES.find(t => t.value === selectedIncident.incidentType)?.icon || "📋"}
                    </div>
                    <div>
                      <div className="font-medium capitalize text-lg">
                        {selectedIncident.incidentType?.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {INCIDENT_TYPES.find(t => t.value === selectedIncident.incidentType)?.description}
                      </div>
                    </div>
                  </div>

                  {/* Location & Affected Person */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" weight="bold" />
                        Location
                      </div>
                      <div className="font-medium">
                        {locations.find((l: any) => l.id === selectedIncident.locationId)?.name || 'Unknown Location'}
                      </div>
                      {selectedIncident.locationDescription && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {selectedIncident.locationDescription}
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <User className="h-4 w-4" />
                        Affected Person
                      </div>
                      <div className="font-medium capitalize">
                        {selectedIncident.affectedPersonName || selectedIncident.affectedPersonType?.replace(/_/g, ' ') || 'Not specified'}
                      </div>
                      {selectedIncident.affectedPersonType && (
                        <div className="text-sm text-muted-foreground mt-1 capitalize">
                          Type: {selectedIncident.affectedPersonType.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedIncident.description && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Description of Incident
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <RichTextDisplay content={selectedIncident.description} />
                      </div>
                    </div>
                  )}

                  {/* Immediate Actions */}
                  {selectedIncident.immediateActions && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Pulse className="h-4 w-4" weight="bold" />
                        Immediate Actions Taken
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <RichTextDisplay content={selectedIncident.immediateActions} />
                      </div>
                    </div>
                  )}

                  {/* Injuries & Treatment */}
                  {(selectedIncident.injuriesDescription || selectedIncident.firstAidGiven || selectedIncident.hospitalAttendance) && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Injuries & Medical Treatment
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                        {selectedIncident.injuriesDescription && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Injuries</div>
                            <RichTextDisplay content={selectedIncident.injuriesDescription} />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {selectedIncident.firstAidGiven && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" weight="bold" /> First Aid Given
                            </Badge>
                          )}
                          {selectedIncident.medicalAttentionRequired && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <WarningCircle className="h-3 w-3 mr-1" weight="bold" /> Medical Attention Required
                            </Badge>
                          )}
                          {selectedIncident.hospitalAttendance && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <Buildings className="h-3 w-3 mr-1" weight="bold" /> Hospital Attendance
                            </Badge>
                          )}
                        </div>
                        {selectedIncident.hospitalName && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Hospital:</span> {selectedIncident.hospitalName}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Witnesses */}
                  {selectedIncident.witnessStatements && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Witness Statements
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <RichTextDisplay content={selectedIncident.witnessStatements} />
                      </div>
                    </div>
                  )}

                  {/* Investigation Notes */}
                  {selectedIncident.investigationNotes && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <ClipboardText className="h-4 w-4" weight="bold" />
                        Investigation Notes
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <RichTextDisplay content={selectedIncident.investigationNotes} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Notifications & Actions */}
                <div className="space-y-6">
                  {/* Notification Tracking */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4" weight="bold" />
                        Notification Status
                      </CardTitle>
                      <CardDescription>Track who has been notified about this incident</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { key: 'reportedToCqc', atKey: 'cqcNotifiedAt', notifType: 'cqc' as const, label: 'CQC', icon: Shield, color: 'blue' },
                        { key: 'reportedToCouncil', atKey: 'councilNotifiedAt', notifType: 'council' as const, label: 'Local Authority / Council', icon: Buildings, color: 'purple' },
                        { key: 'reportedToPolice', atKey: 'policeNotifiedAt', notifType: 'police' as const, label: 'Police', icon: Shield, color: 'slate' },
                        { key: 'reportedToFamily', atKey: 'familyNotifiedAt', notifType: 'family' as const, label: 'Family / Next of Kin', icon: Users, color: 'amber' },
                        { key: 'reportedToIco', atKey: 'icoNotifiedAt', notifType: 'ico' as const, label: 'ICO (Data Breach)', icon: Envelope, color: 'teal' },
                      ].map(({ key, atKey, notifType, label, icon: Icon, color }) => {
                        const isNotified = selectedIncident[key];
                        const notifiedAt = selectedIncident[atKey];
                        const canEdit = selectedIncident.status !== 'closed';
                        
                        return (
                          <div 
                            key={key}
                            className={`p-3 rounded-lg border transition-all ${
                              isNotified 
                                ? `bg-${color}-50 border-${color}-200` 
                                : 'bg-muted/30 border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${isNotified ? `text-${color}-600` : 'text-muted-foreground'}`} />
                                <span className={`text-sm font-medium ${isNotified ? `text-${color}-700` : ''}`}>{label}</span>
                              </div>
                              {canEdit ? (
                                <Switch
                                  checked={isNotified}
                                  onCheckedChange={(checked) => {
                                    logNotificationMutation.mutate({
                                      id: selectedIncident.id,
                                      notificationType: notifType,
                                      notified: checked,
                                    });
                                  }}
                                  disabled={logNotificationMutation.isPending}
                                />
                              ) : (
                                isNotified && <CheckCircle className="h-4 w-4 text-green-600" weight="bold" />
                              )}
                            </div>
                            {isNotified && notifiedAt && (
                              <div className="text-xs text-muted-foreground mt-1 ml-6">
                                Notified: {new Date(notifiedAt).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Reported By */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Reported By</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <div className="font-medium">{selectedIncident.reportedBy || 'Not specified'}</div>
                        <div className="text-muted-foreground mt-1">
                          {new Date(selectedIncident.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Follow-up Actions to Action Log */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardText className="h-4 w-4" weight="bold" />
                        Follow-up Actions
                      </CardTitle>
                      <CardDescription className="text-xs">Add actions to the Master Action Log</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedIncident.status !== 'closed' && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setShowFollowUpDialog(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" weight="bold" />
                          Add Follow-up Action
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Follow-up actions will appear in the Master Action Log for tracking and completion.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Attachments */}
                  <IncidentAttachments 
                    incidentId={selectedIncident.id} 
                    incidentStatus={selectedIncident.status} 
                  />

                  {/* Digital Signatures */}
                  <IncidentSignatures 
                    incidentId={selectedIncident.id} 
                    incidentStatus={selectedIncident.status} 
                  />

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedIncident.status !== 'closed' && (
                        <>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              // Pre-populate form with incident data for editing
                              setFormData({
                                ...formData,
                                locationId: String(selectedIncident.locationId),
                                incidentNumber: selectedIncident.incidentNumber,
                                incidentDate: selectedIncident.incidentDate,
                                incidentTime: selectedIncident.incidentTime || '',
                                incidentType: selectedIncident.incidentType,
                                severity: selectedIncident.severity || 'low',
                                locationDescription: selectedIncident.locationDescription || '',
                                affectedPersonType: selectedIncident.affectedPersonType || '',
                                serviceUserId: selectedIncident.serviceUserId ? String(selectedIncident.serviceUserId) : '',
                                affectedStaffId: selectedIncident.affectedStaffId ? String(selectedIncident.affectedStaffId) : '',
                                affectedPersonName: selectedIncident.affectedPersonName || '',
                                staffInvolved: selectedIncident.staffInvolved || '',
                                description: selectedIncident.description || '',
                                immediateActions: selectedIncident.immediateActions || '',
                                reportedBy: selectedIncident.reportedBy || '',
                                injuriesDescription: selectedIncident.injuriesDescription || '',
                                firstAidGiven: selectedIncident.firstAidGiven || false,
                                firstAidDetails: selectedIncident.firstAidDetails || '',
                                medicalAttentionRequired: selectedIncident.medicalAttentionRequired || false,
                                hospitalAttendance: selectedIncident.hospitalAttendance || false,
                                hospitalName: selectedIncident.hospitalName || '',
                                witnessesPresent: !!selectedIncident.witnessStatements,
                                witnessStatements: selectedIncident.witnessStatements || '',
                                familyNotified: selectedIncident.reportedToFamily || false,
                                riskAssessmentRequired: selectedIncident.investigationRequired || false,
                                riskAssessmentNotes: selectedIncident.investigationNotes || '',
                              });
                              setSelectedIncident(null);
                              setIsCreateDialogOpen(true);
                              toast.info('Editing incident - make changes and save');
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Incident
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => closeMutation.mutate({ id: selectedIncident.id })}
                            disabled={closeMutation.isPending}
                          >
                            {closeMutation.isPending ? (
                              <Spinner className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" weight="bold" />
                            )}
                            Close Incident
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => generateSinglePDFMutation.mutate({ incidentId: selectedIncident.id })}
                        disabled={generateSinglePDFMutation.isPending}
                      >
                        {generateSinglePDFMutation.isPending ? (
                          <Spinner className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
                        )}
                        Download PDF Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Follow-up Action Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardText className="h-5 w-5" weight="bold" />
              Add Follow-up Action
            </DialogTitle>
            <DialogDescription>
              This action will be added to the Master Action Log for tracking and completion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Description *</Label>
              <Textarea
                placeholder="Describe the follow-up action required..."
                value={followUpData.actionDescription}
                onChange={(e) => setFollowUpData({ ...followUpData, actionDescription: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                value={followUpData.assignedToId}
                onValueChange={(value) => setFollowUpData({ ...followUpData, assignedToId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Completion Date *</Label>
              <Input
                type="date"
                value={followUpData.targetDate}
                onChange={(e) => setFollowUpData({ ...followUpData, targetDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!followUpData.actionDescription || !followUpData.targetDate) {
                  toast.error("Please fill in required fields");
                  return;
                }
                addFollowUpMutation.mutate({
                  incidentId: selectedIncident.id,
                  incidentNumber: selectedIncident.incidentNumber,
                  locationId: selectedIncident.locationId,
                  actionDescription: followUpData.actionDescription,
                  assignedToId: followUpData.assignedToId ? parseInt(followUpData.assignedToId) : undefined,
                  targetDate: followUpData.targetDate,
                  severity: selectedIncident.severity,
                });
              }}
              disabled={addFollowUpMutation.isPending}
            >
              {addFollowUpMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" weight="bold" />
              )}
              Add to Action Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
