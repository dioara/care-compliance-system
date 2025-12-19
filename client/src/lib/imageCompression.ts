/**
 * Client-side image compression utility
 * Resizes and compresses images before upload to reduce file size
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  maxSizeKB?: number; // Target max size in KB
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  maxSizeKB: 500,
};

/**
 * Compress an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed base64 string (without data:...;base64, prefix)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ base64: string; mimeType: string; originalSize: number; compressedSize: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          const maxW = opts.maxWidth!;
          const maxH = opts.maxHeight!;
          
          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          // Use white background for transparency (for PNG to JPG conversion)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Determine output format - use JPEG for better compression
          const mimeType = 'image/jpeg';
          let quality = opts.quality!;
          let dataUrl = canvas.toDataURL(mimeType, quality);
          
          // If still too large, reduce quality iteratively
          const maxSizeBytes = (opts.maxSizeKB || 500) * 1024;
          while (dataUrl.length > maxSizeBytes && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL(mimeType, quality);
          }
          
          // Extract base64 without prefix
          const base64 = dataUrl.split(',')[1];
          
          resolve({
            base64,
            mimeType,
            originalSize: file.size,
            compressedSize: Math.round(base64.length * 0.75), // Approximate decoded size
          });
        } catch (error) {
          reject(error);
        }
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
