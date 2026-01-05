import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KloeMultiSelect } from "@/components/KloeMultiSelect";
import { KloeTags } from "@/components/KloeTags";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function KloeManagement() {
  const [selectedAuditType, setSelectedAuditType] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [kloeUpdates, setKloeUpdates] = useState<Record<number, string>>({});

  // Fetch audit types
  const { data: auditTypes, isLoading: loadingTypes } = trpc.audits.getAuditTypes.useQuery();

  // Fetch template for selected audit type
  const { data: auditTemplate, isLoading: loadingTemplate, refetch } = trpc.audits.getAuditTemplate.useQuery(
    { auditTypeId: selectedAuditType || 0 },
    { enabled: !!selectedAuditType }
  );

  // Update KLOE mutation
  const updateKloeMutation = trpc.audits.updateQuestionKloes.useMutation({
    onSuccess: () => {
      toast.success("KLOEs updated successfully");
      refetch();
      setKloeUpdates({});
    },
    onError: (error) => {
      toast.error(`Failed to update KLOEs: ${error.message}`);
    },
  });

  const handleKloeChange = (questionId: number, kloes: string) => {
    setKloeUpdates(prev => ({
      ...prev,
      [questionId]: kloes
    }));
  };

  const handleSave = (questionId: number, currentKloes: string | null) => {
    const newKloes = kloeUpdates[questionId] !== undefined ? kloeUpdates[questionId] : (currentKloes || "");
    updateKloeMutation.mutate({
      questionId,
      kloes: newKloes
    });
  };

  const handleSaveAll = () => {
    if (!auditTemplate) return;

    const updates = auditTemplate.sections.flatMap(section =>
      section.questions
        .filter(q => kloeUpdates[q.id] !== undefined)
        .map(q => ({
          questionId: q.id,
          kloes: kloeUpdates[q.id]
        }))
    );

    if (updates.length === 0) {
      toast.info("No changes to save");
      return;
    }

    Promise.all(
      updates.map(update => updateKloeMutation.mutateAsync(update))
    ).then(() => {
      toast.success(`Updated ${updates.length} question(s)`);
      refetch();
      setKloeUpdates({});
    }).catch((error) => {
      toast.error(`Failed to update some questions: ${error.message}`);
    });
  };

  if (loadingTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">KLOE Management</h1>
        <p className="text-muted-foreground mt-1">
          Tag audit questions with CQC Key Lines of Enquiry
        </p>
      </div>

      {/* Audit Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Audit Type</CardTitle>
          <CardDescription>Choose an audit type to manage its question KLOEs</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAuditType?.toString() || ""}
            onValueChange={(value) => {
              setSelectedAuditType(parseInt(value));
              setSelectedTemplate(null);
              setKloeUpdates({});
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select audit type..." />
            </SelectTrigger>
            <SelectContent>
              {auditTypes?.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.auditName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Questions List */}
      {loadingTemplate && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {auditTemplate && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questions</h2>
            {Object.keys(kloeUpdates).length > 0 && (
              <Button onClick={handleSaveAll} disabled={updateKloeMutation.isPending}>
                {updateKloeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save All Changes ({Object.keys(kloeUpdates).length})
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {auditTemplate.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.sectionTitle}</CardTitle>
                  {section.sectionDescription && (
                    <CardDescription>{section.sectionDescription}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.questions.map((question) => {
                    const currentKloes = kloeUpdates[question.id] !== undefined 
                      ? kloeUpdates[question.id] 
                      : (question.kloes || "");
                    const hasChanges = kloeUpdates[question.id] !== undefined;

                    return (
                      <div key={question.id} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-semibold text-primary">{question.questionNumber}</span>
                            <span className="text-sm flex-1">{question.questionText}</span>
                          </div>
                          {question.kloes && !hasChanges && (
                            <div className="mt-2">
                              <KloeTags kloes={question.kloes} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">CQC KLOEs</label>
                          <KloeMultiSelect
                            value={currentKloes}
                            onChange={(value) => handleKloeChange(question.id, value)}
                            placeholder="Select KLOEs for this question..."
                          />
                        </div>

                        {hasChanges && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(question.id, question.kloes)}
                              disabled={updateKloeMutation.isPending}
                            >
                              {updateKloeMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const { [question.id]: _, ...rest } = kloeUpdates;
                                setKloeUpdates(rest);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
