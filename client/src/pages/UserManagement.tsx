import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLocation } from "wouter";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Spinner, Plus, PencilSimple, Trash, Shield, Users, Envelope, User, Key, ShieldCheck, ShieldWarning, CheckCircle, XCircle, Ticket, CreditCard, Warning } from "@phosphor-icons/react";

export default function UserManagement() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: roles = [] } = trpc.roles.list.useQuery();
  const { data: licenseInfo, refetch: refetchLicenses } = trpc.users.checkLicenseAvailability.useQuery();
  
  const createUser = trpc.users.create.useMutation();
  const updateUser = trpc.users.update.useMutation();
  const deleteUser = trpc.users.delete.useMutation();
  const assignRoles = trpc.roles.assignUserRoles.useMutation();
  const assignLicense = trpc.subscription.assignLicenseToUser.useMutation();
  const unassignLicense = trpc.subscription.unassignLicenseFromUser.useMutation();
  const { data: subscription, refetch: refetchSubscription } = trpc.subscription.getSubscription.useQuery();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [isLicenseWarningOpen, setIsLicenseWarningOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", superAdmin: false });
  const [createRoleIds, setCreateRoleIds] = useState<number[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  
  const trpcUtils = trpc.useUtils();

  // Check if user is super admin
  if (!currentUser?.superAdmin) {
    return (
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" weight="bold" />
                Access Denied
              </CardTitle>
              <CardDescription>
                Only super administrators can access user management.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
    );
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", superAdmin: false });
    setCreateRoleIds([]);
    setSelectedUser(null);
    setPendingUserData(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.superAdmin && createRoleIds.length === 0) {
      toast.error("Please select at least one role or make the user a Super Admin");
      return;
    }
    
    // Check license availability before creating ANY user (all users need licenses)
    const hasAvailableLicense = licenseInfo && licenseInfo.availableLicenses > 0;
    
    if (!hasAvailableLicense) {
      // Store the pending user data and show license warning
      setPendingUserData({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        superAdmin: formData.superAdmin,
        roleIds: createRoleIds,
      });
      setIsCreateOpen(false);
      setIsLicenseWarningOpen(true);
      return;
    }
    
    await createUserWithLicense();
  };

  const createUserWithLicense = async (skipLicenseAssignment = false) => {
    const userData = pendingUserData || {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      superAdmin: formData.superAdmin,
    };
    const roleIds = pendingUserData?.roleIds || createRoleIds;
    
    try {
      const newUser = await createUser.mutateAsync({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        superAdmin: userData.superAdmin,
        assignLicense: !skipLicenseAssignment, // All users need licenses, including super admins
      });
      
      // Assign roles if any selected
      if (roleIds.length > 0 && newUser?.id) {
        await assignRoles.mutateAsync({ userId: newUser.id, roleIds });
      }
      
      toast.success("User created successfully" + (!skipLicenseAssignment ? " and license assigned" : ""));
      setIsCreateOpen(false);
      setIsLicenseWarningOpen(false);
      resetForm();
      refetchUsers();
      refetchLicenses();
      refetchSubscription();
    } catch (error: any) {
      if (error.message === "NO_LICENSES_AVAILABLE") {
        // Store the pending user data and show license warning
        setPendingUserData({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          superAdmin: userData.superAdmin,
          roleIds,
        });
        setIsCreateOpen(false);
        setIsLicenseWarningOpen(true);
      } else {
        toast.error(error.message || "Failed to create user");
      }
    }
  };

  const handlePurchaseLicenses = () => {
    setIsLicenseWarningOpen(false);
    // Navigate to subscription page
    setLocation("/admin/subscription");
  };

  const handleCreateWithoutLicense = async () => {
    if (!pendingUserData) return;
    
    try {
      const newUser = await createUser.mutateAsync({
        name: pendingUserData.name,
        email: pendingUserData.email,
        password: pendingUserData.password,
        superAdmin: pendingUserData.superAdmin,
        assignLicense: false, // Don't assign license
      });
      
      // Assign roles if any selected
      if (pendingUserData.roleIds?.length > 0 && newUser?.id) {
        await assignRoles.mutateAsync({ userId: newUser.id, roleIds: pendingUserData.roleIds });
      }
      
      toast.success("User created without license. They will have limited access until a license is assigned.");
      setIsLicenseWarningOpen(false);
      resetForm();
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const toggleCreateRole = (roleId: number) => {
    setCreateRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({ 
      name: user.name || "", 
      email: user.email, 
      password: "", 
      superAdmin: Boolean(user.superAdmin) // Convert number to boolean
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({ 
        userId: selectedUser.id, 
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        superAdmin: Boolean(formData.superAdmin),
      });
      toast.success("User updated successfully");
      setIsEditOpen(false);
      resetForm();
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteUser.mutateAsync({ userId });
      toast.success("User deleted successfully");
      refetchUsers();
      refetchLicenses();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openRolesDialog = async (user: any) => {
    setSelectedUser(user);
    setIsLoadingRoles(true);
    setSelectedRoleIds([]);
    setIsRolesOpen(true);
    
    // Fetch user's current roles using the utils
    try {
      const userRoles = await trpcUtils.roles.getUserRoles.fetch({ userId: user.id });
      setSelectedRoleIds(userRoles.map((r: any) => r.roleId));
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      await assignRoles.mutateAsync({ userId: selectedUser.id, roleIds: selectedRoleIds });
      toast.success("Roles updated successfully");
      setIsRolesOpen(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      toast.error("Failed to update roles");
    }
  };

  const handleAssignLicense = async (userId: number) => {
    try {
      await assignLicense.mutateAsync({ userId });
      toast.success("License assigned successfully");
      refetchUsers();
      refetchLicenses();
      refetchSubscription();
    } catch (error: any) {
      if (error.message?.includes("No available licenses")) {
        toast.error("No available licenses. Please purchase more licenses first.", {
          action: {
            label: "Purchase",
            onClick: () => setLocation("/admin/subscription"),
          },
        });
      } else {
        toast.error(error.message || "Failed to assign license");
      }
    }
  };

  const handleUnassignLicense = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this user's license? They will lose access to the system.")) return;
    try {
      await unassignLicense.mutateAsync({ userId });
      toast.success("License removed successfully");
      refetchUsers();
      refetchLicenses();
      refetchSubscription();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove license");
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage users and their access to the system</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" weight="bold" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account. After creation, assign roles to grant location access.
                  </DialogDescription>
                </DialogHeader>
                
                {/* License availability warning - ALL users need licenses */}
                {licenseInfo && licenseInfo.availableLicenses <= 0 && (
                  <Alert variant="destructive" className="mt-4">
                    <Warning className="h-4 w-4" />
                    <AlertTitle>No Licenses Available</AlertTitle>
                    <AlertDescription>
                      You have used all {licenseInfo.totalLicenses} licenses. Purchase additional licenses to add more users.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* License info banner */}
                {licenseInfo && licenseInfo.availableLicenses > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Ticket className="h-4 w-4" />
                      <span><strong>{licenseInfo.availableLicenses}</strong> of {licenseInfo.totalLicenses} licenses available</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="superAdmin"
                      checked={formData.superAdmin}
                      onCheckedChange={(checked) => {
                        setFormData(prev => ({ ...prev, superAdmin: !!checked }));
                        if (checked) setCreateRoleIds([]);
                      }}
                    />
                    <Label htmlFor="superAdmin" className="text-sm font-normal">
                      Make this user a Super Admin (full system access)
                    </Label>
                  </div>
                  {!formData.superAdmin && (
                    <div className="space-y-2 pt-2">
                      <Label>Assign Roles *</Label>
                      <p className="text-xs text-muted-foreground">Select at least one role to grant location access</p>
                      {roles.length === 0 ? (
                        <p className="text-sm text-amber-600">No roles created yet. Create roles in Role Management first.</p>
                      ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                          {roles.map((role: any) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`create-role-${role.id}`}
                                checked={createRoleIds.includes(role.id)}
                                onCheckedChange={() => toggleCreateRole(role.id)}
                              />
                              <Label htmlFor={`create-role-${role.id}`} className="text-sm font-normal cursor-pointer">
                                {role.name}
                                {role.description && <span className="text-muted-foreground"> - {role.description}</span>}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* License Warning Dialog */}
        <Dialog open={isLicenseWarningOpen} onOpenChange={setIsLicenseWarningOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Warning className="h-5 w-5" />
                No Licenses Available
              </DialogTitle>
              <DialogDescription>
                You have used all your available licenses. To add this user with full access, you need to purchase additional licenses.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Licenses:</span>
                  <span className="font-medium">{licenseInfo?.totalLicenses || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used Licenses:</span>
                  <span className="font-medium">{licenseInfo?.usedLicenses || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium text-red-600">{licenseInfo?.availableLicenses || 0}</span>
                </div>
              </div>
              
              {pendingUserData && (
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Pending user:</p>
                  <p className="font-medium">{pendingUserData.name}</p>
                  <p className="text-sm text-muted-foreground">{pendingUserData.email}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => { setIsLicenseWarningOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleCreateWithoutLicense}>
                Create Without License
              </Button>
              <Button onClick={handlePurchaseLicenses} className="bg-[#1F7AE0] hover:bg-[#1a6bc7]">
                <CreditCard className="mr-2 h-4 w-4" />
                Purchase Licenses
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" weight="bold" />
              Users
            </CardTitle>
            <CardDescription>
              {users.length} user{users.length !== 1 ? "s" : ""} in your organisation
              {subscription?.licenseStats && (
                <span className="ml-2 text-xs">
                  • <span className={subscription.licenseStats.unassigned > 0 ? "text-green-600" : "text-red-600"} style={{ fontWeight: 500 }}>{subscription.licenseStats.unassigned}</span> of {subscription.licenseStats.total} licenses available
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" weight="bold" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" weight="bold" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name || "Unnamed User"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.superAdmin ? (
                          <Badge variant="default" className="bg-purple-600">
                            <ShieldCheck className="mr-1 h-3 w-3" weight="bold" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Key className="mr-1 h-3 w-3" weight="bold" />
                            Role-Based
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.hasLicense ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" weight="bold" />
                            Licensed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            <XCircle className="mr-1 h-3 w-3" weight="bold" />
                            No License
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.hasLicense ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignLicense(user.id)}
                              title="Remove License"
                            >
                              <Ticket className="h-4 w-4 text-red-500" weight="bold" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignLicense(user.id)}
                              title="Assign License"
                              disabled={!subscription?.licenseStats?.unassigned}
                            >
                              <Ticket className="h-4 w-4 text-green-500" weight="bold" />
                            </Button>
                          )}
                          {!user.superAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRolesDialog(user)}
                              title="Manage Roles"
                            >
                              <Key className="h-4 w-4" weight="bold" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                          >
                            <PencilSimple className="h-4 w-4" weight="bold" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              title="Delete User"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" weight="bold" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
          <DialogContent>
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user details. Leave password blank to keep unchanged.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password (optional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    minLength={6}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="edit-superAdmin"
                    checked={formData.superAdmin}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, superAdmin: !!checked }))}
                  />
                  <Label htmlFor="edit-superAdmin" className="text-sm font-normal">
                    Super Admin (full system access)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manage Roles Dialog */}
        <Dialog open={isRolesOpen} onOpenChange={(open) => { setIsRolesOpen(open); if (!open) setSelectedUser(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Roles</DialogTitle>
              <DialogDescription>
                Assign roles to {selectedUser?.name || selectedUser?.email} to grant location access.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-amber-600">No roles created yet. Create roles in Role Management first.</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((role: any) => (
                    <div key={role.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{role.name}</span>
                        {role.description && <span className="text-muted-foreground"> - {role.description}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRolesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoles} disabled={assignRoles.isPending}>
                {assignRoles.isPending && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
                Save Roles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Invitation Dialog - keeping existing functionality */}
      </div>
  );
}
