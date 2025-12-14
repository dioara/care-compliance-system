import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Building2, Upload, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

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
    cqcRating: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        address: profile.address || "",
        telephone: profile.telephone || "",
        email: profile.email || "",
        managerName: profile.managerName || "",
        managerTitle: profile.managerTitle || "",
        serviceType: profile.serviceType || "",
        cqcRating: profile.cqcRating || "",
      });
    }
  });

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
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
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
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
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
    </div>
  );
}
