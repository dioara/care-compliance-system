import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, CheckCircle2, Upload, AlertCircle, Plus, X, User, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ConductAudit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const auditId = parseInt(id || "0");

  const [responses, setResponses] = useState<Record<number, { response: string; observations?: string; isCompliant?: boolean }>>({});
  const [actionItems, setActionItems] = useState<Record<number, Array<{ description: string; assignedToId: number | null; targetDate: string }>>>({});
  const [expandedActions, setExpandedActions] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch audit instance
  const { data: auditInstance, isLoading: loadingInstance } = trpc.audits.getAuditInstance.useQuery(
    { id: auditId },
    { enabled: !!auditId }
  );

  // Fetch audit template with questions
  const { data: auditTemplate, isLoading: loadingTemplate } = trpc.audits.getAuditTemplate.useQuery(
    { auditTypeId: auditInstance?.auditTypeId || 0 },
    { enabled: !!auditInstance?.auditTypeId }
  );

  // Fetch existing responses
  const { data: existingResponses, isLoading: loadingResponses } = trpc.audits.getResponses.useQuery(
    { auditInstanceId: auditId },
    { enabled: !!auditId }
  );

  // Fetch staff members for action assignment
  const { data: staffMembers } = trpc.staff.list.useQuery(
    { locationId: auditInstance?.locationId },
    { enabled: !!auditInstance?.locationId }
  );

  // Load existing responses into state
  useEffect(() => {
    if (existingResponses) {
      const responseMap: Record<number, { response: string; observations?: string; isCompliant?: boolean }> = {};
      existingResponses.forEach((r) => {
        responseMap[r.auditTemplateQuestionId] = {
          response: r.response || "",
          observations: r.observations || "",
          isCompliant: r.isCompliant ?? undefined,
        };
      });
      setResponses(responseMap);
    }
  }, [existingResponses]);

  const saveResponseMutation = trpc.audits.saveResponse.useMutation({
    onSuccess: () => {
      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      toast.error(`Failed to save response: ${error.message}`);
    },
  });

  const completeAuditMutation = trpc.audits.completeAudit.useMutation({
    onSuccess: () => {
      toast.success("Audit completed successfully");
      setLocation(`/audits/${auditId}/results`);
    },
    onError: (error) => {
      toast.error(`Failed to complete audit: ${error.message}`);
    },
  });

  const handleResponseChange = (questionId: number, field: "response" | "observations" | "isCompliant", value: string | boolean) => {
    // Capture the current response data BEFORE updating state
    const currentResponseData = responses[questionId] || {};
    
    // Build the updated response data
    const updatedResponseData = {
      ...currentResponseData,
      [field]: value,
    };
    
    // Update state
    setResponses((prev) => ({
      ...prev,
      [questionId]: updatedResponseData,
    }));

    // Auto-save after 1 second delay using the captured updated data
    setIsSaving(true);
    setTimeout(() => {
      saveResponseMutation.mutate({
        auditInstanceId: auditId,
        auditTemplateQuestionId: questionId,
        response: updatedResponseData.response || "",
        observations: updatedResponseData.observations,
        isCompliant: updatedResponseData.isCompliant,
        responseValue: updatedResponseData.response || undefined,
      });
    }, 1000);
  };

  // Save action items mutation
  const saveActionItemsMutation = trpc.audits.saveActionItems.useMutation();

  const handleCompleteAudit = async () => {
    if (!auditTemplate || !auditInstance) return;

    // First, save all action items
    const allActionItems: Array<{
      auditResponseId: number;
      questionId: number;
      description: string;
      assignedToId: number | null;
      targetDate: string;
    }> = [];

    Object.entries(actionItems).forEach(([questionId, items]) => {
      items.forEach((item) => {
        if (item.description.trim()) {
          allActionItems.push({
            auditResponseId: 0, // Will be resolved on server
            questionId: parseInt(questionId),
            description: item.description,
            assignedToId: item.assignedToId,
            targetDate: item.targetDate,
          });
        }
      });
    });

    // Save action items if any
    if (allActionItems.length > 0) {
      try {
        await saveActionItemsMutation.mutateAsync({
          auditInstanceId: auditId,
          locationId: auditInstance.locationId,
          actionItems: allActionItems,
        });
      } catch (error) {
        toast.error("Failed to save action items");
        return;
      }
    }

    const totalQuestions = auditTemplate.sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.keys(responses).length;
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

    completeAuditMutation.mutate({
      id: auditId,
      overallScore: completionPercentage,
      summary: `Audit completed with ${answeredQuestions} of ${totalQuestions} questions answered.`,
    });
  };

  const calculateProgress = () => {
    if (!auditTemplate) return 0;
    const totalQuestions = auditTemplate.sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.keys(responses).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  const getQuestionTypeInput = (question: any, questionId: number) => {
    const currentResponse = responses[questionId] || {};

    switch (question.questionType) {
      case "yes_no":
      case "yes_no_na":
        return (
          <div className="space-y-3">
            <RadioGroup
              value={currentResponse.response || undefined}
              onValueChange={(value) => {
                // Update both response and isCompliant at once
                const currentResponseData = responses[questionId] || {};
                const updatedResponseData = {
                  ...currentResponseData,
                  response: value,
                  isCompliant: value === "yes",
                };
                
                setResponses((prev) => ({
                  ...prev,
                  [questionId]: updatedResponseData,
                }));

                // Auto-save after 1 second delay
                setIsSaving(true);
                setTimeout(() => {
                  saveResponseMutation.mutate({
                    auditInstanceId: auditId,
                    auditTemplateQuestionId: questionId,
                    response: updatedResponseData.response || "",
                    observations: updatedResponseData.observations,
                    isCompliant: updatedResponseData.isCompliant,
                    responseValue: updatedResponseData.response || undefined,
                  });
                }, 1000);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${questionId}-yes`} />
                <Label htmlFor={`${questionId}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${questionId}-no`} />
                <Label htmlFor={`${questionId}-no`}>No</Label>
              </div>
              {question.questionType === "yes_no_na" && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="na" id={`${questionId}-na`} />
                  <Label htmlFor={`${questionId}-na`}>N/A</Label>
                </div>
              )}
            </RadioGroup>
          </div>
        );

      case "text":
      case "long_text":
        return (
          <Textarea
            placeholder="Enter your response..."
            value={currentResponse.response || ""}
            onChange={(e) => handleResponseChange(questionId, "response", e.target.value)}
            rows={question.questionType === "long_text" ? 6 : 3}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder="Enter number..."
            value={currentResponse.response || ""}
            onChange={(e) => handleResponseChange(questionId, "response", e.target.value)}
          />
        );

      case "checklist":
        return (
          <Textarea
            placeholder="Check applicable items and enter details..."
            value={currentResponse.response || ""}
            onChange={(e) => handleResponseChange(questionId, "response", e.target.value)}
            rows={4}
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder="Enter response..."
            value={currentResponse.response || ""}
            onChange={(e) => handleResponseChange(questionId, "response", e.target.value)}
          />
        );
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Please log in to conduct audits</p>
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
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Audit not found</p>
        <Button onClick={() => setLocation("/audits")}>Back to Audits</Button>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/audits")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{auditInstance.auditTypeName}</h1>
            <p className="text-muted-foreground mt-1">
              {auditInstance.locationName} • {format(new Date(auditInstance.auditDate), "PPP")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Save className="h-3 w-3 mr-1 animate-pulse" />
              Saving...
            </Badge>
          )}
          <Button onClick={handleCompleteAudit} size="lg" disabled={completeAuditMutation.isPending}>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {completeAuditMutation.isPending ? "Completing..." : "Complete Audit"}
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Questions by Section */}
      <Accordion type="multiple" defaultValue={auditTemplate.sections.map((s) => `section-${s.id}`)} className="space-y-4">
        {auditTemplate.sections.map((section) => (
          <AccordionItem key={section.id} value={`section-${section.id}`} className="border rounded-lg">
            <AccordionTrigger className="px-6 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{section.sectionTitle}</h3>
                  {section.sectionDescription && (
                    <p className="text-sm text-muted-foreground mt-1">{section.sectionDescription}</p>
                  )}
                </div>
                <Badge variant="outline">
                  {section.questions.filter((q) => responses[q.id]?.response).length} / {section.questions.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="space-y-6 mt-4">
                {section.questions.map((question) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-base font-medium flex items-start gap-3">
                        <span className="text-primary font-semibold">{question.questionNumber}</span>
                        <span className="flex-1">{question.questionText}</span>
                      </CardTitle>
                      {question.evidenceRequired && (
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Upload className="h-4 w-4" />
                          Evidence required: {question.evidenceRequired}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Question Input */}
                      <div className="space-y-2">
                        <Label>Response</Label>
                        {getQuestionTypeInput(question, question.id)}
                      </div>

                      {/* Observations */}
                      <div className="space-y-2">
                        <Label htmlFor={`obs-${question.id}`}>Observations / Notes (Optional)</Label>
                        <Textarea
                          id={`obs-${question.id}`}
                          placeholder="Add any additional observations or notes..."
                          value={responses[question.id]?.observations || ""}
                          onChange={(e) => handleResponseChange(question.id, "observations", e.target.value)}
                          rows={2}
                        />
                      </div>

                      {/* Response Status */}
                      {responses[question.id]?.response && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Response saved</span>
                        </div>
                      )}

                      {/* Action Items Section */}
                      <Collapsible
                        open={expandedActions[question.id]}
                        onOpenChange={(open) => setExpandedActions(prev => ({ ...prev, [question.id]: open }))}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full justify-between mt-4">
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Action Items ({actionItems[question.id]?.length || 0})
                            </span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4">
                          {/* Existing action items */}
                          {actionItems[question.id]?.map((action, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                              <div className="flex justify-between items-start">
                                <span className="text-sm font-medium">Action {index + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setActionItems(prev => ({
                                      ...prev,
                                      [question.id]: prev[question.id]?.filter((_, i) => i !== index) || []
                                    }));
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  placeholder="Describe the action required..."
                                  value={action.description}
                                  onChange={(e) => {
                                    setActionItems(prev => ({
                                      ...prev,
                                      [question.id]: prev[question.id]?.map((a, i) =>
                                        i === index ? { ...a, description: e.target.value } : a
                                      ) || []
                                    }));
                                  }}
                                  rows={2}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> Assign To
                                  </Label>
                                  <Select
                                    value={action.assignedToId?.toString() || ""}
                                    onValueChange={(value) => {
                                      setActionItems(prev => ({
                                        ...prev,
                                        [question.id]: prev[question.id]?.map((a, i) =>
                                          i === index ? { ...a, assignedToId: parseInt(value) } : a
                                        ) || []
                                      }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select staff member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {staffMembers?.map((staff) => (
                                        <SelectItem key={staff.id} value={staff.id.toString()}>
                                          {staff.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Target Date
                                  </Label>
                                  <Input
                                    type="date"
                                    value={action.targetDate}
                                    onChange={(e) => {
                                      setActionItems(prev => ({
                                        ...prev,
                                        [question.id]: prev[question.id]?.map((a, i) =>
                                          i === index ? { ...a, targetDate: e.target.value } : a
                                        ) || []
                                      }));
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {/* Add new action button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionItems(prev => ({
                                ...prev,
                                [question.id]: [
                                  ...(prev[question.id] || []),
                                  { description: "", assignedToId: null, targetDate: "" }
                                ]
                              }));
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Action Item
                          </Button>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Complete Button (Bottom) */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="font-semibold">Ready to complete this audit?</p>
            <p className="text-sm text-muted-foreground mt-1">
              {progress}% of questions answered • You can add action plans and evidence after completion
            </p>
          </div>
          <Button onClick={handleCompleteAudit} size="lg" disabled={completeAuditMutation.isPending}>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {completeAuditMutation.isPending ? "Completing..." : "Complete Audit"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
