import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Spinner, Plus, PencilSimple, Trash, Shield, MapPin, Users, Gear } from "@phosphor-icons/react";

interface LocationPermission {
  locationId: number;
  locationName: string;
  canRead: boolean;
  canWrite: boolean;
}

interface Feature {
  id: string;
  label: string;
  description: string;
}

export default function RoleManagement() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: roles = [], isLoading: rolesLoading, refetch: refetchRoles } = trpc.roles.list.useQuery();
  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: availableFeatures = [] } = trpc.roles.getAvailableFeatures.useQuery();
  
  const createRole = trpc.roles.create.useMutation();
  const updateRole = trpc.roles.update.useMutation();
  const deleteRole = trpc.roles.delete.useMutation();
  const setPermissionsMutation = trpc.roles.setPermissions.useMutation();
  const setFeaturePermissionsMutation = trpc.roles.setFeaturePermissions.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [permissions, setPermissionsState] = useState<LocationPermission[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [permissionsTab, setPermissionsTab] = useState("features");

  // Check if user is super admin
  if (!user?.superAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" weight="bold" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Only super administrators can access role management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedRole(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole.mutateAsync(formData);
      toast.success("Role created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetchRoles();
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await updateRole.mutateAsync({ roleId: selectedRole.id, ...formData });
      toast.success("Role updated successfully");
      setIsEditOpen(false);
      resetForm();
      refetchRoles();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role? Users assigned to this role will lose their permissions.")) return;
    try {
      await deleteRole.mutateAsync({ roleId });
      toast.success("Role deleted successfully");
      refetchRoles();
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const trpcUtils = trpc.useUtils();
  
  const openPermissions = async (role: any) => {
    setSelectedRole(role);
    setPermissionsTab("features");
    
    // Initialize location permissions with all locations
    const initialPermissions = locations.map(loc => ({
      locationId: loc.id,
      locationName: loc.name,
      canRead: false,
      canWrite: false,
    }));
    setPermissionsState(initialPermissions);
    
    // Initialize features as empty
    setSelectedFeatures([]);
    
    setIsPermissionsOpen(true);
    
    // Fetch existing location permissions (invalidate cache first to get fresh data)
    try {
      await trpcUtils.roles.getPermissions.invalidate({ roleId: role.id });
      const existingPerms = await trpcUtils.roles.getPermissions.fetch({ roleId: role.id });
      
      if (existingPerms && existingPerms.length > 0) {
        setPermissionsState(prev => prev.map(p => {
          const existing = existingPerms.find((e: any) => e.locationId === p.locationId);
          if (existing) {
            return { ...p, canRead: existing.canRead, canWrite: existing.canWrite };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error("Failed to fetch location permissions", error);
    }
    
    // Fetch existing feature permissions (invalidate cache first to get fresh data)
    try {
      await trpcUtils.roles.getFeaturePermissions.invalidate({ roleId: role.id });
      const existingFeatures = await trpcUtils.roles.getFeaturePermissions.fetch({ roleId: role.id });
      if (existingFeatures && existingFeatures.length > 0) {
        setSelectedFeatures(existingFeatures);
      }
    } catch (error) {
      console.error("Failed to fetch feature permissions", error);
    }
  };

  const handlePermissionChange = (locationId: number, field: "canRead" | "canWrite", value: boolean) => {
    setPermissionsState(prev => prev.map(p => {
      if (p.locationId === locationId) {
        // If enabling write, also enable read
        if (field === "canWrite" && value) {
          return { ...p, canRead: true, canWrite: true };
        }
        // If disabling read, also disable write
        if (field === "canRead" && !value) {
          return { ...p, canRead: false, canWrite: false };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(f => f !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      // Save location permissions
      const permsToSave = permissions
        .filter(p => p.canRead || p.canWrite)
        .map(p => ({
          locationId: p.locationId,
          canRead: p.canRead,
          canWrite: p.canWrite,
        }));
      await setPermissionsMutation.mutateAsync({ roleId: selectedRole.id, permissions: permsToSave });
      
      // Save feature permissions
      await setFeaturePermissionsMutation.mutateAsync({ roleId: selectedRole.id, features: selectedFeatures });
      
      toast.success("Permissions saved successfully");
      setIsPermissionsOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast.error("Failed to save permissions");
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Create and manage roles with feature and location-based permissions
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a role to group feature and location permissions. You can assign this role to users.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Role Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., North Region Manager"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this role is for..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRole.isPending}>
                    {createRole.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Create Role
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" weight="bold" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">How Role-Based Access Control Works</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  1. Create roles (e.g., "Quality Officer", "Care Manager")<br/>
                  2. Assign <strong>feature permissions</strong> - which tabs/modules the role can access<br/>
                  3. Assign <strong>location permissions</strong> - which locations the role can see data for<br/>
                  4. Assign users to one or more roles<br/>
                  5. Users only see features and data their roles allow (Super Admins see everything)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" weight="bold" />
              Roles
            </CardTitle>
            <CardDescription>
              {roles.length} role{roles.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" weight="bold" />
                <p>No roles created yet</p>
                <p className="text-sm">Create a role to start assigning permissions</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role: any) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" weight="bold" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(role.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissions(role)}
                          >
                            <Gear className="mr-1 h-3 w-3" weight="bold" />
                            Permissions
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(role)}
                          >
                            <PencilSimple className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(role.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" weight="bold" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>
                  Update the role name and description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Role Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRole.isPending}>
                  {updateRole.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Permissions for "{selectedRole?.name}"</DialogTitle>
              <DialogDescription>
                Configure which features and locations this role can access
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={permissionsTab} onValueChange={setPermissionsTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="features" className="flex items-center gap-2">
                  <Gear className="h-4 w-4" weight="bold" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" weight="bold" />
                  Locations
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="features" className="flex-1 overflow-auto mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select which features/tabs users with this role can access. Users will only see the tabs they have permission for.
                  </p>
                  <div className="grid gap-3">
                    {availableFeatures.map((feature: Feature) => (
                      <div
                        key={feature.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedFeatures.includes(feature.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => handleFeatureToggle(feature.id)}
                      >
                        <Checkbox
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{feature.label}</div>
                          <div className="text-sm text-muted-foreground">{feature.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> Super Admins always have access to all features regardless of role assignments.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="locations" className="flex-1 overflow-auto mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select which locations this role can access and whether they have read-only or read-write access.
                  </p>
                  {locations.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No locations available. Create locations first.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-center">Read Access</TableHead>
                          <TableHead className="text-center">Write Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.map((perm) => (
                          <TableRow key={perm.locationId}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" weight="bold" />
                                {perm.locationName}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.canRead}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(perm.locationId, "canRead", !!checked)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={perm.canWrite}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(perm.locationId, "canWrite", !!checked)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Read Access:</strong> Can view data from this location</p>
                    <p><strong>Write Access:</strong> Can create, edit, and delete data (includes read access)</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsPermissionsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={savePermissions} 
                disabled={setPermissionsMutation.isPending || setFeaturePermissionsMutation.isPending}
              >
                {(setPermissionsMutation.isPending || setFeaturePermissionsMutation.isPending) && (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Permissions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
