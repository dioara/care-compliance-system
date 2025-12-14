import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { Users, Plus, Pencil, Trash2, Loader2, Calendar, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ServiceUsers() {
  const { activeLocationId, canWrite } = useLocation();
  
  // Fetch service users filtered by active location
  const { data: serviceUsers, isLoading, refetch } = trpc.serviceUsers.list.useQuery(
    { locationId: activeLocationId || undefined },
    { enabled: !!activeLocationId }
  );
  
  const createServiceUser = trpc.serviceUsers.create.useMutation();
  const updateServiceUser = trpc.serviceUsers.update.useMutation();
  const deleteServiceUser = trpc.serviceUsers.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingServiceUser, setEditingServiceUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    carePackageType: "",
    admissionDate: "",
    supportNeeds: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      dateOfBirth: "",
      carePackageType: "",
      admissionDate: "",
      supportNeeds: "",
    });
  };

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
        locationId: activeLocationId,
        ...formData,
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
      supportNeeds: serviceUser.supportNeeds || "",
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
      await updateServiceUser.mutateAsync({
        id: editingServiceUser.id,
        ...formData,
      });
      toast.success("Service user updated successfully");
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage service users for the selected location. Each service user's data is location-specific.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canWrite}>
              <Plus className="mr-2 h-4 w-4" />
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {serviceUsers && serviceUsers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceUsers.map((serviceUser) => (
            <Card key={serviceUser.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      {serviceUser.name}
                    </CardTitle>
                    {serviceUser.carePackageType && (
                      <CardDescription>{serviceUser.carePackageType}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(serviceUser)}
                      disabled={!canWrite}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(serviceUser.id)}
                      disabled={!canWrite}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceUser.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">DOB:</span>
                    <span>{new Date(serviceUser.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}
                {serviceUser.admissionDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
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
                <Plus className="mr-2 h-4 w-4" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {!canWrite && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Read-only access to this location</p>
        </div>
      )}
    </div>
  );
}
