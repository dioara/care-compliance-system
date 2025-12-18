import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UploadSimple, X, FileText, Image as ImageIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

interface EvidenceUploadProps {
  auditInstanceId: number;
  questionId?: number;
  onUploadComplete?: () => void;
}

export function EvidenceUpload({ auditInstanceId, questionId, onUploadComplete }: EvidenceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadEvidenceMutation = trpc.audits.uploadEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence uploaded successfully");
      setSelectedFile(null);
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        uploadEvidenceMutation.mutate({
          auditInstanceId,
          questionId,
          fileName: selectedFile.name,
          fileData: base64,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to read file");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" weight="bold" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" weight="bold" />;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Upload Evidence</Label>
        <div className="flex gap-2">
          <Input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            <UploadSimple className="h-4 w-4 mr-2" weight="bold" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Supported formats: Images, PDF, Word, Excel (max 10MB)
        </p>
      </div>

      {selectedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedFile)}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <X className="h-4 w-4" weight="bold" />
                </Button>
              )}
            </div>
            {uploading && (
              <div className="mt-3">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">{uploadProgress}% uploaded</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
