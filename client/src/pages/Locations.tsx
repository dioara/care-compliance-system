import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";

import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "@/contexts/LocationContext";

import { Spinner, MapPin, Plus, PencilSimple, Trash, Users, Buildings, Medal } from "@phosphor-icons/react";
const CQC_RATINGS = [
  "Outstanding",
  "Good",
  "Requires Improvement",
  "Inadequate",
  "Not Yet Rated"
];

const SERVICE_TYPES = [
  "Residential Care",
  "Nursing Care",
  "Dementia Care",
  "Learning Disabilities",
  "Mental Health",
  "Physical Disabilities",
  "Sensory Impairments",
  "Palliative Care",
  "Respite Care",
  "Supported Living"
];

export default function Locations() {
  const { activeLocationId } = useLocation();
  const { data: locations, isLoading, refetch } = trpc.locations.list.useQuery();
  const { data: staffMembers } = trpc.staff.list.useQuery(
    { locationId: activeLocationId || 0 },
    { enabled: !!activeLocationId }
  );
  
  const createLocation = trpc.locations.create.useMutation();
  const updateLocation = trpc.locations.update.useMutation();
  const deleteLocation = trpc.locations.delete.useMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    managerId: null as number | null,
    cqcRating: "",
    serviceTypes: [] as string[],
    contactPhone: "",
    contactEmail: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      managerId: null,
      cqcRating: "",
      serviceTypes: [],
      contactPhone: "",
      contactEmail: "",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleServiceTypeToggle = (serviceType: string) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.includes(serviceType)
        ? prev.serviceTypes.filter(t => t !== serviceType)
        : [...prev.serviceTypes, serviceType]
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
      managerId: location.managerId || null,
      cqcRating: location.cqcRating || "",
      serviceTypes: location.serviceTypes || [],
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

  const getManagerName = (managerId: number | null) => {
    if (!managerId || !staffMembers) return "Not assigned";
    const manager = staffMembers.find(s => s.id === managerId);
    return manager ? manager.name : "Not assigned";
  };

  const getCQCRatingBadge = (rating: string | null) => {
    if (!rating) return null;
    
    const colors = {
      "Outstanding": "bg-purple-100 text-purple-800 border-purple-200",
      "Good": "bg-green-100 text-green-800 border-green-200",
      "Requires Improvement": "bg-amber-100 text-amber-800 border-amber-200",
      "Inadequate": "bg-red-100 text-red-800 border-red-200",
      "Not Yet Rated": "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colors[rating as keyof typeof colors] || colors["Not Yet Rated"]}`}>
        <Medal className="h-3 w-3" weight="bold" />
        {rating}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground mt-2">
            Manage your care service locations. Each location has separate compliance tracking.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <Label htmlFor="create-manager">Manager</Label>
                    <Select 
                      value={formData.managerId?.toString() || "none"} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value === "none" ? null : parseInt(value) }))}
                    >
                      <SelectTrigger id="create-manager">
                        <SelectValue placeholder="Select manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No manager assigned</SelectItem>
                        {staffMembers?.map(staff => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            {staff.name} - {staff.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-cqcRating">CQC Rating</Label>
                    <Select 
                      value={formData.cqcRating} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cqcRating: value }))}
                    >
                      <SelectTrigger id="create-cqcRating">
                        <SelectValue placeholder="Select CQC rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {CQC_RATINGS.map(rating => (
                          <SelectItem key={rating} value={rating}>
                            {rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2 md:col-span-2">
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

                <div className="space-y-2">
                  <Label>Service Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-md">
                    {SERVICE_TYPES.map(serviceType => (
                      <div key={serviceType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${serviceType}`}
                          checked={formData.serviceTypes.includes(serviceType)}
                          onCheckedChange={() => handleServiceTypeToggle(serviceType)}
                        />
                        <label
                          htmlFor={`create-${serviceType}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {serviceType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location information and settings.
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
                  <Label htmlFor="edit-manager">Manager</Label>
                  <Select 
                    value={formData.managerId?.toString() || "none"} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, managerId: value === "none" ? null : parseInt(value) }))}
                  >
                    <SelectTrigger id="edit-manager">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No manager assigned</SelectItem>
                      {staffMembers?.map(staff => (
                        <SelectItem key={staff.id} value={staff.id.toString()}>
                          {staff.name} - {staff.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cqcRating">CQC Rating</Label>
                  <Select 
                    value={formData.cqcRating} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cqcRating: value }))}
                  >
                    <SelectTrigger id="edit-cqcRating">
                      <SelectValue placeholder="Select CQC rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {CQC_RATINGS.map(rating => (
                        <SelectItem key={rating} value={rating}>
                          {rating}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2 md:col-span-2">
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

              <div className="space-y-2">
                <Label>Service Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-md">
                  {SERVICE_TYPES.map(serviceType => (
                    <div key={serviceType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${serviceType}`}
                        checked={formData.serviceTypes.includes(serviceType)}
                        onCheckedChange={() => handleServiceTypeToggle(serviceType)}
                      />
                      <label
                        htmlFor={`edit-${serviceType}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {serviceType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLocation.isPending}>
                {updateLocation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
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

      {locations && locations.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" weight="bold" />
                      {location.name}
                    </CardTitle>
                    {location.cqcRating && (
                      <div className="mt-2">
                        {getCQCRatingBadge(location.cqcRating)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(location)}
                    >
                      <PencilSimple className="h-4 w-4" weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash className="h-4 w-4" weight="bold" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.address && (
                  <div className="text-sm text-muted-foreground">
                    <p>{location.address}</p>
                  </div>
                )}

                {location.serviceTypes && location.serviceTypes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Service Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {location.serviceTypes.map((type: string) => (
                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 border border-blue-200">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Service Users</p>
                      <p className="text-sm font-medium">{location.numberOfServiceUsers || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Buildings className="h-4 w-4 text-muted-foreground" weight="bold" />
                    <div>
                      <p className="text-xs text-muted-foreground">Staff</p>
                      <p className="text-sm font-medium">{location.numberOfStaff || 0}</p>
                    </div>
                  </div>
                </div>

                {location.managerId && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">Manager</p>
                    <p className="text-sm font-medium">{getManagerName(location.managerId)}</p>
                  </div>
                )}

                {(location.contactPhone || location.contactEmail) && (
                  <div className="pt-3 border-t space-y-1">
                    {location.contactPhone && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Phone:</span> {location.contactPhone}
                      </p>
                    )}
                    {location.contactEmail && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Email:</span> {location.contactEmail}
                      </p>
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
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" weight="bold" />
            <h3 className="text-lg font-semibold mb-2">No locations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding your first care service location.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" weight="bold" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
