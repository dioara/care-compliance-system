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
        console.log('[Frontend] Creating FormData for multipart upload');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('serviceUserName', serviceUserName);
        formData.append('anonymise', anonymise.toString());
        
        console.log('[Frontend] Payload size (file only):', Math.round(selectedFile.size / 1024), 'KB');
        console.log('[Frontend] Calling multipart upload endpoint');
        
        // Get auth token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.error('[Frontend] ERROR: No auth token found in localStorage');
          toast.error('Authentication required. Please log in again.');
          return;
        }
        console.log('[Frontend] Auth token found:', token ? 'Yes' : 'No');
        
        // Set analyzing state
        setAnalysisResult(null);
        const toastId = toast.loading('Analyzing care plan...');
        
        const response = await fetch('/api/upload/ai/analyze-care-plan-file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        console.log('[Frontend] Response status:', response.status);
        console.log('[Frontend] Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Frontend] ERROR: Request failed:', errorData);
          toast.dismiss(toastId);
          toast.error(`Analysis failed: ${errorData.error || response.statusText}`);
          return;
        }
        
        const result = await response.json();
        console.log('[Frontend] Analysis complete successfully');
        console.log('[Frontend] Result summary:', {
          hasAnalysis: !!result.analysis,
          hasNameMappings: !!result.nameMappings,
          hasFileMetadata: !!result.fileMetadata
        });
        
        setAnalysisResult(result);
        toast.dismiss(toastId);
        toast.success('Care plan analysis complete!');
      } catch (error) {
        console.error('[Frontend] ERROR: Failed to analyze file');
        console.error('[Frontend] Error type:', error?.constructor?.name);
        console.error('[Frontend] Error message:', error instanceof Error ? error.message : String(error));
        toast.error('Failed to analyze file');
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

      {/* Results */}
      {analysisResult && (
        <CarePlanResults 
          analysis={analysisResult.analysis} 
          nameMappings={analysisResult.nameMappings}
        />
      )}
    </div>
  );
}
