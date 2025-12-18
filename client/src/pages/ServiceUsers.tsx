import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation as useRouter } from "wouter";

import { Spinner, Users, ClipboardText, Plus, PencilSimple, Trash, CalendarBlank, Heart, Funnel, Lock, ClockCounterClockwise } from "@phosphor-icons/react";
export default function ServiceUsers() {
  const { activeLocationId, canWrite, permissions } = useLocation();
  const [filterLocationId, setFilterLocationId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  // Use filter location if set, otherwise use active location
  const effectiveLocationId = filterLocationId || activeLocationId;
  
  // Fetch service users filtered by effective location
  const { data: serviceUsers, isLoading, refetch } = trpc.serviceUsers.list.useQuery(
    { locationId: effectiveLocationId || undefined },
    { enabled: !!effectiveLocationId }
  );
  
  const createServiceUser = trpc.serviceUsers.create.useMutation();
  const updateServiceUser = trpc.serviceUsers.update.useMutation();
  const deleteServiceUser = trpc.serviceUsers.delete.useMutation();
  const addServiceUserHistory = trpc.serviceUsers.addHistory.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyServiceUserId, setHistoryServiceUserId] = useState<number | null>(null);
  const [editingServiceUser, setEditingServiceUser] = useState<any>(null);

  // Fetch history for selected service user
  const { data: serviceUserHistory = [], refetch: refetchHistory } = trpc.serviceUsers.getHistory.useQuery(
    { serviceUserId: historyServiceUserId! },
    { enabled: !!historyServiceUserId }
  );

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    carePackageType: "",
    admissionDate: "",
    dischargeDate: "",
    supportNeeds: "",
    locationId: activeLocationId || 0,
    isActive: true,
  });

  // Fetch locations for dropdown
  const { data: locations = [] } = trpc.locations.list.useQuery();

  const resetForm = () => {
    setFormData({
      name: "",
      dateOfBirth: "",
      carePackageType: "",
      admissionDate: "",
      dischargeDate: "",
      supportNeeds: "",
      locationId: activeLocationId || 0,
      isActive: true,
    });
  };

  // Filter service users by status
  const filteredServiceUsers = serviceUsers?.filter((user: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return user.isActive !== false;
    if (statusFilter === 'inactive') return user.isActive === false;
    return true;
  }) || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeLocationId) {
      toast.error("Please select a location first");
      return;
    }

    if (!canWrite) {
      toast.error("You don't have permission to add service users to this location");
      return;
    }

    try {
      await createServiceUser.mutateAsync({
        locationId: formData.locationId || activeLocationId,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        carePackageType: formData.carePackageType,
        admissionDate: formData.admissionDate,
        supportNeeds: formData.supportNeeds,
      });
      toast.success("Service user added successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to add service user");
    }
  };

  const handleEdit = (serviceUser: any) => {
    setEditingServiceUser(serviceUser);
    setFormData({
      name: serviceUser.name || "",
      dateOfBirth: serviceUser.dateOfBirth ? new Date(serviceUser.dateOfBirth).toISOString().split('T')[0] : "",
      carePackageType: serviceUser.carePackageType || "",
      admissionDate: serviceUser.admissionDate ? new Date(serviceUser.admissionDate).toISOString().split('T')[0] : "",
      dischargeDate: serviceUser.dischargeDate ? new Date(serviceUser.dischargeDate).toISOString().split('T')[0] : "",
      supportNeeds: serviceUser.supportNeeds || "",
      locationId: serviceUser.locationId || activeLocationId || 0,
      isActive: Boolean(serviceUser.isActive ?? 1),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingServiceUser) return;

    if (!canWrite) {
      toast.error("You don't have permission to edit service users in this location");
      return;
    }

    try {
      // Check if status changed for history logging
      const wasActive = editingServiceUser.isActive !== false;
      const isNowActive = formData.isActive;
      const statusChanged = wasActive !== isNowActive;

      await updateServiceUser.mutateAsync({
        id: editingServiceUser.id,
        locationId: formData.locationId,
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        carePackageType: formData.carePackageType,
        admissionDate: formData.admissionDate,
        dischargeDate: formData.dischargeDate,
        supportNeeds: formData.supportNeeds,
        isActive: formData.isActive,
      });

      // Log history for status changes
      if (statusChanged) {
        const changeType = isNowActive ? 'Re-admission' : 'Discharge';
        const oldValue = wasActive ? 'Active' : 'Inactive';
        const newValue = isNowActive ? 'Active' : 'Inactive';
        await addServiceUserHistory.mutateAsync({
          serviceUserId: editingServiceUser.id,
          changeType,
          fieldChanged: 'status',
          oldValue,
          newValue,
          notes: isNowActive 
            ? `Service user re-admitted on ${new Date().toLocaleDateString()}` 
            : `Service user discharged on ${formData.dischargeDate || new Date().toLocaleDateString()}`,
        });
      }

      toast.success(statusChanged 
        ? (isNowActive ? "Service user re-admitted successfully" : "Service user discharged successfully")
        : "Service user updated successfully"
      );
      setIsEditOpen(false);
      setEditingServiceUser(null);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to update service user");
    }
  };

  const handleDelete = async (id: number) => {
    if (!canWrite) {
      toast.error("You don't have permission to delete service users in this location");
      return;
    }

    if (!confirm("Are you sure you want to delete this service user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteServiceUser.mutateAsync({ id });
      toast.success("Service user deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete service user");
    }
  };

  if (!activeLocationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please select a location to view service users</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get accessible locations for filter dropdown
  const accessibleLocations = locations.filter(loc =>
    permissions.some(p => p.locationId === loc.id)
  );

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
            <Users className="h-6 w-6 text-primary" weight="bold" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Service Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage service users for the selected location. Each service user's data is location-specific.
            </p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {/* Location Filter */}
          {accessibleLocations.length > 1 && (
            <div className="flex items-center gap-2">
              <Funnel className="h-4 w-4 text-muted-foreground" weight="bold" />
              <span className="text-sm text-muted-foreground">Location:</span>
              <Select
                value={filterLocationId?.toString() || "all"}
                onValueChange={(value) => setFilterLocationId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All accessible locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Current location</SelectItem>
                  {accessibleLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === 'active'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Inactive
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {!canWrite && (
          <Badge variant="secondary" className="text-amber-600 bg-amber-50 border-amber-200">
            <Lock className="h-3 w-3 mr-1" weight="bold" />
            Read Only Access
          </Badge>
        )}
        <div className="flex-1" />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canWrite} title={!canWrite ? "You have read-only access to this location" : undefined}>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Add Service User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Service User</DialogTitle>
              <DialogDescription>
                Add a new service user to the selected location.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Full Name *</Label>
                    <Input
                      id="create-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-dateOfBirth">Date of Birth</Label>
                    <Input
                      id="create-dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-locationId">Location *</Label>
                    <select
                      id="create-locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={(e) => setFormData(prev => ({ ...prev, locationId: parseInt(e.target.value) }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-carePackageType">Care Package Type</Label>
                    <Input
                      id="create-carePackageType"
                      name="carePackageType"
                      value={formData.carePackageType}
                      onChange={handleInputChange}
                      placeholder="e.g., Residential, Nursing"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-admissionDate">Admission Date</Label>
                    <Input
                      id="create-admissionDate"
                      name="admissionDate"
                      type="date"
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-supportNeeds">Support Needs</Label>
                  <Textarea
                    id="create-supportNeeds"
                    name="supportNeeds"
                    value={formData.supportNeeds}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe any specific support needs..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createServiceUser.isPending}>
                  {createServiceUser.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Service User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredServiceUsers && filteredServiceUsers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredServiceUsers.map((serviceUser: any) => (
            <Card key={serviceUser.id} className={serviceUser.isActive === false ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className={`h-5 w-5 ${serviceUser.isActive === false ? 'text-gray-400' : 'text-pink-500'}`} weight="fill" />
                      {serviceUser.name}
                      {serviceUser.isActive === false && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    {serviceUser.carePackageType && (
                      <CardDescription>{serviceUser.carePackageType}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setHistoryServiceUserId(serviceUser.id);
                        setIsHistoryOpen(true);
                      }}
                      title="View History"
                    >
                      <ClockCounterClockwise className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(serviceUser)}
                      disabled={!canWrite}
                    >
                      <PencilSimple className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(serviceUser.id)}
                      disabled={!canWrite}
                    >
                      <Trash className="h-4 w-4 text-destructive" weight="bold" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceUser.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <span className="text-muted-foreground">DOB:</span>
                    <span>{new Date(serviceUser.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}
                {serviceUser.admissionDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <span className="text-muted-foreground">Admitted:</span>
                    <span>{new Date(serviceUser.admissionDate).toLocaleDateString()}</span>
                  </div>
                )}
                {serviceUser.supportNeeds && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Support Needs:</span>
                    <p className="mt-1 text-sm line-clamp-2">{serviceUser.supportNeeds}</p>
                  </div>
                )}
                
                {/* Compliance Progress */}
                {serviceUser.complianceProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Progress</span>
                      <span className="font-medium">
                        {serviceUser.complianceProgress.completed}/{serviceUser.complianceProgress.total} sections
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          serviceUser.complianceProgress.percentage >= 80
                            ? 'bg-green-500'
                            : serviceUser.complianceProgress.percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${serviceUser.complianceProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/service-users/${serviceUser.id}/compliance`}
                  >
                    <ClipboardText weight="bold" className="mr-2 h-4 w-4" />
                    View Compliance ({serviceUser.complianceProgress?.completed || 0}/{serviceUser.complianceProgress?.total || 19} complete)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Service Users</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first service user to this location.
            </p>
            {canWrite && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Add Service User
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service User</DialogTitle>
            <DialogDescription>
              Update service user information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                  <Input
                    id="edit-dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-locationId">Location *</Label>
                  <select
                    id="edit-locationId"
                    name="locationId"
                    value={formData.locationId}
                    onChange={(e) => setFormData(prev => ({ ...prev, locationId: parseInt(e.target.value) }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-carePackageType">Care Package Type</Label>
                  <Input
                    id="edit-carePackageType"
                    name="carePackageType"
                    value={formData.carePackageType}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-admissionDate">Admission Date</Label>
                  <Input
                    id="edit-admissionDate"
                    name="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dischargeDate">Discharge Date</Label>
                  <Input
                    id="edit-dischargeDate"
                    name="dischargeDate"
                    type="date"
                    value={formData.dischargeDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="edit-isActive" className="text-base font-medium">Client Status</Label>
                    <p className="text-sm text-muted-foreground">Is this service user currently an active client?</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${!formData.isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Inactive</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.isActive}
                      onClick={() => {
                        const newIsActive = !formData.isActive;
                        setFormData(prev => ({
                          ...prev,
                          isActive: newIsActive,
                          // Auto-set discharge date when marking inactive
                          dischargeDate: !newIsActive && !prev.dischargeDate 
                            ? new Date().toISOString().split('T')[0] 
                            : newIsActive ? '' : prev.dischargeDate
                        }));
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.isActive ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm ${formData.isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>Active</span>
                  </div>
                </div>
                
                {/* Show discharge info when inactive */}
                {!formData.isActive && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm text-amber-600 mb-2">⚠️ This service user will be marked as discharged</p>
                    <div className="flex items-center gap-4">
                      <Label htmlFor="edit-dischargeDate-inline" className="text-sm whitespace-nowrap">Discharge Date:</Label>
                      <Input
                        id="edit-dischargeDate-inline"
                        name="dischargeDate"
                        type="date"
                        value={formData.dischargeDate}
                        onChange={handleInputChange}
                        className="max-w-[180px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supportNeeds">Support Needs</Label>
                <Textarea
                  id="edit-supportNeeds"
                  name="supportNeeds"
                  value={formData.supportNeeds}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateServiceUser.isPending}>
                {updateServiceUser.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Service User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={(open) => {
        setIsHistoryOpen(open);
        if (!open) setHistoryServiceUserId(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClockCounterClockwise className="h-5 w-5" weight="bold" />
              Service User History
            </DialogTitle>
            <DialogDescription>
              Timeline of status changes, admissions, and discharges
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {serviceUserHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClockCounterClockwise className="h-12 w-12 mx-auto mb-3 opacity-50" weight="bold" />
                <p>No history records found</p>
                <p className="text-sm">Changes to this service user will appear here</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  {serviceUserHistory.map((entry: any, index: number) => (
                    <div key={entry.id || index} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                        entry.changeType === 'Discharge' ? 'bg-red-500' :
                        entry.changeType === 'Re-admission' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`} />
                      
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={entry.changeType === 'Discharge' ? 'destructive' : entry.changeType === 'Re-admission' ? 'default' : 'secondary'}>
                            {entry.changeType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.changedAt).toLocaleString()}
                          </span>
                        </div>
                        
                        {entry.fieldChanged && (
                          <p className="text-sm">
                            <span className="font-medium">{entry.fieldChanged}:</span>{' '}
                            <span className="text-muted-foreground line-through">{entry.oldValue}</span>
                            {' → '}
                            <span className="font-medium">{entry.newValue}</span>
                          </p>
                        )}
                        
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{entry.notes}</p>
                        )}
                        
                        {entry.changedBy && (
                          <p className="text-xs text-muted-foreground mt-2">Changed by: {entry.changedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {!canWrite && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Read-only access to this location</p>
        </div>
      )}
    </div>
  );
}
