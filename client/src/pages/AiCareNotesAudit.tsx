import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/RichTextEditor';
import { FileUpload } from '@/components/FileUpload';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CareNotesResults } from '@/components/CareNotesResults';
import { fileToBase64 } from '@/lib/fileUtils';

export default function AiCareNotesAudit() {
  const [inputMethod, setInputMethod] = useState<'editor' | 'file'>('editor');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Service user name fields (same as care plan audit)
  const [serviceUserFirstName, setServiceUserFirstName] = useState('');
  const [serviceUserLastName, setServiceUserLastName] = useState('');
  const [anonymisationOption, setAnonymisationOption] = useState<'replace' | 'keep'>('replace');
  const [replaceFirstNameWith, setReplaceFirstNameWith] = useState('');
  const [replaceLastNameWith, setReplaceLastNameWith] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

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

  const analyzeCareNotesFileMutation = trpc.ai.analyzeCareNotesFile.useMutation({
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast.success('Care notes analysis complete!');
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

    const serviceUserName = `${serviceUserFirstName.trim()} ${serviceUserLastName.trim()}`;
    const anonymise = anonymisationOption === 'replace';

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

      analyzeCareNotesMutation.mutate({
        content: textContent,
        serviceUserName,
        anonymise,
        serviceUserFirstName: serviceUserFirstName.trim(),
        serviceUserLastName: serviceUserLastName.trim(),
        replaceFirstNameWith: anonymise ? replaceFirstNameWith.trim() : undefined,
        replaceLastNameWith: anonymise ? replaceLastNameWith.trim() : undefined,
      });
    } else if (inputMethod === 'file') {
      if (!selectedFile) {
        toast.error('Please select a file to upload');
        return;
      }

      try {
        const fileData = await fileToBase64(selectedFile);
        analyzeCareNotesFileMutation.mutate({
          fileData,
          filename: selectedFile.name,
          serviceUserName,
          anonymise,
          serviceUserFirstName: serviceUserFirstName.trim(),
          serviceUserLastName: serviceUserLastName.trim(),
          replaceFirstNameWith: anonymise ? replaceFirstNameWith.trim() : undefined,
          replaceLastNameWith: anonymise ? replaceLastNameWith.trim() : undefined,
        });
      } catch (error) {
        toast.error('Failed to read file');
      }
    }
  };

  const characterCount = content.replace(/<[^>]*>/g, '').length;
  const maxCharacters = 100000;
  const isLoading = analyzeCareNotesMutation.isPending || analyzeCareNotesFileMutation.isPending;

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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
              <Input
                id="lastName"
                placeholder="e.g., Smith"
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
              className="space-y-3"
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

          {/* Replacement Name Fields (shown when "replace" is selected) */}
          {anonymisationOption === 'replace' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="replaceFirst">Replace First Name With <span className="text-red-500">*</span></Label>
                <Input
                  id="replaceFirst"
                  placeholder="e.g., J, Jane, Service User"
                  value={replaceFirstNameWith}
                  onChange={(e) => setReplaceFirstNameWith(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replaceLast">Replace Last Name With <span className="text-red-500">*</span></Label>
                <Input
                  id="replaceLast"
                  placeholder="e.g., S, Smith, [Redacted]"
                  value={replaceLastNameWith}
                  onChange={(e) => setReplaceLastNameWith(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Consent Checkbox (shown when "keep" is selected) */}
          {anonymisationOption === 'keep' && (
            <div className="flex items-start space-x-3 pl-6 border-l-2 border-destructive/20">
              <Checkbox
                id="consent"
                checked={consentConfirmed}
                onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                className="mt-1"
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

      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Care Notes Input</CardTitle>
          <CardDescription>
            Paste care notes or upload a file containing multiple notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'editor' | 'file')}>
            <TabsList>
              <TabsTrigger value="editor">Paste Text</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-2">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Paste care notes here. The system will automatically detect and parse individual notes..."
                minHeight="300px"
              />
              <div className="text-sm text-muted-foreground text-right">
                {characterCount.toLocaleString()} / {maxCharacters.toLocaleString()} characters
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
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
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB. Supported formats: PDF (including Nourish exports), Word, CSV, Excel
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Analyse Button */}
      <div className="space-y-2">
        <Button
          onClick={handleAnalyse}
          disabled={isLoading || !hasOpenAiKey}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analysing Care Notes...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Analyse Care Notes
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Analysis typically takes less than an hour depending on the number of notes
        </p>
      </div>

      {/* Results */}
      {analysisResult && (
        <CareNotesResults 
          analysis={analysisResult.analysis} 
          nameMappings={analysisResult.nameMappings}
        />
      )}
    </div>
  );
}
