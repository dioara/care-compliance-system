import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useRouter, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Upload, FileText, Trash2, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// File upload will be handled through tRPC endpoint

export default function ComplianceSection() {
  const params = useParams<{ sectionId: string }>();
  const sectionId = parseInt(params.sectionId || "0");
  const { activeLocationId, canWrite } = useLocation();
  const { user } = useAuth();
  const [, setLocation] = useRouter();

  // Fetch section details and questions
  const { data: sectionData, isLoading } = trpc.compliance.sectionDetails.useQuery(
    { sectionId },
    { enabled: !!sectionId }
  );

  // Fetch assessments for this location
  const { data: assessments, refetch: refetchAssessments } = trpc.compliance.assessmentsByLocation.useQuery(
    { locationId: activeLocationId || 0 },
    { enabled: !!activeLocationId }
  );

  const saveAssessment = trpc.compliance.saveAssessment.useMutation();
  const uploadDocument = trpc.compliance.uploadDocument.useMutation();

  // Local state for form data
  const [formData, setFormData] = useState<Record<number, any>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});

  if (!activeLocationId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Please select a location to view compliance assessments</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sectionData?.section) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">Section not found</p>
          <Button onClick={() => setLocation('/compliance')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Compliance
          </Button>
        </div>
      </div>
    );
  }

  const { section, questions } = sectionData;

  // Create a map of existing assessments by questionId
  const assessmentMap = new Map();
  assessments?.forEach(assessment => {
    assessmentMap.set(assessment.questionId, assessment);
  });

  const getRAGBadge = (status: string) => {
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
    if (!data) {
      toast.error("Please fill in the assessment details");
      return;
    }

    try {
      await saveAssessment.mutateAsync({
        tenantId: user.tenantId!,
        locationId: activeLocationId,
        questionId,
        assessmentType: section.sectionType,
        complianceStatus: data.complianceStatus || 'not_assessed',
        ragStatus: data.ragStatus || 'red',
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

  const handleFileUpload = async (questionId: number, assessmentId: number, file: File) => {
    // TODO: Implement file upload through tRPC endpoint with S3
    toast.info("File upload feature coming soon");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setLocation('/compliance')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{section.sectionName}</h1>
          <p className="text-muted-foreground mt-2">
            Section {section.sectionNumber} - {section.sectionType === 'service_user' ? 'Service User' : 'Staff'} Compliance
          </p>
        </div>
      </div>

      {section.description && (
        <Card>
          <CardHeader>
            <CardTitle>Section Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{section.description}</p>
            {section.tooltip && (
              <p className="text-sm text-muted-foreground mt-2 italic">{section.tooltip}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {questions && questions.length > 0 ? (
          questions.map((question) => {
            const existingAssessment = assessmentMap.get(question.id);
            const currentFormData = formData[question.id] || {};

            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Question {question.questionNumber}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {question.questionText}
                      </CardDescription>
                      {question.standardDescription && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Standard:</strong> {question.standardDescription}
                        </p>
                      )}
                    </div>
                    {existingAssessment && (
                      <div className="ml-4">
                        {getRAGBadge(existingAssessment.ragStatus)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.guidance && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>Guidance:</strong> {question.guidance}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
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
                      placeholder="Describe the evidence you have for compliance..."
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
                        value={currentFormData.targetCompletionDate || (existingAssessment?.targetCompletionDate ? new Date(existingAssessment.targetCompletionDate).toISOString().split('T')[0] : '')}
                        onChange={(e) => updateFormData(question.id, 'targetCompletionDate', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${question.id}`}>Additional Notes</Label>
                      <Input
                        id={`notes-${question.id}`}
                        placeholder="Any additional notes..."
                        value={currentFormData.notes || existingAssessment?.notes || ''}
                        onChange={(e) => updateFormData(question.id, 'notes', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleSaveAssessment(question.id)}
                        disabled={saveAssessment.isPending || !currentFormData.ragStatus}
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

                      {existingAssessment && (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`file-${question.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && existingAssessment.id) {
                                handleFileUpload(question.id, existingAssessment.id, file);
                              }
                            }}
                            disabled={uploadingFiles[question.id]}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById(`file-${question.id}`)?.click()}
                            disabled={uploadingFiles[question.id]}
                          >
                            {uploadingFiles[question.id] ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Evidence
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {existingAssessment && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Last assessed: {existingAssessment.assessedAt ? new Date(existingAssessment.assessedAt).toLocaleString() : 'Never'}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Available</h3>
              <p className="text-muted-foreground text-center">
                Questions for this section haven't been configured yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!canWrite && (
        <div className="fixed bottom-4 right-4 bg-amber-100 text-amber-900 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">Read-only access to this location</p>
        </div>
      )}
    </div>
  );
}
