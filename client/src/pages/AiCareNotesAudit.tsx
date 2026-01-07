import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/FileUpload';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle, Info, Download, Clock, CheckCircle, XCircle, FileText, History, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AiCareNotesAudit() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Service user name fields
  const [serviceUserFirstName, setServiceUserFirstName] = useState('');
  const [serviceUserLastName, setServiceUserLastName] = useState('');
  const [anonymisationOption, setAnonymisationOption] = useState<'replace' | 'keep'>('replace');
  const [replaceFirstNameWith, setReplaceFirstNameWith] = useState('');
  const [replaceLastNameWith, setReplaceLastNameWith] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Job tracking
  const [currentJobId, setCurrentJobId] = useState<number | null>(null);

  // Check if OpenAI key is configured
  const { data: orgSettings } = trpc.organization.getSettings.useQuery();
  const hasOpenAiKey = !!orgSettings?.openaiApiKey;

  // File upload mutation
  const uploadFileMutation = trpc.files.uploadTempFile.useMutation();

  // Job submission mutation
  const submitJobMutation = trpc.aiAuditJobs.submitCareNotesAudit.useMutation({
    onSuccess: (result) => {
      setCurrentJobId(result.jobId);
      toast.success('Care notes audit job submitted! You will be notified when complete.');
      // Reset form
      setSelectedFile(null);
      setServiceUserFirstName('');
      setServiceUserLastName('');
      setReplaceFirstNameWith('');
      setReplaceLastNameWith('');
      setConsentConfirmed(false);
    },
    onError: (error) => {
      toast.error(`Failed to submit job: ${error.message}`);
    },
  });

  // Job status polling
  const { data: jobStatus, refetch: refetchJobStatus } = trpc.aiAuditJobs.getStatus.useQuery(
    { id: currentJobId! },
    { 
      enabled: !!currentJobId,
      refetchInterval: currentJobId ? 5000 : false, // Poll every 5 seconds
    }
  );

  // Job history query
  const { data: jobHistory, refetch: refetchHistory } = trpc.aiAuditJobs.list.useQuery(
    { limit: 50 },
    { enabled: activeTab === 'history' }
  );

  // Filter care notes audits from history
  const careNotesJobs = jobHistory?.jobs?.filter(job => 
    job.documentName?.toLowerCase().includes('note') || 
    job.documentName?.toLowerCase().includes('diary') ||
    // Check if it's a daily_notes audit type (we'd need to add this to the list query)
    true // For now show all, will filter properly when auditType is returned
  ) || [];

  // Download report mutation
  const { data: reportData, refetch: downloadReport } = trpc.aiAuditJobs.downloadReport.useQuery(
    { id: currentJobId! },
    { enabled: false }
  );

  // Stop polling when job completes
  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      refetchHistory();
    }
  }, [jobStatus?.status]);

  const handleSubmit = async () => {
    if (!hasOpenAiKey) {
      toast.error('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    // Validate service user name
    if (!serviceUserFirstName.trim() || !serviceUserLastName.trim()) {
      toast.error('Please enter the service user\'s first and last name');
      return;
    }

    // Validate anonymisation options
    if (anonymisationOption === 'replace') {
      if (!replaceFirstNameWith.trim() || !replaceLastNameWith.trim()) {
        toast.error('Please enter replacement names for anonymisation');
        return;
      }
    } else if (anonymisationOption === 'keep' && !consentConfirmed) {
      toast.error('Please confirm you have consent to use the real name');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload file to temp storage
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: selectedFile.name,
        fileData: fileData.split(',')[1], // Remove data URL prefix
        mimeType: selectedFile.type,
      });

      setIsUploading(false);
      setIsSubmitting(true);

      // Submit job
      const serviceUserName = `${serviceUserFirstName.trim()} ${serviceUserLastName.trim()}`;
      
      await submitJobMutation.mutateAsync({
        fileId: uploadResult.fileId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        serviceUserName,
        serviceUserFirstName: serviceUserFirstName.trim(),
        serviceUserLastName: serviceUserLastName.trim(),
        keepOriginalNames: anonymisationOption === 'keep',
        replaceFirstNameWith: anonymisationOption === 'replace' ? replaceFirstNameWith.trim() : null,
        replaceLastNameWith: anonymisationOption === 'replace' ? replaceLastNameWith.trim() : null,
        consentConfirmed: anonymisationOption === 'keep' ? consentConfirmed : false,
        anonymise: anonymisationOption === 'replace',
      });

    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit care notes audit');
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (jobId: number) => {
    try {
      const result = await trpc.aiAuditJobs.downloadReport.query({ id: jobId });
      
      if (result.documentData) {
        // Convert base64 to blob and download
        const byteCharacters = atob(result.documentData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || 'care-notes-audit-report.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Report downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const isLoading = isUploading || isSubmitting;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Care Notes Audit</h1>
        <p className="text-muted-foreground mt-1">
          Analyse care notes for CQC compliance and provide detailed carer feedback
        </p>
      </div>

      {/* OpenAI Key Warning */}
      {!hasOpenAiKey && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            OpenAI API key is not configured. Please contact your administrator to set up the API key in organisation settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'history')}>
        <TabsList>
          <TabsTrigger value="new">
            <Sparkles className="w-4 h-4 mr-2" />
            New Audit
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Audit History
          </TabsTrigger>
        </TabsList>

        {/* New Audit Tab */}
        <TabsContent value="new" className="space-y-6">
          {/* Current Job Progress */}
          {currentJobId && jobStatus && jobStatus.status !== 'completed' && jobStatus.status !== 'failed' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  Analysis in Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{jobStatus.progress || 'Processing...'}</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You will receive a notification when the analysis is complete. You can also check the Audit History tab.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job Completed */}
          {currentJobId && jobStatus?.status === 'completed' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">Your care notes audit report is ready for download.</p>
                <div className="flex gap-2">
                  <Button onClick={() => handleDownload(currentJobId)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentJobId(null)}>
                    Start New Audit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Failed */}
          {currentJobId && jobStatus?.status === 'failed' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Analysis Failed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-600">{jobStatus.errorMessage || 'An error occurred during analysis.'}</p>
                <Button variant="outline" onClick={() => setCurrentJobId(null)}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Service User Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Service User Details</CardTitle>
              <CardDescription>
                Enter the service user's name for accurate analysis and anonymisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    placeholder="e.g., John or Jane"
                    value={serviceUserFirstName}
                    onChange={(e) => setServiceUserFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    placeholder="e.g., Smith"
                    value={serviceUserLastName}
                    onChange={(e) => setServiceUserLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Anonymisation Options */}
              <div className="space-y-4">
                <Label>Name Handling in Report</Label>
                <RadioGroup
                  value={anonymisationOption}
                  onValueChange={(value) => setAnonymisationOption(value as 'replace' | 'keep')}
                  className="space-y-3"
                  disabled={isLoading}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="replace" id="replace" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="replace" className="font-medium cursor-pointer">
                        Replace names in report (recommended)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        The service user's name will be replaced throughout the report
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="keep" id="keep" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="keep" className="font-medium cursor-pointer">
                        Keep original names
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        The real name will appear in the report (requires consent)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Replacement Name Fields */}
              {anonymisationOption === 'replace' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="replaceFirst">Replace First Name With <span className="text-red-500">*</span></Label>
                    <Input
                      id="replaceFirst"
                      placeholder="e.g., J, Jane, Service User"
                      value={replaceFirstNameWith}
                      onChange={(e) => setReplaceFirstNameWith(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="replaceLast">Replace Last Name With <span className="text-red-500">*</span></Label>
                    <Input
                      id="replaceLast"
                      placeholder="e.g., S, Smith, [Redacted]"
                      value={replaceLastNameWith}
                      onChange={(e) => setReplaceLastNameWith(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Consent Checkbox */}
              {anonymisationOption === 'keep' && (
                <div className="flex items-start space-x-3 pl-6 border-l-2 border-destructive/20">
                  <Checkbox
                    id="consent"
                    checked={consentConfirmed}
                    onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                    className="mt-1"
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="consent" className="font-medium cursor-pointer">
                      I confirm I have appropriate consent to use the real name <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      By checking this box, you confirm that you have obtained the necessary consent to include the service user's real name in the audit report.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Care Notes</CardTitle>
              <CardDescription>
                Upload a file containing care notes (PDF, Word, Excel, or CSV)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> If the filename contains the service user's name, please rename it before uploading to maintain confidentiality.
                </AlertDescription>
              </Alert>
              <FileUpload
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                maxSizeMB={10}
                acceptedFormats={['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls']}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB. Supported formats: PDF (including Nourish exports), Word, CSV, Excel
              </p>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !hasOpenAiKey || !selectedFile}
              size="lg"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading File...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Job...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Care Notes Audit
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Analysis typically takes less than an hour depending on the number of notes. You will be notified when complete.
            </p>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit History</CardTitle>
                <CardDescription>View and download previous care notes audit reports</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {careNotesJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No care notes audits found</p>
                  <p className="text-sm">Start a new audit to see it here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Service User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {careNotesJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{job.documentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{job.serviceUserName || '-'}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          {job.score !== null && job.score !== undefined ? (
                            <span className={job.score >= 70 ? 'text-green-600' : job.score >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                              {job.score}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB') : '-'}
                        </TableCell>
                        <TableCell>
                          {job.status === 'completed' && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(job.id)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          {job.status === 'processing' && (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
