import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import DOMPurify from 'dompurify';
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  Shield,
  UserCircle,
  ExternalLink,
} from "lucide-react";

export default function EmailSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recipients");
  
  // Recipients state
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<any>(null);
  const [recipientForm, setRecipientForm] = useState({
    email: "",
    name: "",
    recipientType: "other" as const,
    receiveComplianceAlerts: true,
    receiveAuditReminders: true,
    receiveIncidentAlerts: true,
  });

  // Templates state
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    templateType: "compliance_alert" as const,
    name: "",
    subject: "",
    bodyHtml: "",
    headerColor: "#1e40af",
    footerText: "",
    isDefault: false,
  });

  // Queries
  const { data: recipients = [], refetch: refetchRecipients } = trpc.emailSettings.getRecipients.useQuery();
  const { data: templates = [], refetch: refetchTemplates } = trpc.emailSettings.getTemplates.useQuery();

  // Mutations
  const createRecipient = trpc.emailSettings.createRecipient.useMutation({
    onSuccess: () => {
      toast.success("Recipient added successfully");
      refetchRecipients();
      setShowRecipientDialog(false);
      resetRecipientForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateRecipient = trpc.emailSettings.updateRecipient.useMutation({
    onSuccess: () => {
      toast.success("Recipient updated successfully");
      refetchRecipients();
      setShowRecipientDialog(false);
      resetRecipientForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteRecipient = trpc.emailSettings.deleteRecipient.useMutation({
    onSuccess: () => {
      toast.success("Recipient deleted");
      refetchRecipients();
    },
    onError: (error) => toast.error(error.message),
  });

  const createTemplate = trpc.emailSettings.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      refetchTemplates();
      setShowTemplateDialog(false);
      resetTemplateForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateTemplate = trpc.emailSettings.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      refetchTemplates();
      setShowTemplateDialog(false);
      resetTemplateForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteTemplate = trpc.emailSettings.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      refetchTemplates();
    },
    onError: (error) => toast.error(error.message),
  });

  const initializeDefaults = trpc.emailSettings.initializeDefaults.useMutation({
    onSuccess: () => {
      toast.success("Default templates created");
      refetchTemplates();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetRecipientForm = () => {
    setEditingRecipient(null);
    setRecipientForm({
      email: "",
      name: "",
      recipientType: "other",
      receiveComplianceAlerts: true,
      receiveAuditReminders: true,
      receiveIncidentAlerts: true,
    });
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateForm({
      templateType: "compliance_alert",
      name: "",
      subject: "",
      bodyHtml: "",
      headerColor: "#1e40af",
      footerText: "",
      isDefault: false,
    });
  };

  const openEditRecipient = (recipient: any) => {
    setEditingRecipient(recipient);
    setRecipientForm({
      email: recipient.email,
      name: recipient.name || "",
      recipientType: recipient.recipientType,
      receiveComplianceAlerts: recipient.receiveComplianceAlerts,
      receiveAuditReminders: recipient.receiveAuditReminders,
      receiveIncidentAlerts: recipient.receiveIncidentAlerts,
    });
    setShowRecipientDialog(true);
  };

  const openEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateForm({
      templateType: template.templateType,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      headerColor: template.headerColor || "#1e40af",
      footerText: template.footerText || "",
      isDefault: template.isDefault,
    });
    setShowTemplateDialog(true);
  };

  const handleSaveRecipient = () => {
    if (editingRecipient) {
      updateRecipient.mutate({ id: editingRecipient.id, ...recipientForm });
    } else {
      createRecipient.mutate(recipientForm);
    }
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, ...templateForm });
    } else {
      createTemplate.mutate(templateForm);
    }
  };

  const getRecipientTypeIcon = (type: string) => {
    switch (type) {
      case "manager": return <UserCircle className="h-4 w-4" />;
      case "cqc_contact": return <Shield className="h-4 w-4" />;
      case "owner": return <Building className="h-4 w-4" />;
      case "external": return <ExternalLink className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRecipientTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manager: "Manager",
      cqc_contact: "CQC Contact",
      owner: "Owner",
      external: "External",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getTemplateTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      compliance_alert: "Compliance Alert",
      audit_reminder: "Audit Reminder",
      audit_overdue: "Audit Overdue",
      incident_alert: "Incident Alert",
      weekly_summary: "Weekly Summary",
      monthly_report: "Monthly Report",
    };
    return labels[type] || type;
  };

  if (!user?.superAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only super administrators can access email settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            Email Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage email recipients and customize notification templates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="recipients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Recipients
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Recipients</CardTitle>
                <CardDescription>
                  Configure who receives compliance alerts, audit reminders, and incident notifications
                </CardDescription>
              </div>
              <Button onClick={() => { resetRecipientForm(); setShowRecipientDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </CardHeader>
            <CardContent>
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email recipients configured yet.</p>
                  <p className="text-sm">Add recipients to receive compliance notifications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          {getRecipientTypeIcon(recipient.recipientType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{recipient.name || recipient.email}</span>
                            <Badge variant={recipient.isActive ? "default" : "secondary"}>
                              {recipient.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {getRecipientTypeLabel(recipient.recipientType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{recipient.email}</p>
                          <div className="flex gap-2 mt-1">
                            {recipient.receiveComplianceAlerts && (
                              <Badge variant="outline" className="text-xs">Compliance</Badge>
                            )}
                            {recipient.receiveAuditReminders && (
                              <Badge variant="outline" className="text-xs">Audits</Badge>
                            )}
                            {recipient.receiveIncidentAlerts && (
                              <Badge variant="outline" className="text-xs">Incidents</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditRecipient(recipient)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this recipient?")) {
                              deleteRecipient.mutate({ id: recipient.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Customize the content and branding of notification emails
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {templates.length === 0 && (
                  <Button variant="outline" onClick={() => initializeDefaults.mutate()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Default Templates
                  </Button>
                )}
                <Button onClick={() => { resetTemplateForm(); setShowTemplateDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email templates configured yet.</p>
                  <p className="text-sm">Create default templates to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {templates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: template.headerColor || "#1e40af" }}
                            />
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            {template.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                            <Badge variant={template.isActive ? "default" : "outline"}>
                              {template.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          {getTemplateTypeLabel(template.templateType)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          Subject: {template.subject}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEditTemplate(template)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this template?")) {
                                deleteTemplate.mutate({ id: template.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Variables Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Template Variables</CardTitle>
              <CardDescription>
                Use these placeholders in your templates - they will be replaced with actual values when emails are sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div><code className="bg-muted px-1 rounded">{"{{companyName}}"}</code> - Company name</div>
                <div><code className="bg-muted px-1 rounded">{"{{locationName}}"}</code> - Location name</div>
                <div><code className="bg-muted px-1 rounded">{"{{recipientName}}"}</code> - Recipient's name</div>
                <div><code className="bg-muted px-1 rounded">{"{{complianceRate}}"}</code> - Compliance percentage</div>
                <div><code className="bg-muted px-1 rounded">{"{{nonCompliantCount}}"}</code> - Non-compliant items</div>
                <div><code className="bg-muted px-1 rounded">{"{{overdueCount}}"}</code> - Overdue actions</div>
                <div><code className="bg-muted px-1 rounded">{"{{auditType}}"}</code> - Audit type name</div>
                <div><code className="bg-muted px-1 rounded">{"{{dueDate}}"}</code> - Due date</div>
                <div><code className="bg-muted px-1 rounded">{"{{headerColor}}"}</code> - Header color</div>
                <div><code className="bg-muted px-1 rounded">{"{{footerText}}"}</code> - Footer text</div>
                <div><code className="bg-muted px-1 rounded">{"{{incidentType}}"}</code> - Incident type</div>
                <div><code className="bg-muted px-1 rounded">{"{{severity}}"}</code> - Incident severity</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipient Dialog */}
      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecipient ? "Edit Recipient" : "Add Email Recipient"}</DialogTitle>
            <DialogDescription>
              Configure who should receive email notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={recipientForm.email}
                onChange={(e) => setRecipientForm({ ...recipientForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={recipientForm.name}
                onChange={(e) => setRecipientForm({ ...recipientForm, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Recipient Type</Label>
              <Select
                value={recipientForm.recipientType}
                onValueChange={(value: any) => setRecipientForm({ ...recipientForm, recipientType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cqc_contact">CQC Contact</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Notification Preferences</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compliance Alerts</span>
                <Switch
                  checked={recipientForm.receiveComplianceAlerts}
                  onCheckedChange={(checked) => setRecipientForm({ ...recipientForm, receiveComplianceAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audit Reminders</span>
                <Switch
                  checked={recipientForm.receiveAuditReminders}
                  onCheckedChange={(checked) => setRecipientForm({ ...recipientForm, receiveAuditReminders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Incident Alerts</span>
                <Switch
                  checked={recipientForm.receiveIncidentAlerts}
                  onCheckedChange={(checked) => setRecipientForm({ ...recipientForm, receiveIncidentAlerts: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipientDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecipient} disabled={!recipientForm.email}>
              {editingRecipient ? "Save Changes" : "Add Recipient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Email Template"}</DialogTitle>
            <DialogDescription>
              Customize the email content and styling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type *</Label>
                <Select
                  value={templateForm.templateType}
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, templateType: value })}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance_alert">Compliance Alert</SelectItem>
                    <SelectItem value="audit_reminder">Audit Reminder</SelectItem>
                    <SelectItem value="audit_overdue">Audit Overdue</SelectItem>
                    <SelectItem value="incident_alert">Incident Alert</SelectItem>
                    <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                    <SelectItem value="monthly_report">Monthly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="My Custom Template"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="⚠️ Compliance Alert - {{companyName}}"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headerColor">Header Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="headerColor"
                    type="color"
                    value={templateForm.headerColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, headerColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={templateForm.headerColor}
                    onChange={(e) => setTemplateForm({ ...templateForm, headerColor: e.target.value })}
                    placeholder="#1e40af"
                  />
                </div>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={templateForm.isDefault}
                    onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isDefault: checked })}
                  />
                  <Label>Set as default template</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyHtml">Email Body (HTML) *</Label>
              <Textarea
                id="bodyHtml"
                value={templateForm.bodyHtml}
                onChange={(e) => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
                placeholder="<div>Your email content here...</div>"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                value={templateForm.footerText}
                onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                placeholder="This is an automated message from Care Compliance System"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateForm.name || !templateForm.subject || !templateForm.bodyHtml}
            >
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how the email will look (with sample data)
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="border rounded-lg overflow-hidden">
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(editingTemplate.bodyHtml
                    .replace(/\{\{companyName\}\}/g, "Test Care Home")
                    .replace(/\{\{locationName\}\}/g, "Main Office"))
                    .replace(/\{\{recipientName\}\}/g, "John Smith")
                    .replace(/\{\{complianceRate\}\}/g, "75")
                    .replace(/\{\{nonCompliantCount\}\}/g, "12")
                    .replace(/\{\{overdueCount\}\}/g, "3")
                    .replace(/\{\{headerColor\}\}/g, editingTemplate.headerColor || "#1e40af")
                    .replace(/\{\{footerText\}\}/g, editingTemplate.footerText || ""),
                }}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
