import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Settings as SettingsIcon, User, Lock, Loader2, CheckCircle, Shield, Smartphone, QrCode, Key, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user, refresh } = useAuth();
  const trpcUtils = trpc.useUtils();
  
  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  
  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  
  const updateProfile = trpc.auth.updateProfile.useMutation();
  const updatePassword = trpc.auth.updatePassword.useMutation();
  
  // 2FA mutations and queries
  const { data: twoFAStatus, refetch: refetch2FAStatus } = trpc.auth.get2FAStatus.useQuery();
  const setup2FA = trpc.auth.setup2FA.useMutation();
  const verify2FA = trpc.auth.verify2FA.useMutation();
  const disable2FA = trpc.auth.disable2FA.useMutation();
  
  const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCode: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    
    try {
      await updateProfile.mutateAsync({ name: profileName });
      await trpcUtils.auth.me.invalidate();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    
    setIsPasswordSaving(true);
    
    try {
      await updatePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password updated successfully");
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const result = await setup2FA.mutateAsync();
      setQrCodeData(result);
      setShow2FASetup(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to setup 2FA");
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    
    try {
      await verify2FA.mutateAsync({ code: verificationCode });
      toast.success("Two-factor authentication enabled successfully!");
      setShow2FASetup(false);
      setVerificationCode("");
      setQrCodeData(null);
      refetch2FAStatus();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    }
  };

  const handleDisable2FA = async () => {
    if (disableCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    
    try {
      await disable2FA.mutateAsync({ code: disableCode });
      toast.success("Two-factor authentication disabled");
      setShow2FADisable(false);
      setDisableCode("");
      refetch2FAStatus();
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact an administrator if needed.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <Button type="submit" disabled={isProfileSaving}>
                {isProfileSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>
              Change your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <Button type="submit" disabled={isPasswordSaving}>
                {isPasswordSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account using an authenticator app.
              </CardDescription>
            </div>
            {twoFAStatus?.enabled && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {twoFAStatus?.enabled ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Two-factor authentication is active</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your account is protected with an additional layer of security. You'll need to enter a code from your authenticator app when signing in.
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShow2FADisable(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Disable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Two-factor authentication is not enabled</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Enable 2FA to add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Smartphone className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 1</p>
                    <p className="text-xs text-muted-foreground">Download an authenticator app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <QrCode className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 2</p>
                    <p className="text-xs text-muted-foreground">Scan the QR code</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <Key className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 3</p>
                    <p className="text-xs text-muted-foreground">Enter verification code</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSetup2FA} disabled={setup2FA.isPending}>
                {setup2FA.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Enable Two-Factor Authentication
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-lg font-semibold capitalize">{user?.role || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <p className="text-lg font-semibold">{user?.superAdmin ? "Super Admin" : "Standard User"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Sign In</p>
              <p className="text-lg font-semibold">
                {user?.lastSignedIn 
                  ? new Date(user.lastSignedIn).toLocaleDateString() 
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app, then enter the verification code.
            </DialogDescription>
          </DialogHeader>
          
          {qrCodeData && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border-2 border-dashed">
                  <img 
                    src={qrCodeData.qrCode} 
                    alt="2FA QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>
              
              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all select-all">
                  {qrCodeData.secret}
                </div>
              </div>
              
              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShow2FASetup(false);
                    setVerificationCode("");
                    setQrCodeData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleVerify2FA}
                  disabled={verify2FA.isPending || verificationCode.length !== 6}
                >
                  {verify2FA.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Verify & Enable
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={show2FADisable} onOpenChange={setShow2FADisable}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your current authenticator code to disable 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Disabling two-factor authentication will remove the extra security layer from your account. Anyone with your password will be able to access your account.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShow2FADisable(false);
                  setDisableCode("");
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={handleDisable2FA}
                disabled={disable2FA.isPending || disableCode.length !== 6}
              >
                {disable2FA.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Disable 2FA
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
