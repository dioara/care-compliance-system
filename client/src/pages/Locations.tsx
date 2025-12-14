import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MapPin, Plus, Pencil, Trash2, Loader2, Users, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Locations() {
  const { data: locations, isLoading, refetch } = trpc.locations.list.useQuery();
  const createLocation = trpc.locations.create.useMutation();
  const updateLocation = trpc.locations.update.useMutation();
  const deleteLocation = trpc.locations.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    managerName: "",
    managerEmail: "",
    numberOfServiceUsers: 0,
    numberOfStaff: 0,
    serviceType: "",
    contactPhone: "",
    contactEmail: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      managerName: "",
      managerEmail: "",
      numberOfServiceUsers: 0,
      numberOfStaff: 0,
      serviceType: "",
      contactPhone: "",
      contactEmail: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createLocation.mutateAsync(formData);
      toast.success("Location created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to create location");
    }
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || "",
      address: location.address || "",
      managerName: location.managerName || "",
      managerEmail: location.managerEmail || "",
      numberOfServiceUsers: location.numberOfServiceUsers || 0,
      numberOfStaff: location.numberOfStaff || 0,
      serviceType: location.serviceType || "",
      contactPhone: location.contactPhone || "",
      contactEmail: location.contactEmail || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLocation) return;

    try {
      await updateLocation.mutateAsync({
        id: editingLocation.id,
        ...formData,
      });
      toast.success("Location updated successfully");
      setIsEditOpen(false);
      setEditingLocation(null);
      resetForm();
      refetch();
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteLocation.mutateAsync({ id });
      toast.success("Location deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your care service locations. Each location has separate compliance tracking.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Create a new care service location for compliance tracking.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Location Name *</Label>
                    <Input
                      id="create-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-serviceType">Service Type</Label>
                    <Input
                      id="create-serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      placeholder="e.g., Residential Care"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-managerName">Manager Name</Label>
                    <Input
                      id="create-managerName"
                      name="managerName"
                      value={formData.managerName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-managerEmail">Manager Email</Label>
                    <Input
                      id="create-managerEmail"
                      name="managerEmail"
                      type="email"
                      value={formData.managerEmail}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-numberOfServiceUsers">Number of Service Users</Label>
                    <Input
                      id="create-numberOfServiceUsers"
                      name="numberOfServiceUsers"
                      type="number"
                      value={formData.numberOfServiceUsers}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-numberOfStaff">Number of Staff</Label>
                    <Input
                      id="create-numberOfStaff"
                      name="numberOfStaff"
                      type="number"
                      value={formData.numberOfStaff}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-contactPhone">Contact Phone</Label>
                    <Input
                      id="create-contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-contactEmail">Contact Email</Label>
                    <Input
                      id="create-contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-address">Address</Label>
                  <Textarea
                    id="create-address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Location"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locations && locations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {location.name}
                    </CardTitle>
                    {location.serviceType && (
                      <CardDescription>{location.serviceType}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(location)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {location.address && (
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{location.numberOfServiceUsers || 0}</p>
                      <p className="text-xs text-muted-foreground">Service Users</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{location.numberOfStaff || 0}</p>
                      <p className="text-xs text-muted-foreground">Staff</p>
                    </div>
                  </div>
                </div>

                {location.managerName && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium">{location.managerName}</p>
                    <p className="text-xs text-muted-foreground">Location Manager</p>
                    {location.managerEmail && (
                      <p className="text-xs text-muted-foreground mt-1">{location.managerEmail}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first care service location.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location information and contact details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Location Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-serviceType">Service Type</Label>
                  <Input
                    id="edit-serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-managerName">Manager Name</Label>
                  <Input
                    id="edit-managerName"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-managerEmail">Manager Email</Label>
                  <Input
                    id="edit-managerEmail"
                    name="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-numberOfServiceUsers">Number of Service Users</Label>
                  <Input
                    id="edit-numberOfServiceUsers"
                    name="numberOfServiceUsers"
                    type="number"
                    value={formData.numberOfServiceUsers}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-numberOfStaff">Number of Staff</Label>
                  <Input
                    id="edit-numberOfStaff"
                    name="numberOfStaff"
                    type="number"
                    value={formData.numberOfStaff}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                  <Input
                    id="edit-contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contactEmail">Contact Email</Label>
                  <Input
                    id="edit-contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLocation.isPending}>
                {updateLocation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Location"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
