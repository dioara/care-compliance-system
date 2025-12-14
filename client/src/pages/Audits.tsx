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
import { CalendarIcon, ClipboardList, FileText, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Audits() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedAuditType, setSelectedAuditType] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [auditDate, setAuditDate] = useState<Date>(new Date());

  // Fetch data
  const { data: auditTypes, isLoading: loadingTypes } = trpc.audits.getAuditTypes.useQuery();
  const { data: locations, isLoading: loadingLocations } = trpc.locations.list.useQuery();
  const { data: auditInstances, isLoading: loadingInstances } = trpc.audits.getAuditInstancesByLocation.useQuery(
    { locationId: selectedLocation || 0, limit: 50 },
    { enabled: !!selectedLocation }
  );

  const createAuditMutation = trpc.audits.createAuditInstance.useMutation({
    onSuccess: (data) => {
      toast.success("Audit scheduled successfully");
      setIsScheduleDialogOpen(false);
      setLocation(`/audits/${data.id}`);
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
    });
  };

  // Filter audit types by category
  const filteredAuditTypes = auditTypes?.filter(
    (type) => selectedCategory === "all" || type.auditCategory === selectedCategory
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
      reviewed: { label: "Reviewed", color: "bg-purple-100 text-purple-800", icon: FileText },
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage and conduct compliance audits across your care home
          </p>
        </div>
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
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
                      <ClipboardList className="h-8 w-8 text-primary" />
                      <Badge className={getCategoryBadgeColor(auditType.auditCategory)}>
                        {auditType.recommendedFrequency || auditType.auditCategory}
                      </Badge>
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
                      setLocation(`/audits/${audit.id}`);
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{audit.auditTypeName}</h3>
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
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
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
