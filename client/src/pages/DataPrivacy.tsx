import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";

import { DownloadSimple, Trash, Shield, FileText, Clock, CheckCircle, Warning, ArrowSquareOut } from "@phosphor-icons/react";
export default function DataPrivacy() {
  // Get user from trpc auth query
  const { data: user } = trpc.auth.me.useQuery();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [consents, setConsents] = useState({
    marketingEmails: false,
    productUpdates: true,
    auditReminders: true,
    analyticsTracking: true,
  });

  // Mock data export requests
  const [exportRequests] = useState([
    { id: 1, status: "completed", requestedAt: "2024-12-10", completedAt: "2024-12-10", downloadUrl: "#" },
    { id: 2, status: "processing", requestedAt: "2024-12-15", completedAt: null, downloadUrl: null },
  ]);

  const handleConsentChange = (key: keyof typeof consents, value: boolean) => {
    setConsents({ ...consents, [key]: value });
    toast.success("Preferences updated");
  };

  const handleExportRequest = () => {
    toast.success("Data export request submitted. You will receive an email when your data is ready to download.");
    setIsExportDialogOpen(false);
  };

  const handleDeleteRequest = () => {
    if (deleteConfirmation !== "DELETE MY DATA") {
      toast.error("Please type 'DELETE MY DATA' to confirm");
      return;
    }
    toast.success("Account deletion request submitted. You will receive a confirmation email.");
    setIsDeleteDialogOpen(false);
    setDeleteConfirmation("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Privacy Settings</h1>
          <p className="text-muted-foreground">
            Manage your privacy preferences and exercise your GDPR rights
          </p>
        </div>

        {/* Privacy Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Privacy at a Glance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-medium">Data Encrypted</h3>
                <p className="text-sm text-muted-foreground">
                  All your data is encrypted at rest and in transit
                </p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <Shield className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-medium">GDPR Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  We comply with UK GDPR and Data Protection Act 2018
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
                <FileText className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-medium">AI Anonymisation</h3>
                <p className="text-sm text-muted-foreground">
                  Documents are anonymised before AI processing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
            <CardDescription>
              Control what communications you receive from us
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="marketing" className="font-medium">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive news about new features, tips, and promotional offers
                </p>
              </div>
              <Switch
                id="marketing"
                checked={consents.marketingEmails}
                onCheckedChange={(v) => handleConsentChange("marketingEmails", v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="updates" className="font-medium">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Important updates about platform changes and new features
                </p>
              </div>
              <Switch
                id="updates"
                checked={consents.productUpdates}
                onCheckedChange={(v) => handleConsentChange("productUpdates", v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="reminders" className="font-medium">Audit Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Email notifications when audits are due or overdue
                </p>
              </div>
              <Switch
                id="reminders"
                checked={consents.auditReminders}
                onCheckedChange={(v) => handleConsentChange("auditReminders", v)}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="analytics" className="font-medium">Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve by allowing anonymous usage analytics
                </p>
              </div>
              <Switch
                id="analytics"
                checked={consents.analyticsTracking}
                onCheckedChange={(v) => handleConsentChange("analyticsTracking", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DownloadSimple className="h-5 w-5" />
              Export Your Data
            </CardTitle>
            <CardDescription>
              Download a copy of all personal data we hold about you (Right of Access)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>What's included in your data export?</AlertTitle>
              <AlertDescription>
                Your export will include: account information, compliance assessments, 
                AI audit history (anonymised feedback only), activity logs, and any 
                other personal data associated with your account.
              </AlertDescription>
            </Alert>

            {/* Previous Export Requests */}
            {exportRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Previous Export Requests</h4>
                {exportRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {request.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.status === "completed" 
                            ? `Completed ${new Date(request.completedAt!).toLocaleDateString()}`
                            : "Processing..."}
                        </p>
                      </div>
                    </div>
                    {request.status === "completed" && (
                      <Button variant="outline" size="sm">
                        <DownloadSimple className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {request.status === "processing" && (
                      <Badge variant="secondary">Processing</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <DownloadSimple className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Data Export</DialogTitle>
                  <DialogDescription>
                    We will compile all your personal data into a downloadable file. 
                    This usually takes 24-48 hours. You will receive an email when 
                    your data is ready.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Your export will be sent to: <strong>{user?.email || "your registered email"}</strong>
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExportRequest}>
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash className="h-5 w-5" />
              Delete Your Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data (Right to Erasure)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Warning className="h-4 w-4" />
              <AlertTitle>Warning: This action cannot be undone</AlertTitle>
              <AlertDescription>
                Deleting your account will permanently remove all your personal data, 
                including compliance records, audit history, and account settings. 
                Some data may be retained for legal/regulatory purposes (e.g., 7-year 
                retention for compliance records).
              </AlertDescription>
            </Alert>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Request Account Deletion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Your Account</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account and all associated data. 
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="font-medium text-sm mb-2">What will be deleted:</h4>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li>Your account and login credentials</li>
                      <li>All compliance assessments you created</li>
                      <li>AI audit history and feedback</li>
                      <li>Personal preferences and settings</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h4 className="font-medium text-sm mb-2">What will be retained:</h4>
                    <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
                      <li>Anonymised compliance records (regulatory requirement)</li>
                      <li>Audit logs for security purposes (12 months)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Type "DELETE MY DATA" to confirm:</Label>
                    <input
                      id="confirm"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE MY DATA"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteRequest}
                    disabled={deleteConfirmation !== "DELETE MY DATA"}
                  >
                    Permanently Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>More Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <a 
                href="/privacy-policy" 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Privacy Policy</span>
                </div>
                <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
              </a>
              <a 
                href="/terms-of-service" 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span>Terms of Service</span>
                </div>
                <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
              </a>
              <a 
                href="https://ico.org.uk" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>ICO Website</span>
                </div>
                <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
              </a>
              <a 
                href="mailto:privacy@carecompliancesystem.co.uk" 
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span>Contact Privacy Team</span>
                </div>
                <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
