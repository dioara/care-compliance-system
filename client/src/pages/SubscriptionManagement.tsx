import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  CreditCard, Users, Plus, Minus, Warning, CheckCircle, 
  Clock, XCircle, ArrowSquareOut, ArrowsClockwise, UserPlus, UserMinus, Receipt, DownloadSimple, FileText, ArrowsDownUp, TrendUp, TrendDown
} from "@phosphor-icons/react";

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showAddLicensesDialog, setShowAddLicensesDialog] = useState(false);
  const [additionalLicenses, setAdditionalLicenses] = useState(1);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [newLicenseCount, setNewLicenseCount] = useState(1);

  const { data: subscription, refetch: refetchSubscription } = trpc.subscription.getSubscription.useQuery();
  const { data: trialStatus } = trpc.subscription.getTrialStatus.useQuery();
  const { data: pricing } = trpc.subscription.getPricing.useQuery({ quantity, billingInterval });
  const { data: licenses, refetch: refetchLicenses } = trpc.subscription.getLicenses.useQuery();
  const { data: usersWithoutLicenses } = trpc.subscription.getUsersWithoutLicenses.useQuery();
  const { data: billingHistory = [] } = trpc.subscription.getBillingHistory.useQuery();
  const { data: pricePreview, isLoading: previewLoading } = trpc.subscription.previewPriceChange.useQuery(
    { newQuantity: newLicenseCount },
    { enabled: showModifyDialog && newLicenseCount > 0 }
  );

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addLicensesMutation = trpc.subscription.addLicenses.useMutation({
    onSuccess: () => {
      toast.success("Licenses added successfully");
      refetchSubscription();
      refetchLicenses();
      setShowAddLicensesDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const modifyLicensesMutation = trpc.subscription.modifyLicenseCount.useMutation({
    onSuccess: (data) => {
      const changeText = data.change > 0 ? `Added ${data.change}` : `Removed ${Math.abs(data.change)}`;
      toast.success(`${changeText} license${Math.abs(data.change) !== 1 ? 's' : ''}. New total: ${data.newQuantity}`);
      refetchSubscription();
      refetchLicenses();
      setShowModifyDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const assignLicense = trpc.subscription.assignLicense.useMutation({
    onSuccess: () => {
      toast.success("License assigned successfully");
      refetchLicenses();
      setShowAssignDialog(false);
      setSelectedLicenseId(null);
      setSelectedUserId("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unassignLicense = trpc.subscription.unassignLicense.useMutation({
    onSuccess: () => {
      toast.success("License unassigned successfully");
      refetchLicenses();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelSubscription = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription will be canceled at the end of the billing period");
      refetchSubscription();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reactivateSubscription = trpc.subscription.reactivateSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription reactivated");
      refetchSubscription();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getBillingPortal = trpc.subscription.getBillingPortalUrl.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Check for success/canceled URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast.success("Subscription activated successfully!");
      refetchSubscription();
      refetchLicenses();
      window.history.replaceState({}, "", "/admin/subscription");
    } else if (params.get("canceled") === "true") {
      toast.info("Checkout was canceled");
      window.history.replaceState({}, "", "/admin/subscription");
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" weight="bold" />Active</Badge>;
      case "past_due":
        return <Badge className="bg-orange-500"><Warning className="h-3 w-3 mr-1" weight="bold" />Past Due</Badge>;
      case "canceled":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" weight="bold" />Canceled</Badge>;
      case "trialing":
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" weight="bold" />Trial</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" weight="bold" />Incomplete</Badge>;
    }
  };

  const unassignedLicenses = licenses?.filter(l => !l.userId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your licenses and billing</p>
        </div>
        {subscription?.stripeCustomerId && (
          <Button variant="outline" onClick={() => getBillingPortal.mutate()}>
            <ArrowSquareOut className="h-4 w-4 mr-2" weight="bold" />
            Billing Portal
          </Button>
        )}
      </div>

      {/* Trial Status Banner */}
      {trialStatus?.isTrial && (
        <Card className={trialStatus.isExpired ? "border-red-300 bg-red-50" : trialStatus.daysRemaining <= 7 ? "border-amber-300 bg-amber-50" : "border-violet-300 bg-violet-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${trialStatus.isExpired ? "text-red-600" : trialStatus.daysRemaining <= 7 ? "text-amber-600" : "text-violet-600"}`} weight="bold" />
                  {trialStatus.isExpired ? "Trial Expired" : "Free Trial"}
                </CardTitle>
                <CardDescription>
                  {trialStatus.isExpired 
                    ? "Your free trial has ended. Subscribe to continue using all features."
                    : `${trialStatus.daysRemaining} days remaining • ${trialStatus.trialLicensesCount} trial licenses included`}
                </CardDescription>
              </div>
              <Badge className={trialStatus.isExpired ? "bg-red-100 text-red-800" : trialStatus.daysRemaining <= 7 ? "bg-amber-100 text-amber-800" : "bg-violet-100 text-violet-800"}>
                {trialStatus.isExpired ? "Expired" : `${trialStatus.daysRemaining} days left`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-white/80 rounded-lg">
                <p className="text-sm text-muted-foreground">Trial Licenses</p>
                <p className="text-2xl font-bold">{trialStatus.trialLicensesCount}</p>
              </div>
              <div className="p-4 bg-white/80 rounded-lg">
                <p className="text-sm text-muted-foreground">Trial Ends</p>
                <p className="text-lg font-semibold">{trialStatus.trialEndsAt ? new Date(trialStatus.trialEndsAt).toLocaleDateString() : "N/A"}</p>
              </div>
              <div className="p-4 bg-white/80 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`text-lg font-semibold ${trialStatus.isExpired ? "text-red-600" : "text-green-600"}`}>
                  {trialStatus.isExpired ? "Expired" : "Active"}
                </p>
              </div>
            </div>
            {!trialStatus.isExpired && (
              <p className="mt-4 text-sm text-muted-foreground">
                Upgrade anytime to keep your licenses and unlock additional features. Your data will be preserved.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Status */}
      {subscription?.status === "active" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" weight="bold" />
                  Current Subscription
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Licenses</p>
                <p className="text-2xl font-bold">{subscription.licensesCount}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-green-600">{subscription.licenseStats.assigned}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-blue-600">{subscription.licenseStats.unassigned}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Billing</p>
                <p className="text-2xl font-bold capitalize">{subscription.billingInterval}</p>
              </div>
            </div>

            {subscription.currentPeriodEnd && (
              <p className="mt-4 text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd 
                  ? `Subscription ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Next billing date: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                }
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={() => {
                setNewLicenseCount(subscription.licensesCount || 1);
                setShowModifyDialog(true);
              }}>
                <ArrowsDownUp className="h-4 w-4 mr-2" weight="bold" />
                Modify Licenses
              </Button>
              <Button variant="outline" onClick={() => setShowAddLicensesDialog(true)}>
                <Plus className="h-4 w-4 mr-2" weight="bold" />
                Add Licenses
              </Button>
              {subscription.cancelAtPeriodEnd ? (
                <Button variant="outline" onClick={() => reactivateSubscription.mutate()}>
                  <ArrowsClockwise className="h-4 w-4 mr-2" weight="bold" />
                  Reactivate
                </Button>
              ) : (
                <Button variant="outline" className="text-destructive" onClick={() => cancelSubscription.mutate({ cancelImmediately: false })}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No Active Subscription - Show Purchase Options */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" weight="bold" />
              Start Your Subscription
            </CardTitle>
            <CardDescription>Choose your plan and number of licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Tiers */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">License Pricing</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold">£70<span className="text-sm font-normal text-muted-foreground">/license/month</span></p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" weight="bold" />1-5 licenses: Full price</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" weight="bold" />6-10 licenses: 10% discount</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" weight="bold" />11-20 licenses: 15% discount</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" weight="bold" />21+ licenses: 20% discount</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg bg-primary/5">
                <h3 className="font-semibold mb-2">Annual Billing</h3>
                <p className="text-lg">Save an additional <span className="text-2xl font-bold text-green-600">15%</span></p>
                <p className="text-sm text-muted-foreground mt-2">Pay annually and get 2 months free!</p>
              </div>
            </div>

            {/* Purchase Configuration */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Number of Licenses</label>
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" weight="bold" />
                  </Button>
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" weight="bold" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Billing Interval</label>
                <Select value={billingInterval} onValueChange={(v) => setBillingInterval(v as "monthly" | "annual")}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual (Save 15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Total</label>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{pricing?.totalBillingFormatted || "..."}</p>
                  <p className="text-sm text-muted-foreground">
                    {billingInterval === "annual" ? "per year" : "per month"}
                  </p>
                  {pricing && pricing.savings > 0 && (
                    <p className="text-sm text-green-600">You save {pricing.savingsFormatted}</p>
                  )}
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full" 
              onClick={() => createCheckout.mutate({ quantity, billingInterval })}
              disabled={createCheckout.isPending}
            >
              {createCheckout.isPending ? "Processing..." : "Subscribe Now"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* License Management */}
      {subscription?.status === "active" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" weight="bold" />
                  License Assignments
                </CardTitle>
                <CardDescription>Manage which users have access to the system</CardDescription>
              </div>
              {unassignedLicenses.length > 0 && (
                <Button onClick={() => setShowAssignDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" weight="bold" />
                  Assign License
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License ID</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses?.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono">#{license.id}</TableCell>
                    <TableCell>
                      {license.userId ? (
                        <div>
                          <p className="font-medium">{license.userName || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{license.userEmail}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {license.assignedAt 
                        ? new Date(license.assignedAt).toLocaleDateString()
                        : "-"
                      }
                    </TableCell>
                    <TableCell>
                      {license.userId 
                        ? <Badge className="bg-green-500">Assigned</Badge>
                        : <Badge variant="secondary">Available</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {license.userId ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => unassignLicense.mutate({ licenseId: license.id })}
                        >
                          <UserMinus className="h-4 w-4 mr-1" weight="bold" />
                          Unassign
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedLicenseId(license.id);
                            setShowAssignDialog(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" weight="bold" />
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!licenses || licenses.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No licenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Licenses Dialog */}
      <Dialog open={showAddLicensesDialog} onOpenChange={setShowAddLicensesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add More Licenses</DialogTitle>
            <DialogDescription>
              Add additional licenses to your subscription. You'll be charged a prorated amount.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Number of Additional Licenses</label>
            <div className="flex items-center gap-2 mt-2">
              <Button variant="outline" size="icon" onClick={() => setAdditionalLicenses(Math.max(1, additionalLicenses - 1))}>
                <Minus className="h-4 w-4" weight="bold" />
              </Button>
              <span className="w-12 text-center text-lg font-semibold">{additionalLicenses}</span>
              <Button variant="outline" size="icon" onClick={() => setAdditionalLicenses(additionalLicenses + 1)}>
                <Plus className="h-4 w-4" weight="bold" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLicensesDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => addLicensesMutation.mutate({ additionalLicenses })}
              disabled={addLicensesMutation.isPending}
            >
              {addLicensesMutation.isPending ? "Adding..." : "Add Licenses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Billing History Card */}
      {subscription?.stripeCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" weight="bold" />
              Billing History
            </CardTitle>
            <CardDescription>View your past invoices and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingHistory.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" weight="bold" />
                        {invoice.number || invoice.id.slice(-8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      £{(invoice.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'paid' && (
                        <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" weight="bold" />Paid</Badge>
                      )}
                      {invoice.status === 'open' && (
                        <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" weight="bold" />Open</Badge>
                      )}
                      {invoice.status === 'draft' && (
                        <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" weight="bold" />Draft</Badge>
                      )}
                      {invoice.status === 'uncollectible' && (
                        <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" weight="bold" />Uncollectible</Badge>
                      )}
                      {invoice.status === 'void' && (
                        <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" weight="bold" />Void</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.pdfUrl, '_blank')}
                          >
                            <DownloadSimple className="h-4 w-4 mr-1" weight="bold" />
                            PDF
                          </Button>
                        )}
                        {invoice.hostedUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hostedUrl, '_blank')}
                          >
                            <ArrowSquareOut className="h-4 w-4 mr-1" weight="bold" />
                            View
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {billingHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No invoices found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modify Licenses Dialog */}
      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowsDownUp className="h-5 w-5" weight="bold" />
              Modify License Count
            </DialogTitle>
            <DialogDescription>
              Upgrade or downgrade your subscription by changing the number of licenses.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Number of Licenses</label>
              <div className="flex items-center gap-3 mt-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setNewLicenseCount(Math.max(1, newLicenseCount - 1))}
                  disabled={newLicenseCount <= 1}
                >
                  <Minus className="h-4 w-4" weight="bold" />
                </Button>
                <span className="w-16 text-center text-2xl font-bold">{newLicenseCount}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setNewLicenseCount(newLicenseCount + 1)}
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
            </div>

            {pricePreview && pricePreview.available && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current licenses</span>
                  <span className="font-medium">{pricePreview.currentQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New total</span>
                  <span className="font-medium">{pricePreview.newQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className={`font-medium flex items-center gap-1 ${pricePreview.isUpgrade ? 'text-green-600' : 'text-orange-600'}`}>
                    {pricePreview.isUpgrade ? <TrendUp className="h-3 w-3" weight="bold" /> : <TrendDown className="h-3 w-3" weight="bold" />}
                    {pricePreview.change > 0 ? '+' : ''}{pricePreview.change}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prorated charge</span>
                  <span className="font-bold text-lg">{pricePreview.proratedAmountFormatted}</span>
                </div>
                {pricePreview.nextBillingDate && (
                  <p className="text-xs text-muted-foreground">
                    Next billing: {new Date(pricePreview.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {pricePreview && !pricePreview.available && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <Warning className="h-4 w-4" weight="bold" />
                  {pricePreview.message}
                </p>
                {pricePreview.assignedCount !== undefined && (
                  <p className="text-xs text-red-500 mt-1">
                    You have {pricePreview.assignedCount} licenses assigned. Unassign some first to downgrade.
                  </p>
                )}
              </div>
            )}

            {previewLoading && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Calculating price...</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModifyDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => modifyLicensesMutation.mutate({ newQuantity: newLicenseCount })}
              disabled={
                modifyLicensesMutation.isPending || 
                previewLoading || 
                !pricePreview?.available ||
                newLicenseCount === (pricePreview?.currentQuantity || 0)
              }
            >
              {modifyLicensesMutation.isPending ? "Updating..." : 
                pricePreview?.isUpgrade ? "Upgrade" : "Downgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign License Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign License</DialogTitle>
            <DialogDescription>
              Select a user to assign this license to. They will gain full access to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {usersWithoutLicenses?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!usersWithoutLicenses || usersWithoutLicenses.length === 0) && (
              <p className="text-sm text-muted-foreground mt-2">
                All users already have licenses assigned.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                const licenseId = selectedLicenseId || unassignedLicenses[0]?.id;
                if (licenseId && selectedUserId) {
                  assignLicense.mutate({ licenseId, userId: parseInt(selectedUserId) });
                }
              }}
              disabled={!selectedUserId || assignLicense.isPending}
            >
              {assignLicense.isPending ? "Assigning..." : "Assign License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
