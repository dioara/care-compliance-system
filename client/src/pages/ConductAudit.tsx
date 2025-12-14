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
import { ArrowLeft, Save, CheckCircle2, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ConductAudit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const auditId = parseInt(id || "0");

  const [responses, setResponses] = useState<Record<number, { response: string; observations?: string; isCompliant?: boolean }>>({});
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
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));

    // Auto-save after 1 second delay
    setIsSaving(true);
    setTimeout(() => {
      const responseData = responses[questionId] || {};
      saveResponseMutation.mutate({
        auditInstanceId: auditId,
        auditTemplateQuestionId: questionId,
        response: field === "response" ? (value as string) : (responseData.response || ""),
        observations: field === "observations" ? (value as string) : responseData.observations,
        isCompliant: field === "isCompliant" ? (value as boolean) : responseData.isCompliant,
        responseValue: field === "response" ? (value as string) : undefined,
      });
    }, 1000);
  };

  const handleCompleteAudit = () => {
    if (!auditTemplate) return;

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
              value={currentResponse.response || ""}
              onValueChange={(value) => {
                handleResponseChange(questionId, "response", value);
                handleResponseChange(questionId, "isCompliant", value === "yes");
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
