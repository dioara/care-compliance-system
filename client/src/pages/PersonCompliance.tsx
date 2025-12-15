import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useRouter, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, Save, ClipboardCheck, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PersonComplianceProps {
  personType: "staff" | "service_user";
}

export default function PersonCompliance({ personType }: PersonComplianceProps) {
  const params = useParams<{ id: string }>();
  const personId = parseInt(params.id || "0");
  const { activeLocationId, canWrite } = useLocation();
  const { user } = useAuth();
  const [, setLocation] = useRouter();

  // Fetch person details - fetch all staff/service users without location filter to find the person
  const { data: person, isLoading: personLoading } = personType === "staff"
    ? trpc.staff.list.useQuery({}, { 
        enabled: true,
        select: (data) => data.find(s => s.id === personId)
      })
    : trpc.serviceUsers.list.useQuery({}, {
        enabled: true,
        select: (data) => data.find(s => s.id === personId)
      });

  // Fetch all compliance sections for this person type
  const { data: allSections } = trpc.compliance.sections.useQuery(undefined, {
    select: (sections) => sections.filter(s => s.sectionType === personType)
  });

  // Fetch all questions
  const { data: allQuestions } = trpc.compliance.questions.useQuery();

  // Fetch assessments for this person
  const { data: assessments, refetch: refetchAssessments } = trpc.compliance.assessmentsByLocation.useQuery(
    { locationId: activeLocationId || 0 },
    { 
      enabled: !!activeLocationId,
      select: (data) => data.filter(a => 
        personType === "staff" ? a.staffMemberId === personId : a.serviceUserId === personId
      )
    }
  );

  const saveAssessment = trpc.compliance.saveAssessment.useMutation();

  // Local state for form data per question
  const [formData, setFormData] = useState<Record<number, any>>({});
  
  // Track employment type answer (Question 1.7) for conditional logic
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  
  // Function to check if a question should be displayed based on conditional logic
  const shouldDisplayQuestion = (question: any): boolean => {
    if (!question.conditionalLogic) return true;
    
    try {
      const logic = JSON.parse(question.conditionalLogic);
      
      // If this question depends on Question 1.7 (employment type)
      if (logic.dependsOn === "1.7") {
        // If employment type hasn't been answered yet, hide conditional questions
        if (!employmentType) return false;
        
        // Check if current employment type is in the showWhen array
        return logic.showWhen.includes(employmentType);
      }
      
      return true;
    } catch (e) {
      // If parsing fails, show the question by default
      return true;
    }
  };

  if (!activeLocationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please select a location</p>
        </div>
      </div>
    );
  }

  if (personLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">{personType === "staff" ? "Staff member" : "Service user"} not found</p>
          <Button onClick={() => setLocation(personType === "staff" ? '/staff' : '/service-users')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Create a map of question assessments
  const questionAssessments = new Map();
  assessments?.forEach(assessment => {
    questionAssessments.set(assessment.questionId, assessment);
  });

  // Group questions by section and sort numerically
  const questionsBySection = new Map<number, any[]>();
  const hiddenQuestionsBySection = new Map<number, number>();
  
  allQuestions?.forEach(question => {
    if (!questionsBySection.has(question.sectionId)) {
      questionsBySection.set(question.sectionId, []);
      hiddenQuestionsBySection.set(question.sectionId, 0);
    }
    
    // Check if question should be displayed
    if (shouldDisplayQuestion(question)) {
      questionsBySection.get(question.sectionId)?.push(question);
    } else {
      // Count hidden questions
      const currentCount = hiddenQuestionsBySection.get(question.sectionId) || 0;
      hiddenQuestionsBySection.set(question.sectionId, currentCount + 1);
    }
  });
  
  // Sort questions numerically within each section
  questionsBySection.forEach((questions, sectionId) => {
    questions.sort((a, b) => {
      // Parse as "section.question" where both parts are integers
      // This makes 1.2 come before 1.10 (not 1.1 < 1.2 < 1.10)
      const [secA, qA] = a.questionNumber.split('.').map(Number);
      const [secB, qB] = b.questionNumber.split('.').map(Number);
      if (secA !== secB) return secA - secB;
      return qA - qB;
    });
  });

  const getRAGBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="secondary">Not Assessed</Badge>;
    
    switch (status) {
      case 'green':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compliant
          </Badge>
        );
      case 'amber':
        return (
          <Badge className="bg-amber-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'red':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Non-Compliant
          </Badge>
        );
      default:
        return <Badge variant="secondary">Not Assessed</Badge>;
    }
  };

  const handleSaveAssessment = async (questionId: number) => {
    if (!user || !activeLocationId || !canWrite) {
      toast.error("You don't have permission to save assessments");
      return;
    }

    const data = formData[questionId];
    if (!data || !data.ragStatus) {
      toast.error("Please select a RAG status");
      return;
    }

    try {
      await saveAssessment.mutateAsync({
        tenantId: user.tenantId!,
        locationId: activeLocationId,
        questionId: questionId,
        assessmentType: personType,
        staffMemberId: personType === "staff" ? personId : undefined,
        serviceUserId: personType === "service_user" ? personId : undefined,
        complianceStatus: data.complianceStatus || 'not_assessed',
        ragStatus: data.ragStatus,
        evidenceProvided: data.evidenceProvided,
        identifiedGaps: data.identifiedGaps,
        actionRequired: data.actionRequired,
        targetCompletionDate: data.targetCompletionDate,
        notes: data.notes,
        assessedById: user.id,
      });

      toast.success("Assessment saved successfully");
      refetchAssessments();
      
      // Clear form data for this question
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[questionId];
        return newData;
      });
    } catch (error) {
      toast.error("Failed to save assessment");
    }
  };

  const updateFormData = (questionId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        [field]: value,
      },
    }));
  };

  // Calculate section completion
  const getSectionCompletion = (sectionId: number) => {
    const questions = questionsBySection.get(sectionId) || [];
    if (questions.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = questions.filter(q => {
      const assessment = questionAssessments.get(q.id);
      return assessment && assessment.ragStatus;
    }).length;
    
    return {
      completed,
      total: questions.length,
      percentage: Math.round((completed / questions.length) * 100)
    };
  };

  const personName = (person as any).name || "Unknown";
  const backPath = personType === "staff" ? "/staff" : "/service-users";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation(backPath)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{personName}</h1>
          <p className="text-muted-foreground mt-2">
            {personType === "staff" ? "Staff" : "Service User"} Compliance Assessment - {allSections?.length || 0} Sections
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {allSections && allSections.length > 0 ? (
          allSections.map((section) => {
            const sectionQuestions = questionsBySection.get(section.id) || [];
            const completion = getSectionCompletion(section.id);

            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Section {section.sectionNumber}: {section.sectionName}
                      </CardTitle>
                      {section.description && (
                        <CardDescription className="mt-2">
                          {section.description}
                        </CardDescription>
                      )}
                      {sectionQuestions.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">
                            {completion.completed} / {completion.total} questions completed ({completion.percentage}%)
                          </Badge>
                          {hiddenQuestionsBySection.get(section.id)! > 0 && (
                            <Badge variant="secondary" className="bg-gray-100">
                              {hiddenQuestionsBySection.get(section.id)} questions hidden
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.tooltip && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">{section.tooltip}</p>
                    </div>
                  )}

                  {sectionQuestions.length > 0 ? (
                    <Accordion type="multiple" className="w-full">
                      {sectionQuestions.map((question, idx) => {
                        const existingAssessment = questionAssessments.get(question.id);
                        const currentFormData = formData[question.id] || {};

                        return (
                          <AccordionItem key={question.id} value={`question-${question.id}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3 text-left">
                                  <span className="font-mono text-sm text-muted-foreground">
                                    {question.questionNumber}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {question.questionText.length > 100 
                                      ? question.questionText.substring(0, 100) + "..." 
                                      : question.questionText}
                                  </span>
                                </div>
                                {existingAssessment && (
                                  <div className="ml-4">
                                    {getRAGBadge(existingAssessment.ragStatus)}
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-4">
                                {/* Full question text */}
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm font-medium mb-2">Question:</p>
                                  <p className="text-sm">{question.questionText}</p>
                                </div>

                                {/* Guidance/Example */}
                                {question.guidance && (
                                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Example Evidence:</p>
                                    <p className="text-sm text-blue-800">{question.guidance}</p>
                                  </div>
                                )}

                                {/* Special handling for Question 1.7 (Employment Type) */}
                                {question.questionNumber === "1.7" && personType === "staff" && (
                                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300 mb-4">
                                    <Label htmlFor={`employment-type-${question.id}`} className="text-blue-900 font-semibold">Employment Type Classification</Label>
                                    <p className="text-sm text-blue-800 mb-3">Select the employment type to show relevant questions below</p>
                                    <Select
                                      value={employmentType || ''}
                                      onValueChange={(value) => {
                                        setEmploymentType(value);
                                        updateFormData(question.id, 'evidenceProvided', `Employment Type: ${value}`);
                                      }}
                                      disabled={!canWrite}
                                    >
                                      <SelectTrigger id={`employment-type-${question.id}`} className="bg-white">
                                        <SelectValue placeholder="Select employment type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Permanent">Permanent Staff</SelectItem>
                                        <SelectItem value="Sponsored">Sponsored Worker (Visa Holder)</SelectItem>
                                        <SelectItem value="Agency">Agency Staff</SelectItem>
                                        <SelectItem value="Bank">Bank Staff</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {/* Assessment form */}
                                <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                  <div className="space-y-2">
                                    <Label htmlFor={`compliance-${question.id}`}>Compliance Status</Label>
                                    <Select
                                      value={currentFormData.complianceStatus || existingAssessment?.complianceStatus || ''}
                                      onValueChange={(value) => updateFormData(question.id, 'complianceStatus', value)}
                                      disabled={!canWrite}
                                    >
                                      <SelectTrigger id={`compliance-${question.id}`}>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="compliant">Compliant</SelectItem>
                                        <SelectItem value="partial">Partial Compliance</SelectItem>
                                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                        <SelectItem value="not_assessed">Not Assessed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`rag-${question.id}`}>RAG Status</Label>
                                    <Select
                                      value={currentFormData.ragStatus || existingAssessment?.ragStatus || ''}
                                      onValueChange={(value) => updateFormData(question.id, 'ragStatus', value)}
                                      disabled={!canWrite}
                                    >
                                      <SelectTrigger id={`rag-${question.id}`}>
                                        <SelectValue placeholder="Select RAG status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="green">Green - Compliant</SelectItem>
                                        <SelectItem value="amber">Amber - Partial</SelectItem>
                                        <SelectItem value="red">Red - Non-Compliant</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`evidence-${question.id}`}>Evidence Provided</Label>
                                  <Textarea
                                    id={`evidence-${question.id}`}
                                    placeholder="Describe the evidence you have for this requirement..."
                                    value={currentFormData.evidenceProvided || existingAssessment?.evidenceProvided || ''}
                                    onChange={(e) => updateFormData(question.id, 'evidenceProvided', e.target.value)}
                                    disabled={!canWrite}
                                    rows={3}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`gaps-${question.id}`}>Identified Gaps</Label>
                                  <Textarea
                                    id={`gaps-${question.id}`}
                                    placeholder="Describe any gaps or areas for improvement..."
                                    value={currentFormData.identifiedGaps || existingAssessment?.identifiedGaps || ''}
                                    onChange={(e) => updateFormData(question.id, 'identifiedGaps', e.target.value)}
                                    disabled={!canWrite}
                                    rows={2}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`action-${question.id}`}>Action Required</Label>
                                  <Textarea
                                    id={`action-${question.id}`}
                                    placeholder="Describe actions needed to achieve compliance..."
                                    value={currentFormData.actionRequired || existingAssessment?.actionRequired || ''}
                                    onChange={(e) => updateFormData(question.id, 'actionRequired', e.target.value)}
                                    disabled={!canWrite}
                                    rows={2}
                                  />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <Label htmlFor={`target-${question.id}`}>Target Completion Date</Label>
                                    <Input
                                      id={`target-${question.id}`}
                                      type="date"
                                      value={currentFormData.targetCompletionDate || existingAssessment?.targetCompletionDate || ''}
                                      onChange={(e) => updateFormData(question.id, 'targetCompletionDate', e.target.value)}
                                      disabled={!canWrite}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor={`notes-${question.id}`}>Additional Notes</Label>
                                    <Input
                                      id={`notes-${question.id}`}
                                      type="text"
                                      placeholder="Any additional notes..."
                                      value={currentFormData.notes || existingAssessment?.notes || ''}
                                      onChange={(e) => updateFormData(question.id, 'notes', e.target.value)}
                                      disabled={!canWrite}
                                    />
                                  </div>
                                </div>

                                {canWrite && (
                                  <Button
                                    onClick={() => handleSaveAssessment(question.id)}
                                    disabled={saveAssessment.isPending}
                                    className="w-full"
                                  >
                                    {saveAssessment.isPending ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Assessment
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No questions available for this section yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No compliance sections found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
