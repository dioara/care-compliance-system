import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Brain, Upload, FileText, AlertCircle, CheckCircle, XCircle, Clock, Key, ExternalLink, Loader2, Shield, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AIAudits() {
  const { data: apiKeyStatus, isLoading: isLoadingApiKey } = trpc.aiAudits.getApiKeyStatus.useQuery();
  const { data: auditHistory, refetch: refetchHistory } = trpc.aiAudits.getHistory.useQuery({ limit: 10 });
  const submitAudit = trpc.aiAudits.submitAudit.useMutation();

  const [carePlanText, setCarePlanText] = useState("");
  const [carePlanName, setCarePlanName] = useState("");
  const [dailyNotesText, setDailyNotesText] = useState("");
  const [dailyNotesName, setDailyNotesName] = useState("");
  const [customNames, setCustomNames] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmitCarePlan = async () => {
    if (carePlanText.length < 100) {
      toast.error("Please enter at least 100 characters of care plan text");
      return;
    }

    setIsProcessing(true);
    setAuditResult(null);

    try {
      const result = await submitAudit.mutateAsync({
        auditType: "care_plan",
        documentText: carePlanText,
        documentName: carePlanName || undefined,
        customNames: customNames ? customNames.split(",").map(n => n.trim()).filter(Boolean) : undefined,
      });

      setAuditResult(result);
      refetchHistory();
      toast.success("Care plan audit completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to process care plan");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitDailyNotes = async () => {
    if (dailyNotesText.length < 100) {
      toast.error("Please enter at least 100 characters of daily notes text");
      return;
    }

    setIsProcessing(true);
    setAuditResult(null);

    try {
      const result = await submitAudit.mutateAsync({
        auditType: "daily_notes",
        documentText: dailyNotesText,
        documentName: dailyNotesName || undefined,
        customNames: customNames ? customNames.split(",").map(n => n.trim()).filter(Boolean) : undefined,
      });

      setAuditResult(result);
      refetchHistory();
      toast.success("Daily notes audit completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to process daily notes");
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 6) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 4) return <Badge className="bg-orange-100 text-orange-800">Needs Improvement</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  if (isLoadingApiKey) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8" />
          AI-Powered Audits
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload care plans and daily notes for instant quality analysis and feedback
        </p>
      </div>

      {/* API Key Status */}
      {!apiKeyStatus?.hasApiKey && (
        <Alert variant="destructive">
          <Key className="h-4 w-4" />
          <AlertTitle>OpenAI API Key Required</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              To use AI-powered audits, you need to configure your OpenAI API key in your Company Profile.
              This ensures your documents are processed securely using your own API account.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/company-profile">
                <Key className="mr-2 h-4 w-4" />
                Configure API Key
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {apiKeyStatus?.hasApiKey && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Privacy Protection Active</AlertTitle>
          <AlertDescription>
            Your documents are automatically anonymised before AI analysis. Names are converted to initials
            and personal information is redacted for GDPR compliance. Only the anonymised feedback is stored.
            <span className="block mt-1 text-xs text-muted-foreground">
              API Key: {apiKeyStatus.keyPreview}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="care-plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="care-plans">Care Plan Audits</TabsTrigger>
          <TabsTrigger value="daily-notes">Daily Notes Audits</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="care-plans" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle>AI Care Plan Quality Audit</CardTitle>
                <CardDescription>
                  Paste or type care plan content for AI analysis. Names are automatically converted to initials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="carePlanName">Document Name (optional)</Label>
                  <Input
                    id="carePlanName"
                    placeholder="e.g., J.S. Care Plan - December 2024"
                    value={carePlanName}
                    onChange={(e) => setCarePlanName(e.target.value)}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carePlanText">Care Plan Content *</Label>
                  <Textarea
                    id="carePlanText"
                    placeholder="Paste the care plan text here..."
                    value={carePlanText}
                    onChange={(e) => setCarePlanText(e.target.value)}
                    rows={12}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    {carePlanText.length} characters (minimum 100 required)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customNames">Additional Names to Anonymise (optional)</Label>
                  <Input
                    id="customNames"
                    placeholder="e.g., John Smith, Mary Jones"
                    value={customNames}
                    onChange={(e) => setCustomNames(e.target.value)}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of names to ensure they are converted to initials
                  </p>
                </div>

                <Button
                  onClick={handleSubmitCarePlan}
                  disabled={!apiKeyStatus?.hasApiKey || isProcessing || carePlanText.length < 100}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysing Care Plan...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyse Care Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  AI-generated feedback on care plan quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analysing document...</p>
                    <p className="text-xs text-muted-foreground">This may take 10-30 seconds</p>
                  </div>
                )}

                {!isProcessing && !auditResult && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4" />
                    <p>Submit a care plan to see analysis results</p>
                  </div>
                )}

                {auditResult && (
                  <AuditResultDisplay result={auditResult} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily-notes" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle>AI Daily Notes Quality Audit</CardTitle>
                <CardDescription>
                  Paste or type daily notes content for AI analysis of quality and professionalism.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyNotesName">Document Name (optional)</Label>
                  <Input
                    id="dailyNotesName"
                    placeholder="e.g., J.S. Daily Notes - 15 Dec 2024"
                    value={dailyNotesName}
                    onChange={(e) => setDailyNotesName(e.target.value)}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyNotesText">Daily Notes Content *</Label>
                  <Textarea
                    id="dailyNotesText"
                    placeholder="Paste the daily notes text here..."
                    value={dailyNotesText}
                    onChange={(e) => setDailyNotesText(e.target.value)}
                    rows={12}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    {dailyNotesText.length} characters (minimum 100 required)
                  </p>
                </div>

                <Button
                  onClick={handleSubmitDailyNotes}
                  disabled={!apiKeyStatus?.hasApiKey || isProcessing || dailyNotesText.length < 100}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analysing Daily Notes...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Analyse Daily Notes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  AI-generated feedback on daily notes quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Analysing document...</p>
                    <p className="text-xs text-muted-foreground">This may take 10-30 seconds</p>
                  </div>
                )}

                {!isProcessing && !auditResult && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4" />
                    <p>Submit daily notes to see analysis results</p>
                  </div>
                )}

                {auditResult && (
                  <AuditResultDisplay result={auditResult} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audits</CardTitle>
              <CardDescription>
                View your recent AI audit results and download reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditHistory && auditHistory.length > 0 ? (
                <div className="space-y-4">
                  {auditHistory.map((audit: any) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {audit.auditType === "care_plan" ? "Care Plan" : "Daily Notes"}
                          </Badge>
                          {audit.status === "completed" && audit.score && (
                            <span className={`font-semibold ${getScoreColor(audit.score)}`}>
                              Score: {audit.score}/10
                            </span>
                          )}
                          {audit.status === "processing" && (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Processing
                            </Badge>
                          )}
                          {audit.status === "failed" && (
                            <Badge variant="destructive">
                              <XCircle className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {audit.documentName || `Audit #${audit.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4" />
                  <p>No audits yet. Submit a care plan or daily notes to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditResultDisplay({ result }: { result: any }) {
  const { score, strengths, areasForImprovement, recommendations, examples, cqcComplianceNotes, anonymizationSummary } = result.result;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="text-center">
        <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
          {score}/10
        </div>
        <p className="text-muted-foreground mt-1">Quality Score</p>
        <Progress value={score * 10} className="mt-2" />
      </div>

      {/* Anonymization Summary */}
      {anonymizationSummary && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Privacy: {anonymizationSummary.namesRedacted} names converted to initials,{" "}
            {anonymizationSummary.piiRedacted} PII items redacted
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 text-green-700 mb-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h4>
          <ul className="space-y-1 text-sm">
            {strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {areasForImprovement && areasForImprovement.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 text-orange-700 mb-2">
            <AlertCircle className="h-4 w-4" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1 text-sm">
            {areasForImprovement.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 text-blue-700 mb-2">
            <Brain className="h-4 w-4" />
            Recommendations
          </h4>
          <ul className="space-y-1 text-sm">
            {recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CQC Compliance Notes */}
      {cqcComplianceNotes && (
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-1">CQC Compliance Notes</h4>
          <p className="text-sm text-muted-foreground">{cqcComplianceNotes}</p>
        </div>
      )}
    </div>
  );
}
