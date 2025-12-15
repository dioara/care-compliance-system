import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { UserCheck, Plus, Pencil, Trash2, Loader2, Calendar, Shield, CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLocation as useRouter } from "wouter";

export default function Staff() {
  const { activeLocationId, canWrite } = useLocation();
  
  // Fetch staff filtered by active location
  const { data: staff, isLoading, refetch } = trpc.staff.list.useQuery(
    { locationId: activeLocationId || undefined },
    { enabled: !!activeLocationId }
  );
  
  const createStaff = trpc.staff.create.useMutation();
  const updateStaff = trpc.staff.update.useMutation();
  const deleteStaff = trpc.staff.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

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
      isActive: staffMember.isActive ?? true,
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Members</h1>
          <p className="text-muted-foreground mt-2">
            Manage staff members for the selected location. Track employment details and DBS certificates.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canWrite}>
              <Plus className="mr-2 h-4 w-4" />
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((staffMember) => (
            <Card key={staffMember.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-500" />
                        {staffMember.name}
                      </CardTitle>
                      {staffMember.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {staffMember.role && (
                      <CardDescription>{staffMember.role}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(staffMember)}
                      disabled={!canWrite}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(staffMember.id)}
                      disabled={!canWrite}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {staffMember.employmentDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Employed:</span>
                    <span>{new Date(staffMember.employmentDate).toLocaleDateString()}</span>
                  </div>
                )}
                {staffMember.dbsCertificateNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">DBS:</span>
                    <span className="font-mono text-xs">{staffMember.dbsCertificateNumber}</span>
                  </div>
                )}
                {staffMember.dbsDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">DBS Date:</span>
                    <span>{new Date(staffMember.dbsDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {/* Compliance Progress */}
                {staffMember.complianceProgress && (
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
                )}
                
                <div className="pt-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/staff/${staffMember.id}/compliance`}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
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
                <Plus className="mr-2 h-4 w-4" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {!canWrite && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Read-only access to this location</p>
        </div>
      )}
    </div>
  );
}
