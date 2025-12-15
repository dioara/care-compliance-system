import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, Users, Loader2, Mail, User, Key, ShieldCheck, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function UserManagement() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = trpc.users.list.useQuery();
  const { data: roles = [] } = trpc.roles.list.useQuery();
  
  const createUser = trpc.users.create.useMutation();
  const updateUser = trpc.users.update.useMutation();
  const deleteUser = trpc.users.delete.useMutation();
  const assignRoles = trpc.roles.assignUserRoles.useMutation();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRolesOpen, setIsRolesOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", superAdmin: false });
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Check if user is super admin
  if (!currentUser?.superAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                Only super administrators can access user management.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", superAdmin: false });
    setSelectedUser(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        superAdmin: formData.superAdmin,
      });
      toast.success("User created successfully");
      setIsCreateOpen(false);
      resetForm();
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({ 
      name: user.name || "", 
      email: user.email, 
      password: "", 
      superAdmin: user.superAdmin || false 
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
        superAdmin: formData.superAdmin,
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
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const openRolesDialog = async (user: any) => {
    setSelectedUser(user);
    // Fetch user's current roles
    try {
      const userRoles = await trpc.roles.getUserRoles.query({ userId: user.id });
      setSelectedRoleIds(userRoles.map((r: any) => r.roleId));
    } catch (error) {
      setSelectedRoleIds([]);
    }
    setIsRolesOpen(true);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const saveRoles = async () => {
    if (!selectedUser) return;
    try {
      await assignRoles.mutateAsync({ userId: selectedUser.id, roleIds: selectedRoleIds });
      toast.success("Roles assigned successfully");
      setIsRolesOpen(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      toast.error("Failed to assign roles");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Create and manage users and their role assignments
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
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
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, superAdmin: !!checked }))}
                    />
                    <Label htmlFor="superAdmin" className="text-sm font-normal">
                      Make this user a Super Admin (full access to all locations and settings)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>
              {users.length} user{users.length !== 1 ? "s" : ""} in your organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p>{user.name || "Unnamed User"}</p>
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.superAdmin ? (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            Standard User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastSignedIn 
                          ? new Date(user.lastSignedIn).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.superAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRolesDialog(user)}
                            >
                              <Key className="mr-1 h-3 w-3" />
                              Roles
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Edit User Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user details. Leave password blank to keep current password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
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
                    disabled={selectedUser?.id === currentUser?.id}
                  />
                  <Label htmlFor="edit-superAdmin" className="text-sm font-normal">
                    Super Admin (full access to all locations and settings)
                  </Label>
                </div>
                {selectedUser?.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground">
                    You cannot change your own super admin status
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Roles Dialog */}
        <Dialog open={isRolesOpen} onOpenChange={setIsRolesOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Roles to {selectedUser?.name || selectedUser?.email}</DialogTitle>
              <DialogDescription>
                Select which roles this user should have. Each role grants access to specific locations.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {roles.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No roles created yet</p>
                  <p className="text-sm">Create roles in Role Management first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {roles.map((role: any) => (
                    <div 
                      key={role.id} 
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleRole(role.id)}
                    >
                      <Checkbox
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRolesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveRoles} disabled={assignRoles.isPending}>
                {assignRoles.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Roles
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
