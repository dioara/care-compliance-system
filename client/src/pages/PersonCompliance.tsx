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
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Loader2, Save, ClipboardCheck } from "lucide-react";
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

  // Fetch person details
  const { data: person, isLoading: personLoading } = personType === "staff"
    ? trpc.staff.list.useQuery({ locationId: activeLocationId || 0 }, { 
        enabled: !!activeLocationId,
        select: (data) => data.find(s => s.id === personId)
      })
    : trpc.serviceUsers.list.useQuery({ locationId: activeLocationId || 0 }, {
        enabled: !!activeLocationId,
        select: (data) => data.find(s => s.id === personId)
      });

  // Fetch all compliance sections for this person type
  const { data: allSections } = trpc.compliance.sections.useQuery(undefined, {
    select: (sections) => sections.filter(s => s.sectionType === personType)
  });

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

  // Local state for form data per section
  const [formData, setFormData] = useState<Record<number, any>>({});

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

  // Create a map of section assessments
  const sectionAssessments = new Map();
  assessments?.forEach(assessment => {
    // Group by section - we'll need to update this when questions are added
    // For now, just map by questionId
    sectionAssessments.set(assessment.questionId, assessment);
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

  const handleSaveAssessment = async (sectionId: number) => {
    if (!user || !activeLocationId || !canWrite) {
      toast.error("You don't have permission to save assessments");
      return;
    }

    const data = formData[sectionId];
    if (!data || !data.ragStatus) {
      toast.error("Please select a RAG status");
      return;
    }

    try {
      await saveAssessment.mutateAsync({
        tenantId: user.tenantId!,
        locationId: activeLocationId,
        questionId: sectionId, // Using sectionId as questionId for now
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
      
      // Clear form data for this section
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[sectionId];
        return newData;
      });
    } catch (error) {
      toast.error("Failed to save assessment");
    }
  };

  const updateFormData = (sectionId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [field]: value,
      },
    }));
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
            const existingAssessment = sectionAssessments.get(section.id);
            const currentFormData = formData[section.id] || {};

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
                    </div>
                    {existingAssessment && (
                      <div className="ml-4">
                        {getRAGBadge(existingAssessment.ragStatus)}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.tooltip && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">{section.tooltip}</p>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`compliance-${section.id}`}>Compliance Status</Label>
                      <Select
                        value={currentFormData.complianceStatus || existingAssessment?.complianceStatus || ''}
                        onValueChange={(value) => updateFormData(section.id, 'complianceStatus', value)}
                        disabled={!canWrite}
                      >
                        <SelectTrigger id={`compliance-${section.id}`}>
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
                      <Label htmlFor={`rag-${section.id}`}>RAG Status</Label>
                      <Select
                        value={currentFormData.ragStatus || existingAssessment?.ragStatus || ''}
                        onValueChange={(value) => updateFormData(section.id, 'ragStatus', value)}
                        disabled={!canWrite}
                      >
                        <SelectTrigger id={`rag-${section.id}`}>
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
                    <Label htmlFor={`evidence-${section.id}`}>Evidence Provided</Label>
                    <Textarea
                      id={`evidence-${section.id}`}
                      placeholder="Describe the evidence you have for compliance..."
                      value={currentFormData.evidenceProvided || existingAssessment?.evidenceProvided || ''}
                      onChange={(e) => updateFormData(section.id, 'evidenceProvided', e.target.value)}
                      disabled={!canWrite}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`gaps-${section.id}`}>Identified Gaps</Label>
                    <Textarea
                      id={`gaps-${section.id}`}
                      placeholder="Describe any gaps or areas for improvement..."
                      value={currentFormData.identifiedGaps || existingAssessment?.identifiedGaps || ''}
                      onChange={(e) => updateFormData(section.id, 'identifiedGaps', e.target.value)}
                      disabled={!canWrite}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`action-${section.id}`}>Action Required</Label>
                    <Textarea
                      id={`action-${section.id}`}
                      placeholder="Describe actions needed to achieve compliance..."
                      value={currentFormData.actionRequired || existingAssessment?.actionRequired || ''}
                      onChange={(e) => updateFormData(section.id, 'actionRequired', e.target.value)}
                      disabled={!canWrite}
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`target-${section.id}`}>Target Completion Date</Label>
                      <Input
                        id={`target-${section.id}`}
                        type="date"
                        value={currentFormData.targetCompletionDate || (existingAssessment?.targetCompletionDate ? new Date(existingAssessment.targetCompletionDate).toISOString().split('T')[0] : '')}
                        onChange={(e) => updateFormData(section.id, 'targetCompletionDate', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`notes-${section.id}`}>Additional Notes</Label>
                      <Input
                        id={`notes-${section.id}`}
                        placeholder="Any additional notes..."
                        value={currentFormData.notes || existingAssessment?.notes || ''}
                        onChange={(e) => updateFormData(section.id, 'notes', e.target.value)}
                        disabled={!canWrite}
                      />
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleSaveAssessment(section.id)}
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
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Compliance Sections</h3>
              <p className="text-muted-foreground text-center">
                Compliance sections for {personType === "staff" ? "staff" : "service users"} haven't been configured yet.
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
