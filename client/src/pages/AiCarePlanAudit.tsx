import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RichTextEditor } from '@/components/RichTextEditor';
import { FileUpload } from '@/components/FileUpload';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CarePlanResults } from '@/components/CarePlanResults';

export default function AiCarePlanAudit() {
  // Get tRPC utils for imperative calls
  const utils = trpc.useUtils();
  
  const [inputMethod, setInputMethod] = useState<'editor' | 'file'>('file');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Name fields
  const [serviceUserFirstName, setServiceUserFirstName] = useState('');
  const [serviceUserLastName, setServiceUserLastName] = useState('');
  
  // Anonymisation options
  const [anonymisationOption, setAnonymisationOption] = useState<'replace' | 'keep'>('replace');
  const [replaceFirstNameWith, setReplaceFirstNameWith] = useState('');
  const [replaceLastNameWith, setReplaceLastNameWith] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Check if OpenAI key is configured
  const { data: orgSettings } = trpc.organization.getSettings.useQuery();
  const hasOpenAiKey = !!orgSettings?.openaiApiKey;

  // Fetch job history
  const { data: jobHistory, refetch: refetchJobs } = trpc.aiAuditJobs.list.useQuery(
    { limit: 10, status: undefined },
    { refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  // Debug logging
  useEffect(() => {
    console.log('[AiCarePlanAudit] Job history data:', jobHistory);
  }, [jobHistory]);

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
      toast.success('Analysis job submitted successfully! Processing in background...');
      
      // Refetch job history to show the new job
      refetchJobs();
      
      // Clear form
      setSelectedFile(null);
      setServiceUserFirstName('');
      setServiceUserLastName('');
      setReplaceFirstNameWith('');
      setReplaceLastNameWith('');
      setConsentConfirmed(false);
      setAnonymisationOption('replace');
    },
    onError: (error) => {
      console.error('[Frontend] ERROR: Failed to submit job');
      console.error('[Frontend] Error:', error);
      toast.error(error.message || 'Failed to submit analysis job');
    },
  });

  // Validate form
  const isFormValid = () => {
    if (!serviceUserFirstName.trim() || !serviceUserLastName.trim()) {
      return false;
    }
    
    if (anonymisationOption === 'replace') {
      if (!replaceFirstNameWith.trim() || !replaceLastNameWith.trim()) {
        return false;
      }
    } else {
      // Keep original names - must confirm consent
      if (!consentConfirmed) {
        return false;
      }
    }
    
    if (inputMethod === 'file' && !selectedFile) {
      return false;
    }
    
    if (inputMethod === 'editor') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      if (!textContent.trim()) {
        return false;
      }
    }
    
    return true;
  };

  const handleAnalyse = async () => {
    if (!hasOpenAiKey) {
      toast.error('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    if (!isFormValid()) {
      if (!serviceUserFirstName.trim() || !serviceUserLastName.trim()) {
        toast.error('Please enter the service user\'s first and last name');
        return;
      }
      if (anonymisationOption === 'replace' && (!replaceFirstNameWith.trim() || !replaceLastNameWith.trim())) {
        toast.error('Please enter replacement names for anonymisation');
        return;
      }
      if (anonymisationOption === 'keep' && !consentConfirmed) {
        toast.error('Please confirm you have consent to use the real name');
        return;
      }
      toast.error('Please complete all required fields');
      return;
    }

    // Build service user name for display
    const serviceUserName = `${serviceUserFirstName} ${serviceUserLastName}`;

    if (inputMethod === 'editor') {
      // Extract plain text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      if (!textContent.trim()) {
        toast.error('Please enter care plan content');
        return;
      }

      analyzeCarePlanMutation.mutate({
        content: textContent,
        serviceUserName,
        anonymise: anonymisationOption === 'replace',
      });
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
        
        // Step 2: Submit job with file reference and name fields
        toast.dismiss(toastId);
        const submitToastId = toast.loading('Submitting analysis job...');
        
        submitCarePlanAuditMutation.mutate({
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
        
        toast.dismiss(submitToastId);
      } catch (error) {
        console.error('[Frontend] ERROR: Failed to upload file');
        console.error('[Frontend] Error:', error);
        toast.error('Failed to upload file');
      }
      return;
    }
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
            OpenAI API key is not configured. Please contact your administrator to set up the API key in organisation settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Service User Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Service User Details</CardTitle>
          <CardDescription>
            Enter the service user's name as it appears in the care plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceUserFirstName">First Name <span className="text-red-500">*</span></Label>
              <Input
                id="serviceUserFirstName"
                placeholder="e.g., Anne"
                value={serviceUserFirstName}
                onChange={(e) => setServiceUserFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceUserLastName">Last Name <span className="text-red-500">*</span></Label>
              <Input
                id="serviceUserLastName"
                placeholder="e.g., Holliday"
                value={serviceUserLastName}
                onChange={(e) => setServiceUserLastName(e.target.value)}
              />
            </div>
          </div>

          {/* Anonymisation Options */}
          <div className="space-y-4">
            <Label>Name Handling in Report</Label>
            <RadioGroup
              value={anonymisationOption}
              onValueChange={(value) => setAnonymisationOption(value as 'replace' | 'keep')}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="replace" id="replace" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <Label htmlFor="replace" className="font-medium cursor-pointer">
                    Replace names (recommended for confidentiality)
                  </Label>
                  {anonymisationOption === 'replace' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="replaceFirstNameWith" className="text-sm">
                          Replace first name with <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="replaceFirstNameWith"
                          placeholder="e.g., A or Jane or [Redacted]"
                          value={replaceFirstNameWith}
                          onChange={(e) => setReplaceFirstNameWith(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="replaceLastNameWith" className="text-sm">
                          Replace last name with <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="replaceLastNameWith"
                          placeholder="e.g., H or Smith or [Redacted]"
                          value={replaceLastNameWith}
                          onChange={(e) => setReplaceLastNameWith(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="keep" id="keep" className="mt-1" />
                <div className="flex-1 space-y-3">
                  <Label htmlFor="keep" className="font-medium cursor-pointer">
                    Keep original names
                  </Label>
                  {anonymisationOption === 'keep' && (
                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox
                        id="consentConfirmed"
                        checked={consentConfirmed}
                        onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                      />
                      <Label htmlFor="consentConfirmed" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                        I confirm that I have appropriate consent and authorisation to process and store the service user's real name in this audit report. <span className="text-red-500">*</span>
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Care Plan Input</CardTitle>
          <CardDescription>
            Upload a care plan document or paste the content directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'editor' | 'file')}>
            <TabsList>
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="editor">Rich Text Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <FileUpload
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFileRemove={() => setSelectedFile(null)}
                maxSizeMB={10}
                acceptedFormats={['.pdf', '.doc', '.docx', '.csv', '.xlsx', '.xls']}
              />
            </TabsContent>

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
          </Tabs>

          <p className="text-xs text-muted-foreground">
            Maximum file size: 10MB. Supported formats: PDF, Word, CSV, Excel
          </p>
        </CardContent>
      </Card>

      {/* Analyse Button */}
      <div className="space-y-2">
        <Button
          onClick={handleAnalyse}
          disabled={analyzeCarePlanMutation.isPending || analyzeCarePlanFileMutation.isPending || submitCarePlanAuditMutation.isPending || !hasOpenAiKey || !isFormValid()}
          size="lg"
          className="w-full"
        >
          {(analyzeCarePlanMutation.isPending || analyzeCarePlanFileMutation.isPending || submitCarePlanAuditMutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyse Care Plan
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Analysis typically takes less than an hour
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
                    {job.status === 'completed' && job.processedAt && (() => {
                      const processedDate = new Date(job.processedAt);
                      const expiryDate = new Date(processedDate.getTime() + (90 * 24 * 60 * 60 * 1000));
                      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                      
                      if (daysUntilExpiry > 0) {
                        return (
                          <div className="text-xs text-muted-foreground mt-1">
                            Report expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} ({expiryDate.toLocaleDateString()})
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-xs text-red-600 mt-1">
                            Report expired
                          </div>
                        );
                      }
                    })()}
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
                            console.log('[AiCarePlanAudit] Download clicked for job:', job);
                            try {
                              console.log('[AiCarePlanAudit] Calling downloadReport via utils.client with id:', job.id);
                              const result = await utils.client.aiAuditJobs.downloadReport.query({ id: job.id });
                              console.log('[AiCarePlanAudit] downloadReport result:', { filename: result.filename, dataLength: result.data?.length });
                              
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
                                a.download = result.filename || `Care_Plan_Analysis_${job.serviceUserName?.replace(/\s+/g, '_') || 'Report'}_${new Date(job.createdAt).toISOString().split('T')[0]}.docx`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success('Report downloaded successfully');
                              } else {
                                toast.error('No document data received');
                              }
                            } catch (error: any) {
                              console.error('[AiCarePlanAudit] Download error:', error);
                              console.error('[AiCarePlanAudit] Error details:', JSON.stringify(error, null, 2));
                              toast.error('Failed to download report: ' + (error?.message || 'Unknown error'));
                            }
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                              try {
                                await utils.client.aiAuditJobs.delete.mutate({ id: job.id });
                                toast.success('Report deleted successfully');
                                refetchJobs();
                              } catch (error) {
                                toast.error('Failed to delete report');
                              }
                            }
                          }}
                        >
                          Delete
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
                    a.download = `Care_Plan_Analysis_${serviceUserFirstName}_${serviceUserLastName}_${new Date().toISOString().split('T')[0]}.docx`;
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
