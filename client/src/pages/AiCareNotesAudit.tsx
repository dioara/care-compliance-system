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

export default function AiCareNotesAudit() {
  const [inputMethod, setInputMethod] = useState<'editor' | 'file'>('editor');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [anonymize, setAnonymize] = useState(true);
  const [serviceUserName, setServiceUserName] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Check if OpenAI key is configured
  const { data: orgSettings } = trpc.organization.getSettings.useQuery();
  const hasOpenAiKey = !!orgSettings?.openaiApiKey;

  const analyzeCareNotesMutation = trpc.ai.analyzeCareNotes.useMutation({
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast.success('Care notes analysis complete!');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = async () => {
    if (!hasOpenAiKey) {
      toast.error('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    if (!serviceUserName.trim()) {
      toast.error('Please enter the service user name');
      return;
    }

    let textContent = '';

    if (inputMethod === 'editor') {
      // Extract plain text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      if (!textContent.trim()) {
        toast.error('Please enter care notes content');
        return;
      }
    } else if (inputMethod === 'file') {
      if (!selectedFile) {
        toast.error('Please select a file to upload');
        return;
      }

      // For now, we'll handle file upload in the backend
      // TODO: Implement file upload endpoint
      toast.info('File upload processing...');
      return;
    }

    analyzeCareNotesMutation.mutate({
      content: textContent,
      serviceUserName,
      anonymize,
    });
  };

  const characterCount = content.replace(/<[^>]*>/g, '').length;
  const maxCharacters = 100000;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI Care Notes Audit</h1>
        <p className="text-muted-foreground mt-1">
          Analyze care notes for CQC compliance and provide carer feedback
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
          <CardTitle>Input Options</CardTitle>
          <CardDescription>
            Paste care notes or upload a file containing multiple notes
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
                placeholder="Paste care notes here (one per line or separated by ---NOTE--- markers)..."
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anonymize">Anonymize names (e.g., John Smith → JS)</Label>
              <p className="text-sm text-muted-foreground">
                Names will be abbreviated in feedback and results
              </p>
            </div>
            <Switch
              id="anonymize"
              checked={anonymize}
              onCheckedChange={setAnonymize}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceUserName">Service User Name</Label>
            <Input
              id="serviceUserName"
              placeholder="e.g., Ann Boyes"
              value={serviceUserName}
              onChange={(e) => setServiceUserName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for context in the AI analysis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="space-y-2">
        <Button
          onClick={handleAnalyze}
          disabled={analyzeCareNotesMutation.isPending || !hasOpenAiKey}
          size="lg"
          className="w-full"
        >
          {analyzeCareNotesMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyze Care Notes
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Analysis typically takes 4-6 minutes for 50+ notes
        </p>
      </div>

      {/* Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(analysisResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
