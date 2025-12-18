import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { ClipboardText, FileText } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Audits() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Helper function to generate audit title with person name
  const getAuditTitle = (audit: any) => {
    let title = audit.auditTypeName || audit.auditName || 'Audit';
    
    // Add staff member name if present
    if (audit.staffMemberName) {
      title += ` - ${audit.staffMemberName}`;
    }
    // Add service user name if present
    else if (audit.serviceUserName) {
      title += ` - ${audit.serviceUserName}`;
    }
    
    return title;
  };
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedAuditType, setSelectedAuditType] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedStaffMember, setSelectedStaffMember] = useState<number | null>(null);
  const [selectedServiceUser, setSelectedServiceUser] = useState<number | null>(null);
  const [auditDate, setAuditDate] = useState<Date>(new Date());

  // Fetch data
  const { data: auditTypes, isLoading: loadingTypes } = trpc.audits.getAuditTypes.useQuery();
  const { data: locations, isLoading: loadingLocations } = trpc.locations.list.useQuery();
  const { data: staffMembers } = trpc.staff.list.useQuery(
    { locationId: selectedLocation || undefined },
    { enabled: !!selectedLocation }
  );
  const { data: serviceUsers } = trpc.serviceUsers.list.useQuery(
    { locationId: selectedLocation || undefined },
    { enabled: !!selectedLocation }
  );
  const { data: auditInstances, isLoading: loadingInstances } = trpc.audits.getAuditInstancesByLocation.useQuery(
    { locationId: selectedLocation || 0, limit: 50 },
    { enabled: !!selectedLocation }
  );

  // Get the selected audit type details
  const selectedAuditTypeDetails = auditTypes?.find(t => t.id === selectedAuditType);

  const createAuditMutation = trpc.audits.createAuditInstance.useMutation({
    onSuccess: (data) => {
      toast.success("Audit started successfully");
      setIsScheduleDialogOpen(false);
      setLocation(`/conduct-audit/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to schedule audit: ${error.message}`);
    },
  });

  const handleScheduleAudit = () => {
    if (!selectedAuditType || !selectedLocation) {
      toast.error("Please select audit type and location");
      return;
    }

    createAuditMutation.mutate({
      auditTypeId: selectedAuditType,
      locationId: selectedLocation,
      auditDate: auditDate,
      staffMemberId: selectedAuditTypeDetails?.targetType === 'staff' ? selectedStaffMember : undefined,
      serviceUserId: selectedAuditTypeDetails?.targetType === 'serviceUser' ? selectedServiceUser : undefined,
    });
  };

  // Filter audit types by category and service type
  const filteredAuditTypes = auditTypes?.filter(
    (type) => {
      const categoryMatch = selectedCategory === "all" || type.auditCategory === selectedCategory;
      // Parse serviceTypes JSON array, default to ["all"] if not set
      const typeServiceTypes: string[] = type.serviceTypes ? JSON.parse(type.serviceTypes) : ["all"];
      const serviceTypeMatch = selectedServiceType === "all" || 
        typeServiceTypes.includes("all") || 
        typeServiceTypes.includes(selectedServiceType);
      return categoryMatch && serviceTypeMatch;
    }
  );

  // Group audit types by category
  const auditTypesByCategory = auditTypes?.reduce((acc, type) => {
    const category = type.auditCategory || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(type);
    return acc;
  }, {} as Record<string, typeof auditTypes>);

  const getCategoryBadgeColor = (category: string) => {
    if (category.includes("monthly")) return "bg-red-100 text-red-800";
    if (category.includes("quarterly")) return "bg-amber-100 text-amber-800";
    if (category.includes("weekly")) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Clock },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
      reviewed: { label: "Reviewed", color: "bg-blue-100 text-blue-800", icon: FileText },
      archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: FileText },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_progress;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to view audits</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <ClipboardText className="h-6 w-6 text-primary" weight="bold" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Audit Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage and conduct compliance audits across your care home
            </p>
          </div>
        </div>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-200">
              <Plus className="h-5 w-5 mr-2" />
              Schedule Audit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Audit</DialogTitle>
              <DialogDescription>
                Select an audit type, location, and date to begin a new audit
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audit Type</label>
                <Select
                  value={selectedAuditType?.toString()}
                  onValueChange={(value) => setSelectedAuditType(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(auditTypesByCategory || {}).map(([category, types]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {category.replace(/_/g, " ").toUpperCase()}
                        </div>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.auditName}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select
                  value={selectedLocation?.toString()}
                  onValueChange={(value) => setSelectedLocation(parseInt(value))}
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

              {/* Staff Member Selection - only show for staff-specific audits */}
              {selectedAuditTypeDetails?.targetType === 'staff' && selectedLocation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Staff Member</label>
                  <Select
                    value={selectedStaffMember?.toString()}
                    onValueChange={(value) => setSelectedStaffMember(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers?.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Service User Selection - only show for service user-specific audits */}
              {selectedAuditTypeDetails?.targetType === 'serviceUser' && selectedLocation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Service User</label>
                  <Select
                    value={selectedServiceUser?.toString()}
                    onValueChange={(value) => setSelectedServiceUser(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service user" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceUsers?.map((su) => (
                        <SelectItem key={su.id} value={su.id.toString()}>
                          {su.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Audit Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(auditDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={auditDate} onSelect={(date) => date && setAuditDate(date)} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleAudit} disabled={createAuditMutation.isPending}>
                {createAuditMutation.isPending ? "Scheduling..." : "Start Audit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="types" className="space-y-6">
        <TabsList>
          <TabsTrigger value="types">Audit Types</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Audits
            </Button>
            <Button
              variant={selectedCategory === "mandatory_monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("mandatory_monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={selectedCategory === "quarterly" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("quarterly")}
            >
              Quarterly
            </Button>
            <Button
              variant={selectedCategory === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("weekly")}
            >
              Weekly
            </Button>
          </div>

          {/* Service Type Filter */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm font-medium text-muted-foreground mr-2">Service Type:</span>
            <Button
              variant={selectedServiceType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedServiceType("all")}
            >
              All Services
            </Button>
            <Button
              variant={selectedServiceType === "domiciliary_care" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedServiceType("domiciliary_care")}
            >
              Domiciliary Care
            </Button>
            <Button
              variant={selectedServiceType === "supported_living" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedServiceType("supported_living")}
            >
              Supported Living
            </Button>
            <Button
              variant={selectedServiceType === "residential" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedServiceType("residential")}
            >
              Residential
            </Button>
            <Button
              variant={selectedServiceType === "nursing" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedServiceType("nursing")}
            >
              Nursing
            </Button>
          </div>

          {loadingTypes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAuditTypes?.map((auditType) => (
                <Card key={auditType.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <ClipboardText className="h-8 w-8 text-primary" weight="bold" />
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={getCategoryBadgeColor(auditType.auditCategory)}>
                          {auditType.recommendedFrequency || auditType.auditCategory}
                        </Badge>
                        {(() => {
                          const serviceTypes: string[] = auditType.serviceTypes ? JSON.parse(auditType.serviceTypes) : ["all"];
                          if (serviceTypes.length === 1 && serviceTypes[0] === "all") return null;
                          return (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {serviceTypes.map((st: string) => (
                                <Badge key={st} variant="outline" className="text-xs">
                                  {st.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{auditType.auditName}</CardTitle>
                    <CardDescription className="line-clamp-2">{auditType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedAuditType(auditType.id);
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      Schedule Audit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Location</label>
            <Select
              value={selectedLocation?.toString() || ""}
              onValueChange={(value) => setSelectedLocation(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-[300px]">
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

          {!selectedLocation ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Please select a location to view audit history</p>
              </CardContent>
            </Card>
          ) : loadingInstances ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : auditInstances && auditInstances.length > 0 ? (
            <div className="space-y-3">
              {auditInstances.map((audit) => (
                <Card
                  key={audit.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate to results page for completed audits, conduct page for in-progress
                    if (audit.status === 'completed' || audit.status === 'reviewed' || audit.status === 'archived') {
                      setLocation(`/audits/${audit.id}/results`);
                    } else {
                      setLocation(`/conduct-audit/${audit.id}`);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{getAuditTitle(audit)}</h3>
                          {getStatusBadge(audit.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Date: {audit.auditDate ? format(new Date(audit.auditDate), "PPP") : "N/A"}</span>
                          {audit.auditorName && <span>Auditor: {audit.auditorName}</span>}
                          {audit.overallScore !== null && <span>Score: {audit.overallScore}%</span>}
                        </div>
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardText className="h-12 w-12 text-muted-foreground mb-4" weight="bold" />
                <p className="text-muted-foreground">No audits found for this location</p>
                <Button className="mt-4" onClick={() => setIsScheduleDialogOpen(true)}>
                  Schedule First Audit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
