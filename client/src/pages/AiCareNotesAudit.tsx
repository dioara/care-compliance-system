import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle, Info, Download, Clock, CheckCircle, XCircle, FileText, History, RefreshCw, Upload, ClipboardPaste, FileDown, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AiCareNotesAudit() {
  // Get tRPC utils for imperative calls
  const utils = trpc.useUtils();
  
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setPastedText('');
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
    { limit: 50, auditType: 'daily_notes' },
    { enabled: activeTab === 'history' }
  );

  // Care notes jobs from filtered history
  const careNotesJobs = jobHistory?.jobs || [];

  // Stop polling when job completes
  useEffect(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      refetchHistory();
    }
  }, [jobStatus?.status]);

  const handleDownloadTemplate = () => {
    // Download the CSV template
    const link = document.createElement('a');
    link.href = '/templates/care-notes-template.csv';
    link.download = 'care-notes-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded');
  };

  const handleSubmit = async () => {
    if (!hasOpenAiKey) {
      toast.error('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    // Validate input
    if (inputMethod === 'upload' && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (inputMethod === 'paste' && !pastedText.trim()) {
      toast.error('Please paste your care notes');
      return;
    }

    try {
      setIsUploading(true);
      
      let fileId: string;
      let fileName: string;
      let fileType: string;

      if (inputMethod === 'upload' && selectedFile) {
        // Upload file to temp storage via HTTP POST
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
        fileId = uploadResult.fileId;
        fileName = selectedFile.name;
        fileType = selectedFile.type;
      } else {
        // Create a text file from pasted content
        const textBlob = new Blob([pastedText], { type: 'text/plain' });
        const textFile = new File([textBlob], 'pasted-care-notes.txt', { type: 'text/plain' });
        
        const formData = new FormData();
        formData.append('file', textFile);
        
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
        fileId = uploadResult.fileId;
        fileName = 'pasted-care-notes.txt';
        fileType = 'text/plain';
      }

      setIsUploading(false);
      setIsSubmitting(true);

      // Submit job without anonymisation fields
      await submitJobMutation.mutateAsync({
        fileId,
        fileName,
        fileType,
        serviceUserName: null,
        serviceUserFirstName: null,
        serviceUserLastName: null,
        keepOriginalNames: true,
        replaceFirstNameWith: null,
        replaceLastNameWith: null,
        consentConfirmed: true,
        anonymise: false,
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
      const result = await utils.client.aiAuditJobs.downloadReport.query({ id: jobId });
      
      if (result.data) {
        // Convert base64 to blob and download
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'care-notes-audit-report.docx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Report downloaded successfully');
      } else {
        toast.error('No document data received');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download report: ' + (error?.message || 'Unknown error'));
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
  const hasValidInput = inputMethod === 'upload' ? !!selectedFile : !!pastedText.trim();

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

          {/* Data Privacy Notice */}
          <Alert className="border-amber-200 bg-amber-50">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Data Privacy:</strong> Care notes may contain multiple service user and staff names. 
              If you need to anonymise the data for confidentiality, please do so before uploading. 
              The system will analyse the notes as provided.
            </AlertDescription>
          </Alert>

          {/* Care Notes Input */}
          <Card>
            <CardHeader>
              <CardTitle>Care Notes</CardTitle>
              <CardDescription>
                Upload a file or paste your care notes directly for CQC compliance analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input Method Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={inputMethod === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMethod('upload')}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  variant={inputMethod === 'paste' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInputMethod('paste')}
                  className="flex-1"
                >
                  <ClipboardPaste className="w-4 h-4 mr-2" />
                  Paste Text
                </Button>
              </div>

              {inputMethod === 'upload' ? (
                <>
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

                  {/* Template Download */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                    <div className="flex items-start gap-3">
                      <FileDown className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Optimal Analysis Template</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          For best results, download our CSV template and format your notes accordingly. You can also upload notes directly from your care system.
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-2"
                          onClick={handleDownloadTemplate}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Textarea
                    placeholder="Paste your care notes here...

Example format:
08/01/2026 - Morning Visit - Carer: Jane Smith
Arrived at 8:30am. Greeted service user who was in good spirits. Consent obtained before providing personal care..."
                    className="min-h-[250px] font-mono text-sm"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    disabled={isLoading}
                  />
                  {pastedText && (
                    <p className="text-xs text-muted-foreground">
                      {pastedText.length} characters
                    </p>
                  )}
                </>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Analysis typically takes less than an hour depending on the number of notes. You'll receive a notification when complete.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isLoading || !hasOpenAiKey || !hasValidInput}
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
                            <span className="truncate max-w-[250px]">{job.documentName}</span>
                          </div>
                        </TableCell>
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
