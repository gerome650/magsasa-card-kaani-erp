import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  onUpload: (file: File) => Promise<string>;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  onUpload,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return `${file.name}: Invalid file type. Please upload JPG, PNG, or WebP images.`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`;
    }

    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const newErrors: string[] = [];

      // Check if adding these files would exceed max images
      if (value.length + fileArray.length > maxImages) {
        newErrors.push(`Maximum ${maxImages} images allowed. You can upload ${maxImages - value.length} more.`);
        setErrors(newErrors);
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          newErrors.push(error);
        } else {
          validFiles.push(file);
        }
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
      }

      if (validFiles.length === 0) return;

      // Upload valid files
      const uploadPromises = validFiles.map(async (file) => {
        const uploadId = `${file.name}-${Date.now()}`;
        setUploading((prev) => [...prev, uploadId]);

        try {
          const url = await onUpload(file);
          setUploading((prev) => prev.filter((id) => id !== uploadId));
          return url;
        } catch (error) {
          setUploading((prev) => prev.filter((id) => id !== uploadId));
          newErrors.push(`${file.name}: Upload failed. ${error instanceof Error ? error.message : 'Unknown error'}`);
          setErrors(newErrors);
          return null;
        }
      });

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(
        (url): url is string => url !== null
      );

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
    },
    [value, onChange, maxImages, maxSizeMB, onUpload]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setErrors([]);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors([]);
    handleFiles(e.target.files);
    // Reset input so same file can be uploaded again
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const canUploadMore = value.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {canUploadMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isDragging ? "Drop images here" : "Drag & drop images here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WebP • Max {maxSizeMB}MB • Up to {maxImages} images
            </p>
            <p className="text-xs text-muted-foreground">
              {value.length} / {maxImages} uploaded
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm font-medium text-destructive mb-1">Upload Errors:</p>
          <ul className="text-xs text-destructive/90 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploading Progress */}
      {uploading.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading {uploading.length} image{uploading.length !== 1 ? 's' : ''}...</span>
        </div>
      )}

      {/* Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border group"
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(index)}
                  className="gap-1"
                >
                  <X className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && uploading.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No photos uploaded yet</p>
        </div>
      )}
    </div>
  );
}
