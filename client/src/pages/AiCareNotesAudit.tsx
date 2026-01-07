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
      
      // Upload file to temp storage via HTTP POST (same as care plan audit)
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        setIsUploading(false);
        return;
      }
      
      const uploadResponse = await fetch('/api/temp-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
        toast.error(`Upload failed: ${errorData.error}`);
        setIsUploading(false);
        return;
      }
      
      const uploadResult = await uploadResponse.json();

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
                  You can close this page. You'll receive a notification when the analysis is complete.
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
                <p>Your care notes audit is ready to download.</p>
                <Button onClick={() => handleDownload(currentJobId)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
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
              <CardContent>
                <p className="text-red-600">{jobStatus.error || 'An error occurred during analysis. Please try again.'}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Service User Details */}
            <Card>
              <CardHeader>
                <CardTitle>Service User Details</CardTitle>
                <CardDescription>
                  Enter the service user's name as it appears in the care notes. 
                  <span className="text-amber-600 font-medium"> If the filename contains the service user's name, please rename it before uploading.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="e.g., John or Jane"
                      value={serviceUserFirstName}
                      onChange={(e) => setServiceUserFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="e.g., Smith"
                      value={serviceUserLastName}
                      onChange={(e) => setServiceUserLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>Name Handling in Report</Label>
                  <RadioGroup
                    value={anonymisationOption}
                    onValueChange={(v) => setAnonymisationOption(v as 'replace' | 'keep')}
                  >
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="replace" id="replace" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="replace" className="font-normal cursor-pointer">
                          Replace names in report (recommended for confidentiality)
                        </Label>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="keep" id="keep" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="keep" className="font-normal cursor-pointer">
                          Keep original names in report
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {anonymisationOption === 'replace' && (
                  <div className="grid grid-cols-2 gap-4 pt-2 pl-6 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label htmlFor="replaceFirst">Replace First Name With</Label>
                      <Input
                        id="replaceFirst"
                        placeholder="e.g., J or Jane"
                        value={replaceFirstNameWith}
                        onChange={(e) => setReplaceFirstNameWith(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replaceLast">Replace Last Name With</Label>
                      <Input
                        id="replaceLast"
                        placeholder="e.g., S or Smith"
                        value={replaceLastNameWith}
                        onChange={(e) => setReplaceLastNameWith(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {anonymisationOption === 'keep' && (
                  <div className="pt-2 pl-6 border-l-2 border-amber-200">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="consent"
                        checked={consentConfirmed}
                        onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                      />
                      <Label htmlFor="consent" className="font-normal text-sm cursor-pointer">
                        I confirm that I have appropriate consent to include the service user's real name in the audit report, and understand this may have data protection implications.
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Care Notes</CardTitle>
                <CardDescription>
                  Upload care notes exported from your care management system (PDF, Word, Excel, or CSV).
                  <span className="text-amber-600 font-medium block mt-1">
                    Important: Remove the service user's name from the filename before uploading for confidentiality.
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  disabled={isLoading}
                />
                
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{selectedFile.name}</span>
                    <span>({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Analysis typically takes less than an hour depending on the number of notes. You'll receive a notification when complete.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || !hasOpenAiKey || !selectedFile || !serviceUserFirstName || !serviceUserLastName}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Care Notes Audit
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
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
