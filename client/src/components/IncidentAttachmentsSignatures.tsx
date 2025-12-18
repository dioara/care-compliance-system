import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Paperclip, UploadSimple, Trash, Image, FileText, File, 
  PenNib, CheckCircle, X, DownloadSimple, Eye, Spinner
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface IncidentAttachmentsSignaturesProps {
  incidentId: number;
  incidentStatus: string;
}

export function IncidentAttachments({ incidentId, incidentStatus }: IncidentAttachmentsSignaturesProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: attachments = [], refetch } = trpc.incidents.getAttachments.useQuery({ incidentId });
  
  const uploadMutation = trpc.incidents.uploadAttachment.useMutation({
    onSuccess: () => {
      toast.success("Attachment uploaded successfully");
      setDescription("");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to upload: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });
  
  const deleteMutation = trpc.incidents.deleteAttachment.useMutation({
    onSuccess: () => {
      toast.success("Attachment deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only images, PDFs, and Word documents are allowed");
      return;
    }
    
    setIsUploading(true);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      uploadMutation.mutate({
        incidentId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,
        description: description || undefined,
      });
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" weight="bold" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" weight="bold" />;
    return <File className="h-4 w-4" weight="bold" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const canEdit = incidentStatus !== 'closed';
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Paperclip className="h-4 w-4" weight="bold" />
          Attachments
        </CardTitle>
        <CardDescription>Photos and supporting documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {canEdit && (
          <div className="space-y-3 p-3 border border-dashed rounded-lg bg-muted/30">
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Spinner className="mr-2 h-4 w-4 animate-spin" weight="bold" />
                ) : (
                  <UploadSimple className="mr-2 h-4 w-4" weight="bold" />
                )}
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max 10MB. Supported: Images, PDF, Word documents
            </p>
          </div>
        )}
        
        {/* Attachments List */}
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No attachments yet
          </p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  {attachment.fileType.startsWith('image/') ? (
                    <img
                      src={attachment.fileUrl}
                      alt={attachment.fileName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    getFileIcon(attachment.fileType)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} • {new Date(attachment.createdAt).toLocaleDateString()}
                  </p>
                  {attachment.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {attachment.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(attachment.fileUrl, '_blank')}
                  >
                    {attachment.fileType.startsWith('image/') ? (
                      <Eye className="h-4 w-4" weight="bold" />
                    ) : (
                      <DownloadSimple className="h-4 w-4" weight="bold" />
                    )}
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this attachment?")) {
                          deleteMutation.mutate({ attachmentId: attachment.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-4 w-4" weight="bold" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function IncidentSignatures({ incidentId, incidentStatus }: IncidentAttachmentsSignaturesProps) {
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<"manager" | "reviewer" | "witness">("manager");
  const [notes, setNotes] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const { data: signatures = [], refetch } = trpc.incidents.getSignatures.useQuery({ incidentId });
  
  const addSignatureMutation = trpc.incidents.addSignature.useMutation({
    onSuccess: () => {
      toast.success("Signature added successfully");
      setIsSigningOpen(false);
      setNotes("");
      clearCanvas();
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add signature: ${error.message}`);
    },
  });
  
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = '#1a1a1a';
    context.lineWidth = 2;
    contextRef.current = context;
    
    // Fill with white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };
  
  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };
  
  const handleSubmitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas has any drawing (not just white)
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasDrawing = false;
    
    for (let i = 0; i < data.length; i += 4) {
      // Check if pixel is not white (255, 255, 255)
      if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
        hasDrawing = true;
        break;
      }
    }
    
    if (!hasDrawing) {
      toast.error("Please draw your signature before submitting");
      return;
    }
    
    const signatureData = canvas.toDataURL('image/png');
    
    addSignatureMutation.mutate({
      incidentId,
      signatureType,
      signatureData,
      notes: notes || undefined,
    });
  };
  
  const getSignatureTypeLabel = (type: string) => {
    switch (type) {
      case 'manager': return 'Manager/Supervisor';
      case 'reviewer': return 'Reviewer';
      case 'witness': return 'Witness';
      default: return type;
    }
  };
  
  const getSignatureTypeColor = (type: string) => {
    switch (type) {
      case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'reviewer': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'witness': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const existingTypes = signatures.map((s: any) => s.signatureType);
  const availableTypes = ['manager', 'reviewer', 'witness'].filter(t => !existingTypes.includes(t));
  const canSign = incidentStatus !== 'closed' && availableTypes.length > 0;
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenNib className="h-4 w-4" weight="bold" />
            Digital Signatures
          </CardTitle>
          <CardDescription>Sign off on this incident report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Signature Button */}
          {canSign && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSignatureType(availableTypes[0] as any);
                setIsSigningOpen(true);
                setTimeout(initCanvas, 100);
              }}
            >
              <PenNib className="mr-2 h-4 w-4" weight="bold" />
              Add Signature
            </Button>
          )}
          
          {/* Signatures List */}
          {signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No signatures yet
            </p>
          ) : (
            <div className="space-y-3">
              {signatures.map((signature: any) => (
                <div
                  key={signature.id}
                  className="p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className={getSignatureTypeColor(signature.signatureType)}>
                        {getSignatureTypeLabel(signature.signatureType)}
                      </Badge>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" weight="bold" />
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={signature.signatureData}
                      alt="Signature"
                      className="h-12 border rounded bg-white"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{signature.signedByName}</p>
                      <p className="text-xs text-muted-foreground">
                        {signature.signedByRole && `${signature.signedByRole} • `}
                        {new Date(signature.signedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {signature.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{signature.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Status Summary */}
          <div className="pt-2 border-t">
            <div className="flex gap-2 flex-wrap">
              {['manager', 'reviewer', 'witness'].map((type) => {
                const signed = existingTypes.includes(type);
                return (
                  <Badge
                    key={type}
                    variant="outline"
                    className={signed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'}
                  >
                    {signed ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                    {getSignatureTypeLabel(type)}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Signature Dialog */}
      <Dialog open={isSigningOpen} onOpenChange={setIsSigningOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Add Digital Signature
            </DialogTitle>
            <DialogDescription>
              Draw your signature below to sign off on this incident report.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Signature Type</Label>
              <Select
                value={signatureType}
                onValueChange={(value) => setSignatureType(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getSignatureTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Draw Your Signature</Label>
              <div className="border rounded-lg bg-white relative">
                <canvas
                  ref={canvasRef}
                  className="w-full h-32 cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1"
                  onClick={clearCanvas}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use your mouse or finger to draw your signature
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this sign-off..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsSigningOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSignature}
              disabled={addSignatureMutation.isPending}
            >
              {addSignatureMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" weight="bold" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Submit Signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
