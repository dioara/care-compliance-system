import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Brain, Upload, FileText, AlertCircle, CheckCircle, XCircle, Clock, Key, Loader2, Shield, Download, File } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AIAudits() {
  const { data: apiKeyStatus, isLoading: isLoadingApiKey } = trpc.aiAudits.getApiKeyStatus.useQuery();
  const { data: auditHistory, refetch: refetchHistory } = trpc.aiAudits.getHistory.useQuery({ limit: 10 });
  const submitAudit = trpc.aiAudits.submitAudit.useMutation();
  const submitFromFile = trpc.aiAudits.submitFromFile.useMutation();
  const generatePDF = trpc.aiAudits.generatePDF.useMutation();

  const [carePlanText, setCarePlanText] = useState("");
  const [carePlanName, setCarePlanName] = useState("");
  const [dailyNotesText, setDailyNotesText] = useState("");
  const [dailyNotesName, setDailyNotesName] = useState("");
  const [customNames, setCustomNames] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [".pdf", ".docx", ".txt"];
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (!validTypes.includes(ext)) {
        toast.error("Please upload a PDF, Word (.docx), or text file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitCarePlan = async () => {
    if (uploadMode === "text" && carePlanText.length < 100) {
      toast.error("Please enter at least 100 characters of care plan text");
      return;
    }
    if (uploadMode === "file" && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsProcessing(true);
    setAuditResult(null);

    try {
      let result;
      if (uploadMode === "file" && selectedFile) {
        const fileContent = await fileToBase64(selectedFile);
        result = await submitFromFile.mutateAsync({
          auditType: "care_plan",
          fileContent,
          fileName: selectedFile.name,
          documentName: carePlanName || undefined,
          customNames: customNames ? customNames.split(",").map(n => n.trim()).filter(Boolean) : undefined,
          notifyEmail: notifyEmail || undefined,
        });
      } else {
        result = await submitAudit.mutateAsync({
          auditType: "care_plan",
          documentText: carePlanText,
          documentName: carePlanName || undefined,
          customNames: customNames ? customNames.split(",").map(n => n.trim()).filter(Boolean) : undefined,
        });
      }

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

  const handleDownloadPDF = async (auditId: number) => {
    try {
      toast.info("Generating PDF report...");
      const { url, filename } = await generatePDF.mutateAsync({ auditId });
      
      // Download the PDF
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("PDF report downloaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate PDF");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
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
                  Upload a file or paste care plan content for AI analysis. Names are automatically converted to initials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={uploadMode === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("text")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Paste Text
                  </Button>
                  <Button
                    variant={uploadMode === "file" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMode("file")}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>

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

                {uploadMode === "text" ? (
                  <div className="space-y-2">
                    <Label htmlFor="carePlanText">Care Plan Content *</Label>
                    <Textarea
                      id="carePlanText"
                      placeholder="Paste the care plan text here..."
                      value={carePlanText}
                      onChange={(e) => setCarePlanText(e.target.value)}
                      rows={10}
                      disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                    />
                    <p className="text-xs text-muted-foreground">
                      {carePlanText.length} characters (minimum 100 required)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Upload Document *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        selectedFile ? "border-green-500 bg-green-50" : "border-muted-foreground/25 hover:border-primary"
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                      />
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="h-8 w-8 text-green-600" />
                          <div className="text-left">
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, Word (.docx), or Text files up to 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

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

                <div className="space-y-2">
                  <Label htmlFor="notifyEmail">Email Notification (optional)</Label>
                  <Input
                    id="notifyEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    disabled={!apiKeyStatus?.hasApiKey || isProcessing}
                  />
                  <p className="text-xs text-muted-foreground">
                    Receive an email summary when the audit completes
                  </p>
                </div>

                <Button
                  onClick={handleSubmitCarePlan}
                  disabled={
                    !apiKeyStatus?.hasApiKey ||
                    isProcessing ||
                    (uploadMode === "text" && carePlanText.length < 100) ||
                    (uploadMode === "file" && !selectedFile)
                  }
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
                  <AuditResultDisplay result={auditResult} onDownloadPDF={() => handleDownloadPDF(auditResult.auditId)} />
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
                  <AuditResultDisplay result={auditResult} onDownloadPDF={() => handleDownloadPDF(auditResult.auditId)} />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(audit.id)}
                        disabled={audit.status !== "completed" || generatePDF.isPending}
                      >
                        {generatePDF.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
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

function AuditResultDisplay({ result, onDownloadPDF }: { result: any; onDownloadPDF: () => void }) {
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

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4" />
            Strengths
          </h4>
          <ul className="space-y-1 text-sm">
            {strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-600">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {areasForImprovement && areasForImprovement.length > 0 && (
        <div>
          <h4 className="font-semibold text-orange-700 flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1 text-sm">
            {areasForImprovement.map((a: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-600">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4" />
            Recommendations
          </h4>
          <ul className="space-y-1 text-sm">
            {recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-600">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CQC Notes */}
      {cqcComplianceNotes && (
        <div className="bg-muted p-3 rounded-lg">
          <h4 className="font-semibold text-sm mb-1">CQC Compliance Notes</h4>
          <p className="text-sm text-muted-foreground">{cqcComplianceNotes}</p>
        </div>
      )}

      {/* Download Button */}
      <Button onClick={onDownloadPDF} variant="outline" className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Download PDF Report
      </Button>
    </div>
  );
}
