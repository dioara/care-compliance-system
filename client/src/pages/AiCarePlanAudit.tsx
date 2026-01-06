import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/RichTextEditor';
import { FileUpload } from '@/components/FileUpload';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CarePlanResults } from '@/components/CarePlanResults';
import { fileToBase64 } from '@/lib/fileUtils';

export default function AiCarePlanAudit() {
  const [inputMethod, setInputMethod] = useState<'editor' | 'file'>('editor');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceUserName, setServiceUserName] = useState('');
  const [anonymise, setAnonymise] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Check if OpenAI key is configured
  const { data: orgSettings } = trpc.organization.getSettings.useQuery();
  const hasOpenAiKey = !!orgSettings?.openaiApiKey;

  // Fetch job history
  const { data: jobHistory, refetch: refetchJobs } = trpc.aiAuditJobs.list.useQuery(
    { limit: 10, status: undefined },
    { refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  const analyzeCarePlanMutation = trpc.ai.analyzeCarePlan.useMutation({
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast.success('Care plan analysis complete!');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const analyzeCarePlanFileMutation = trpc.ai.analyzeCarePlanFile.useMutation({
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast.success('Care plan analysis complete!');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const submitCarePlanAuditMutation = trpc.aiAuditJobs.submitCarePlanAudit.useMutation({
    onSuccess: (result) => {
      console.log('[Frontend] Job created successfully');
      console.log('[Frontend] Job ID:', result.jobId);
      toast.success('Analysis job submitted! Redirecting to audits list...');
      
      // Redirect to audits list after a short delay
      setTimeout(() => {
        window.location.href = '/ai-care-plan-audits';
      }, 1500);
    },
    onError: (error) => {
      console.error('[Frontend] ERROR: Failed to submit job');
      console.error('[Frontend] Error:', error);
      toast.error(error.message || 'Failed to submit analysis job');
    },
  });

  const handleAnalyse = async () => {
    if (!hasOpenAiKey) {
      toast.error('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    let textContent = '';

    if (inputMethod === 'editor') {
      // Extract plain text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      if (!textContent.trim()) {
        toast.error('Please enter care plan content');
        return;
      }
    } else if (inputMethod === 'file') {
      console.log('[Frontend] File upload analysis starting');
      console.log('[Frontend] Selected file:', selectedFile);
      
      if (!selectedFile) {
        console.error('[Frontend] ERROR: No file selected');
        toast.error('Please select a file to upload');
        return;
      }

      console.log('[Frontend] File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: new Date(selectedFile.lastModified).toISOString()
      });

      try {
        console.log('[Frontend] Uploading file to temp storage');
        
        // Set analyzing state
        setAnalysisResult(null);
        const toastId = toast.loading('Uploading file...');
        
        // Step 1: Upload file to temp storage
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          toast.dismiss(toastId);
          toast.error('Authentication required. Please log in again.');
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
          toast.dismiss(toastId);
          toast.error(`Upload failed: ${errorData.error}`);
          return;
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('[Frontend] File uploaded:', uploadResult.fileId);
        
        // Step 2: Submit job with file reference
        toast.dismiss(toastId);
        const submitToastId = toast.loading('Submitting analysis job...');
        
        submitCarePlanAuditMutation.mutate({
          fileId: uploadResult.fileId,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          serviceUserName,
          anonymise,
        });
        
        toast.dismiss(submitToastId);
      } catch (error) {
        console.error('[Frontend] ERROR: Failed to upload file');
        console.error('[Frontend] Error:', error);
        toast.error('Failed to upload file');
      }
      return;
    }

    analyzeCarePlanMutation.mutate({
      content: textContent,
      serviceUserName,
      anonymise,
    });
  };

  const characterCount = content.replace(/<[^>]*>/g, '').length;
  const maxCharacters = 50000;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Care Plan Audit</h1>
        <p className="text-muted-foreground mt-1">
          Analyse care plans for CQC compliance using AI
        </p>
      </div>

      {/* OpenAI Key Warning */}
      {!hasOpenAiKey && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            OpenAI API key is not configured. Please contact your administrator to set up the API key in organization settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Care Plan Input</CardTitle>
          <CardDescription>
            Choose an audit type to manage its question KLOEs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'editor' | 'file')}>
            <TabsList>
              <TabsTrigger value="editor">Rich Text Editor</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-2">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Paste or type care plan content here..."
                minHeight="300px"
              />
              <div className="text-sm text-muted-foreground text-right">
                {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
              </div>
            </TabsContent>

            <TabsContent value="file">
              <FileUpload
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                maxSizeMB={10}
                acceptedFormats={['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls']}
              />
            </TabsContent>
          </Tabs>

          <p className="text-xs text-muted-foreground">
            Maximum file size: 10MB. Supported formats: PDF, Word, CSV, Excel
          </p>
        </CardContent>
      </Card>

      {/* Analysis Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceUserName">Service User Name</Label>
            <Input
              id="serviceUserName"
              placeholder="e.g., John Smith"
              value={serviceUserName}
              onChange={(e) => setServiceUserName(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used for context in the AI analysis
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anonymise">Anonymise names (e.g., John Smith → JS)</Label>
              <p className="text-sm text-muted-foreground">
                Names will be abbreviated in the analysis results
              </p>
            </div>
            <Switch
              id="anonymise"
              checked={anonymise}
              onCheckedChange={setAnonymise}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analyse Button */}
      <div className="space-y-2">
        <Button
          onClick={handleAnalyse}
          disabled={analyzeCarePlanMutation.isPending || analyzeCarePlanFileMutation.isPending || !hasOpenAiKey}
          size="lg"
          className="w-full"
        >
          {(analyzeCarePlanMutation.isPending || analyzeCarePlanFileMutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analysing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyse Care Plan
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Analysis typically takes 2-3 minutes
        </p>
      </div>

      {/* Job History */}
      {jobHistory && jobHistory.jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Analysis Jobs</CardTitle>
            <CardDescription>
              View status and download completed analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobHistory.jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{job.documentName}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.serviceUserName && `${job.serviceUserName} • `}
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                    {job.progress && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {job.progress}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {job.status === 'processing' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const result = await trpc.aiAuditJobs.downloadReport.query({ id: job.id });
                              if (result.documentBase64) {
                                const blob = new Blob(
                                  [Uint8Array.from(atob(result.documentBase64), c => c.charCodeAt(0))],
                                  { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Care_Plan_Analysis_${job.serviceUserName?.replace(/\s+/g, '_') || 'Report'}_${new Date(job.createdAt).toISOString().split('T')[0]}.docx`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success('Report downloaded successfully');
                              }
                            } catch (error) {
                              toast.error('Failed to download report');
                            }
                          }}
                        >
                          Download
                        </Button>
                      </>
                    )}
                    {job.status === 'failed' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Download Button */}
          {analysisResult.documentBase64 && (
            <Card>
              <CardHeader>
                <CardTitle>Download Detailed Report</CardTitle>
                <CardDescription>
                  Download the complete ultra-pedantic analysis as a Word document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [Uint8Array.from(atob(analysisResult.documentBase64!), c => c.charCodeAt(0))],
                      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Care_Plan_Analysis_${serviceUserName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Full Analysis Report (.docx)
                </button>
              </CardContent>
            </Card>
          )}
          
          <CarePlanResults 
            analysis={analysisResult.analysis} 
            nameMappings={analysisResult.nameMappings}
          />
        </div>
      )}
    </div>
  );
}
