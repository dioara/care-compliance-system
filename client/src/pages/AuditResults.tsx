import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertTriangle, Plus, CalendarIcon, Upload, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const auditId = parseInt(id || "0");

  const [isActionPlanDialogOpen, setIsActionPlanDialogOpen] = useState(false);
  const [actionPlanData, setActionPlanData] = useState({
    issueDescription: "",
    ragStatus: "red" as "red" | "amber" | "green",
    responsiblePersonId: 0,
    targetCompletionDate: new Date(),
    actionTaken: "",
    notes: "",
  });

  // Fetch audit instance
  const { data: auditInstance, isLoading: loadingInstance } = trpc.audits.getAuditInstance.useQuery(
    { id: auditId },
    { enabled: !!auditId }
  );

  // Fetch audit template
  const { data: auditTemplate, isLoading: loadingTemplate } = trpc.audits.getAuditTemplate.useQuery(
    { auditTypeId: auditInstance?.auditTypeId || 0 },
    { enabled: !!auditInstance?.auditTypeId }
  );

  // Fetch responses
  const { data: responses, isLoading: loadingResponses } = trpc.audits.getResponses.useQuery(
    { auditInstanceId: auditId },
    { enabled: !!auditId }
  );

  // Fetch action plans
  const { data: actionPlans, isLoading: loadingActionPlans, refetch: refetchActionPlans } = trpc.audits.getActionPlans.useQuery(
    { auditInstanceId: auditId },
    { enabled: !!auditId }
  );

  // Fetch evidence
  const { data: evidence, isLoading: loadingEvidence } = trpc.audits.getEvidence.useQuery(
    { auditInstanceId: auditId },
    { enabled: !!auditId }
  );

  // Fetch staff for action plan assignment
  const { data: staff } = trpc.staff.list.useQuery();

  // PDF export mutation
  const exportPdfMutation = trpc.audits.generateAuditReportPDF.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF report generated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to generate PDF: ${error.message}`);
    },
  });

  const handleExportPDF = () => {
    exportPdfMutation.mutate({ auditInstanceId: auditId });
  };

  const createActionPlanMutation = trpc.audits.createActionPlan.useMutation({
    onSuccess: () => {
      toast.success("Action plan created successfully");
      setIsActionPlanDialogOpen(false);
      refetchActionPlans();
      setActionPlanData({
        issueDescription: "",
        ragStatus: "red",
        responsiblePersonId: 0,
        targetCompletionDate: new Date(),
        actionTaken: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create action plan: ${error.message}`);
    },
  });

  const handleCreateActionPlan = () => {
    if (!user?.tenantId || !auditInstance?.locationId || !actionPlanData.responsiblePersonId) {
      toast.error("Please fill in all required fields");
      return;
    }

    createActionPlanMutation.mutate({
      tenantId: user.tenantId,
      locationId: auditInstance.locationId,
      auditInstanceId: auditId,
      issueDescription: actionPlanData.issueDescription,
      ragStatus: actionPlanData.ragStatus,
      responsiblePersonId: actionPlanData.responsiblePersonId,
      targetCompletionDate: actionPlanData.targetCompletionDate,
      actionTaken: actionPlanData.actionTaken,
      notes: actionPlanData.notes,
    });
  };

  const getResponseBadge = (response: string) => {
    if (response === "yes") {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Yes
        </Badge>
      );
    }
    if (response === "no") {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          No
        </Badge>
      );
    }
    if (response === "na") {
      return <Badge variant="outline">N/A</Badge>;
    }
    return <Badge variant="secondary">{response}</Badge>;
  };

  const getRAGBadge = (status: string) => {
    const config = {
      red: { label: "Red", color: "bg-red-100 text-red-800" },
      amber: { label: "Amber", color: "bg-amber-100 text-amber-800" },
      green: { label: "Green", color: "bg-green-100 text-green-800" },
    };
    const { label, color } = config[status as keyof typeof config] || config.red;
    return <Badge className={color}>{label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800" },
      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
      partially_completed: { label: "Partially Completed", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
    };
    const { label, color } = config[status as keyof typeof config] || config.not_started;
    return <Badge className={color}>{label}</Badge>;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to view audit results</p>
      </div>
    );
  }

  if (loadingInstance || loadingTemplate || loadingResponses) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/2 animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!auditInstance || !auditTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Audit not found</p>
        <Button onClick={() => setLocation("/audits")}>Back to Audits</Button>
      </div>
    );
  }

  // Group responses by section
  const responsesBySection = auditTemplate.sections.map((section) => {
    const sectionResponses = section.questions.map((question) => {
      const response = responses?.find((r) => r.auditTemplateQuestionId === question.id);
      return { question, response };
    });
    return { section, responses: sectionResponses };
  });

  const totalQuestions = auditTemplate.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredQuestions = responses?.length || 0;
  const completionRate = Math.round((answeredQuestions / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/audits")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{auditInstance.auditTypeName}</h1>
            <p className="text-muted-foreground mt-1">
              {auditInstance.locationName} • {format(new Date(auditInstance.auditDate), "PPP")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {auditInstance.status === "in_progress" && (
            <Button onClick={() => setLocation(`/audits/${auditId}`)}>Continue Audit</Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={exportPdfMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportPdfMutation.isPending ? "Generating..." : "Export Report"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {answeredQuestions} of {totalQuestions} questions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Overall Score</CardDescription>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{auditInstance.overallScore || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Audit performance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Action Plans</CardDescription>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{actionPlans?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Items to address</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Evidence Files</CardDescription>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{evidence?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="responses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="actions">Action Plans</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        {/* Responses Tab */}
        <TabsContent value="responses" className="space-y-4">
          <Accordion type="multiple" defaultValue={responsesBySection.map((_, i) => `section-${i}`)} className="space-y-4">
            {responsesBySection.map(({ section, responses: sectionResponses }, idx) => (
              <AccordionItem key={section.id} value={`section-${idx}`} className="border rounded-lg">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{section.sectionTitle}</h3>
                    </div>
                    <Badge variant="outline">
                      {sectionResponses.filter((r) => r.response).length} / {sectionResponses.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4 mt-4">
                    {sectionResponses.map(({ question, response }) => (
                      <Card key={question.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-medium flex items-start gap-3">
                              <span className="text-primary font-semibold">{question.questionNumber}</span>
                              <span className="flex-1">{question.questionText}</span>
                            </CardTitle>
                            {response && getResponseBadge(response.response || "")}
                          </div>
                        </CardHeader>
                        {response && (
                          <CardContent className="space-y-3">
                            {response.observations && (
                              <div>
                                <Label className="text-sm font-medium">Observations</Label>
                                <p className="text-sm text-muted-foreground mt-1">{response.observations}</p>
                              </div>
                            )}
                            {response.actionRequired && (
                              <div>
                                <Label className="text-sm font-medium">Action Required</Label>
                                <p className="text-sm text-muted-foreground mt-1">{response.actionRequired}</p>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Action Plans Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Actions from audit findings flow automatically to the Master Action Log</p>
          </div>

          {loadingActionPlans ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : actionPlans && actionPlans.length > 0 ? (
            <div className="space-y-3">
              {actionPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getRAGBadge(plan.ragStatus)}
                          {getStatusBadge(plan.status)}
                        </div>
                        <p className="font-medium text-lg">{plan.issueDescription}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Responsible Person</Label>
                        <p className="font-medium mt-1">{plan.responsiblePersonName || "Unassigned"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Target Date</Label>
                        <p className="font-medium mt-1">
                          {plan.targetCompletionDate ? format(new Date(plan.targetCompletionDate), "PPP") : "Not set"}
                        </p>
                      </div>
                    </div>
                    {plan.notes && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="text-sm mt-1">{plan.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No action plans created yet</p>
                <Button className="mt-4" onClick={() => setIsActionPlanDialogOpen(true)}>
                  Create First Action Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Supporting documents and evidence for this audit</p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </div>

          {loadingEvidence ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : evidence && evidence.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evidence.map((file) => (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : "Unknown size"}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No evidence uploaded yet</p>
                <Button className="mt-4">Upload First Evidence</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
