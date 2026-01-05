import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLocation as useRouter, useSearch } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PageHeader } from "@/components/PageHeader";

import { Spinner, UserCheck, ClipboardText, Plus, PencilSimple, Trash, CalendarBlank, Shield, CheckCircle, XCircle, Funnel, Lock, ClockCounterClockwise, Envelope, PaperPlaneTilt, Checks } from "@phosphor-icons/react";
export default function Staff() {
  const { activeLocationId, canWrite, permissions } = useLocation();
  const [, setLocation] = useRouter();
  const searchParams = new URLSearchParams(useSearch());
  const locationParam = searchParams.get('location');
  
  const [filterLocationId, setFilterLocationId] = useState<number | null>(
    locationParam ? parseInt(locationParam) : null
  );
  
  // Update URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filterLocationId) {
      params.set('location', filterLocationId.toString());
    } else {
      params.delete('location');
    }
    const newSearch = params.toString();
    const newUrl = newSearch ? `/staff?${newSearch}` : '/staff';
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [filterLocationId]);
  
  // Use filter location if set, otherwise use active location
  const effectiveLocationId = filterLocationId || activeLocationId;
  
  // Fetch staff filtered by effective location
  const { data: staff, isLoading, refetch } = trpc.staff.list.useQuery(
    { locationId: effectiveLocationId || undefined },
    { enabled: !!effectiveLocationId }
  );
  
  const createStaff = trpc.staff.create.useMutation();
  const updateStaff = trpc.staff.update.useMutation();
  const deleteStaff = trpc.staff.delete.useMutation();
  const addHistory = trpc.staff.addHistory.useMutation();
  const sendInvitation = trpc.users.sendInvitation.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyStaffId, setHistoryStaffId] = useState<number | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStaff, setInviteStaff] = useState<any>(null);

  // Fetch history when dialog is open
  const { data: staffHistory, isLoading: historyLoading } = trpc.staff.getHistory.useQuery(
    { staffId: historyStaffId! },
    { enabled: !!historyStaffId && isHistoryOpen }
  );

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    employmentType: "permanent_not_sponsored" as "permanent_sponsored" | "permanent_not_sponsored" | "agency",
    locationId: activeLocationId || 0,
    employmentDate: "",
    dbsCertificateNumber: "",
    dbsDate: "",
    isActive: true,
  });

  // Fetch locations for dropdown
  const { data: locations = [] } = trpc.locations.list.useQuery();

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      employmentType: "permanent_not_sponsored",
      locationId: activeLocationId || 0,
      employmentDate: "",
      dbsCertificateNumber: "",
      dbsDate: "",
      isActive: true,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeLocationId) {
      toast.error("Please select a location first");
      return;
    }

    if (!canWrite) {
      toast.error("You don't have permission to add staff to this location");
      return;
    }

    try {
      await createStaff.mutateAsync({
        locationId: formData.locationId || activeLocationId,
        name: formData.name,
        role: formData.role,
        employmentType: formData.employmentType,
        employmentDate: formData.employmentDate,
        dbsCertificateNumber: formData.dbsCertificateNumber,
        dbsDate: formData.dbsDate,
        isActive: formData.isActive,
      });
      toast.success("Staff member added successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to add staff member");
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name || "",
      role: staffMember.role || "",
      employmentType: staffMember.employmentType || "permanent_not_sponsored",
      locationId: staffMember.locationId || activeLocationId || 0,
      employmentDate: staffMember.employmentDate ? new Date(staffMember.employmentDate).toISOString().split('T')[0] : "",
      dbsCertificateNumber: staffMember.dbsCertificateNumber || "",
      dbsDate: staffMember.dbsDate ? new Date(staffMember.dbsDate).toISOString().split('T')[0] : "",
      isActive: Boolean(staffMember.isActive ?? 1),
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStaff) return;

    if (!canWrite) {
      toast.error("You don't have permission to edit staff in this location");
      return;
    }

    try {
      // Track employment type changes
      if (editingStaff.employmentType !== formData.employmentType) {
        await addHistory.mutateAsync({
          staffId: editingStaff.id,
          changeType: "Employment Type Changed",
          previousValue: editingStaff.employmentType || "Not set",
          newValue: formData.employmentType,
        });
      }

      // Track role changes
      if (editingStaff.role !== formData.role) {
        await addHistory.mutateAsync({
          staffId: editingStaff.id,
          changeType: "Role Changed",
          previousValue: editingStaff.role || "Not set",
          newValue: formData.role,
        });
      }

      // Track active status changes
      if (editingStaff.isActive !== formData.isActive) {
        await addHistory.mutateAsync({
          staffId: editingStaff.id,
          changeType: formData.isActive ? "Reactivated" : "Deactivated",
          previousValue: editingStaff.isActive ? "Active" : "Inactive",
          newValue: formData.isActive ? "Active" : "Inactive",
        });
      }

      await updateStaff.mutateAsync({
        id: editingStaff.id,
        locationId: formData.locationId,
        name: formData.name,
        role: formData.role,
        employmentType: formData.employmentType,
        employmentDate: formData.employmentDate,
        dbsCertificateNumber: formData.dbsCertificateNumber,
        dbsDate: formData.dbsDate,
        isActive: formData.isActive,
      });
      toast.success("Staff member updated successfully");
      setIsEditOpen(false);
      setEditingStaff(null);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to update staff member");
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteStaff) return;

    try {
      await sendInvitation.mutateAsync({
        email: inviteEmail,
        name: inviteStaff.name,
        staffId: inviteStaff.id,
      });
      toast.success("Invitation email sent successfully!");
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteStaff(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  const openHistory = (staffMember: any) => {
    setHistoryStaffId(staffMember.id);
    setIsHistoryOpen(true);
  };

  const openInvite = (staffMember: any) => {
    setInviteStaff(staffMember);
    setInviteEmail("");
    setIsInviteOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!canWrite) {
      toast.error("You don't have permission to delete staff in this location");
      return;
    }

    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteStaff.mutateAsync({ id });
      toast.success("Staff member deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete staff member");
    }
  };

  if (!activeLocationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please select a location to view staff</p>
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
    <PageHeader 
      breadcrumb={<Breadcrumb items={[{ label: "Staff" }]} />}
    >
      <div className="space-y-6 md:space-y-4 md:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm shrink-0">
            <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-primary" weight="bold" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Staff Members</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage staff members for the selected location. Track employment details and DBS certificates.
            </p>
          </div>
        </div>
      </div>
      
      {/* Location Filter */}
      {accessibleLocations.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Funnel className="h-4 w-4 text-muted-foreground" weight="bold" />
          <span className="text-sm text-muted-foreground">Filter by location:</span>
          <Select
            value={filterLocationId?.toString() || "all"}
            onValueChange={(value) => {
              setFilterLocationId(value === "all" ? null : parseInt(value));
            }}
          >
            <SelectTrigger className="w-[160px] md:w-[200px]">
              <SelectValue placeholder="All locations" />
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

      <div className="flex flex-wrap items-center justify-between gap-3">
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
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to the selected location.
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
                    <Label htmlFor="create-role">Role</Label>
                    <Input
                      id="create-role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      placeholder="e.g., Care Assistant, Nurse"
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
                    <Label htmlFor="create-employmentType">Employment Type *</Label>
                    <select
                      id="create-employmentType"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="permanent_not_sponsored">Permanent - Not Sponsored</option>
                      <option value="permanent_sponsored">Permanent - Sponsored</option>
                      <option value="agency">Agency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-employmentDate">Employment Date</Label>
                    <Input
                      id="create-employmentDate"
                      name="employmentDate"
                      type="date"
                      value={formData.employmentDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-dbsCertificateNumber">DBS Certificate Number</Label>
                    <Input
                      id="create-dbsCertificateNumber"
                      name="dbsCertificateNumber"
                      value={formData.dbsCertificateNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-dbsDate">DBS Date</Label>
                    <Input
                      id="create-dbsDate"
                      name="dbsDate"
                      type="date"
                      value={formData.dbsDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="create-isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="create-isActive" className="cursor-pointer">
                        Currently Active
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStaff.isPending}>
                  {createStaff.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Staff Member"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {staff && staff.length > 0 ? (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((staffMember) => (
            <Card key={staffMember.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-500" weight="bold" />
                        {staffMember.name}
                      </CardTitle>
                      {staffMember.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" weight="bold" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" weight="bold" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {staffMember.role && (
                      <CardDescription>{staffMember.role}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openHistory(staffMember)}
                      title="View History"
                    >
                      <ClockCounterClockwise className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openInvite(staffMember)}
                      title="Send Account Invitation"
                      disabled={!canWrite}
                    >
                      <Envelope className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(staffMember)}
                      disabled={!canWrite}
                      title="Edit"
                    >
                      <PencilSimple className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(staffMember.id)}
                      disabled={!canWrite}
                      title="Delete"
                    >
                      <Trash className="h-4 w-4 text-destructive" weight="bold" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {staffMember.employmentDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <span className="text-muted-foreground">Employed:</span>
                    <span>{new Date(staffMember.employmentDate).toLocaleDateString()}</span>
                  </div>
                )}
                {staffMember.dbsCertificateNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <span className="text-muted-foreground">DBS:</span>
                    <span className="font-mono text-xs">{staffMember.dbsCertificateNumber}</span>
                  </div>
                )}
                {staffMember.dbsDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <span className="text-muted-foreground">DBS Date:</span>
                    <span>{new Date(staffMember.dbsDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {/* Compliance Progress */}
                {staffMember.complianceProgress && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Compliance Progress</span>
                        <span className="font-medium">
                          {staffMember.complianceProgress.completed}/{staffMember.complianceProgress.total} sections
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            staffMember.complianceProgress.percentage >= 80
                              ? 'bg-green-500'
                              : staffMember.complianceProgress.percentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${staffMember.complianceProgress.percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Compliance Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Compliance Score</span>
                        <span className="font-medium">
                          {staffMember.complianceProgress.compliantQuestions}/{staffMember.complianceProgress.totalQuestions} questions ({staffMember.complianceProgress.score}%)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            staffMember.complianceProgress.score >= 80
                              ? 'bg-green-500'
                              : staffMember.complianceProgress.score >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${staffMember.complianceProgress.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/staff/${staffMember.id}/compliance`}
                  >
                    <Checks className="mr-2 h-4 w-4" weight="bold" />
                    View Compliance ({staffMember.complianceProgress?.completed || 0}/{staffMember.complianceProgress?.total || 7} complete)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Staff Members</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first staff member to this location.
            </p>
            {canWrite && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Add Staff Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information.
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
                  <Label htmlFor="edit-role">Role</Label>
                  <Input
                    id="edit-role"
                    name="role"
                    value={formData.role}
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
                  <Label htmlFor="edit-employmentType">Employment Type *</Label>
                  <select
                    id="edit-employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="permanent_not_sponsored">Permanent - Not Sponsored</option>
                    <option value="permanent_sponsored">Permanent - Sponsored</option>
                    <option value="agency">Agency</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-employmentDate">Employment Date</Label>
                  <Input
                    id="edit-employmentDate"
                    name="employmentDate"
                    type="date"
                    value={formData.employmentDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dbsCertificateNumber">DBS Certificate Number</Label>
                  <Input
                    id="edit-dbsCertificateNumber"
                    name="dbsCertificateNumber"
                    value={formData.dbsCertificateNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dbsDate">DBS Date</Label>
                  <Input
                    id="edit-dbsDate"
                    name="dbsDate"
                    type="date"
                    value={formData.dbsDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 flex items-center">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-isActive" className="cursor-pointer">
                      Currently Active
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStaff.isPending}>
                {updateStaff.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Staff Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClockCounterClockwise className="h-5 w-5" weight="bold" />
              Staff History
            </DialogTitle>
            <DialogDescription>
              View all changes made to this staff member's record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : staffHistory && staffHistory.length > 0 ? (
              <div className="space-y-3">
                {staffHistory.map((entry: any) => (
                  <div key={entry.id} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{entry.changeType}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="line-through text-red-500">{entry.previousValue}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">{entry.newValue}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{new Date(entry.createdAt).toLocaleDateString()}</p>
                        <p>{new Date(entry.createdAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {entry.changedByName && (
                      <p className="text-xs text-muted-foreground mt-2">Changed by: {entry.changedByName}</p>
                    )}
                    {entry.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClockCounterClockwise className="h-12 w-12 mx-auto mb-4 opacity-50" weight="bold" />
                <p>No history records found</p>
                <p className="text-sm">Changes to this staff member will be tracked here.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Envelope className="h-5 w-5" weight="bold" />
              Send Account Invitation
            </DialogTitle>
            <DialogDescription>
              Send an email invitation to {inviteStaff?.name} to create their account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendInvite}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="Enter staff member's email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                An email will be sent with a link to create their account. The invitation expires in 7 days.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sendInvitation.isPending}>
                {sendInvitation.isPending ? (
                  <><Spinner className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><PaperPlaneTilt className="mr-2 h-4 w-4" weight="bold" /> Send Invitation</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!canWrite && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Read-only access to this location</p>
        </div>
      )}
      </div>
    </PageHeader>
  );
}
