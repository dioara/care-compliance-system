import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Building2, Upload, Loader2, Key, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CompanyProfile() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = trpc.company.getProfile.useQuery();
  const updateProfile = trpc.company.updateProfile.useMutation();
  const uploadLogo = trpc.company.uploadLogo.useMutation();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    telephone: "",
    email: "",
    managerName: "",
    managerTitle: "",
    serviceType: "",
    careSettingType: "",
    cqcRating: "",
    openaiApiKey: "",
  });

  const [showApiKey, setShowApiKey] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        address: profile.address || "",
        telephone: profile.telephone || "",
        email: profile.email || "",
        managerName: profile.managerName || "",
        managerTitle: profile.managerTitle || "",
        serviceType: profile.serviceType || "",
        careSettingType: profile.careSettingType || "",
        cqcRating: profile.cqcRating || "",
        openaiApiKey: profile.openaiApiKey || "",
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync(formData);
      toast.success("Company profile updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to update company profile");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const fileData = base64.split(',')[1]; // Remove data:image/...;base64, prefix

        await uploadLogo.mutateAsync({
          fileData,
          fileName: file.name,
          mimeType: file.type,
        });

        toast.success("Logo uploaded successfully");
        refetch();
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload logo");
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your company information and branding. This information will appear on all generated reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Logo Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Company Logo</CardTitle>
            <CardDescription>
              Upload your company logo. This will appear on all compliance reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.logoUrl ? (
              <div className="flex flex-col items-center space-y-4">
                <img 
                  src={profile.logoUrl} 
                  alt="Company Logo" 
                  className="max-w-full h-32 object-contain border rounded-lg p-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Change Logo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 md:p-6 lg:p-8 space-y-4">
                <Building2 className="h-12 w-12 text-muted-foreground" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </CardContent>
        </Card>

        {/* Company Information Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details and contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Input
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    placeholder="e.g., Residential Care Home"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careSettingType">Care Setting Type</Label>
                  <Select
                    value={formData.careSettingType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, careSettingType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select care setting type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential Care</SelectItem>
                      <SelectItem value="nursing">Nursing Home</SelectItem>
                      <SelectItem value="domiciliary">Domiciliary Care</SelectItem>
                      <SelectItem value="supported_living">Supported Living</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This helps pre-configure relevant assessment questions for your setting.
                    {formData.careSettingType && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="h-auto p-0 text-xs">
                            View template questions
                          </Button>
                        </DialogTrigger>
                        <TemplatePreviewDialog careSettingType={formData.careSettingType} />
                      </Dialog>
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input
                    id="managerName"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerTitle">Manager Title</Label>
                  <Input
                    id="managerTitle"
                    name="managerTitle"
                    value={formData.managerTitle}
                    onChange={handleInputChange}
                    placeholder="e.g., Registered Manager"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cqcRating">CQC Rating</Label>
                  <Input
                    id="cqcRating"
                    name="cqcRating"
                    value={formData.cqcRating}
                    onChange={handleInputChange}
                    placeholder="e.g., Good, Outstanding"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* OpenAI API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Features Configuration
          </CardTitle>
          <CardDescription>
            Enable AI-powered care plan and daily notes auditing by providing your OpenAI API key.
            Your documents are processed securely and never stored on our servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Why do I need an OpenAI API key?</strong>
              <p className="mt-2">
                AI features like care plan auditing and daily notes analysis use OpenAI's GPT-4 model.
                By using your own API key, you maintain full control over costs and data processing.
                Documents are anonymised before analysis and only the feedback is stored.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openaiApiKey"
                  name="openaiApiKey"
                  type={showApiKey ? "text" : "password"}
                  value={formData.openaiApiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is encrypted and stored securely. It is only used for AI audit features.
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
            <h4 className="font-semibold text-sm">How to get an OpenAI API Key:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Go to <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">platform.openai.com <ExternalLink className="h-3 w-3" /></a> and create an account (or sign in)</li>
              <li>Navigate to <strong>API Keys</strong> in the left sidebar</li>
              <li>Click <strong>"Create new secret key"</strong> and give it a name (e.g., "Care Compliance")</li>
              <li>Copy the key (starts with <code className="bg-muted px-1 rounded">sk-</code>) and paste it above</li>
              <li>Add credit to your OpenAI account (pay-as-you-go billing)</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>Estimated costs:</strong> Analysing a typical care plan costs approximately £0.02-£0.05.
              Monthly usage for a care home typically ranges from £5-£20 depending on volume.
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={async () => {
                try {
                  await updateProfile.mutateAsync(formData);
                  toast.success("API key saved successfully");
                  refetch();
                } catch (error) {
                  toast.error("Failed to save API key");
                }
              }}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Key"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Template Preview Dialog Component
function TemplatePreviewDialog({ careSettingType }: { careSettingType: string }) {
  const { data: template, isLoading } = trpc.compliance.templateByCareSetting.useQuery({ careSettingType: careSettingType as any });
  const { data: templateQuestions } = trpc.compliance.templateQuestionsWithDetails.useQuery(
    { templateId: template?.id || 0 },
    { enabled: !!template?.id }
  );

  const careSettingNames: Record<string, string> = {
    residential: "Residential Care",
    nursing: "Nursing Home",
    domiciliary: "Domiciliary Care",
    supported_living: "Supported Living"
  };

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{careSettingNames[careSettingType]} Assessment Template</DialogTitle>
        <DialogDescription>
          This template includes {templateQuestions?.length || 256} compliance questions tailored for {careSettingNames[careSettingType].toLowerCase()} settings.
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Template Overview</h3>
            <p className="text-sm text-muted-foreground">{template?.description}</p>
            <div className="mt-4 flex gap-2">
              <Badge variant="outline">{templateQuestions?.length || 0} questions</Badge>
              <Badge variant="outline">All sections included</Badge>
            </div>
          </div>

          {templateQuestions && templateQuestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Included Questions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templateQuestions.map((q: any) => (
                  <div key={q.id} className="flex items-start gap-2 text-sm p-2 rounded hover:bg-muted/50">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">
                      {q.questionNumber}
                    </Badge>
                    <span className="text-muted-foreground">{q.questionText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DialogContent>
  );
}
