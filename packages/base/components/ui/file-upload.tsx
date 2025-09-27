'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFileUpload, type UploadType } from '@packages/storage/client';
import { Upload, X, File, FileText, Archive, Image } from 'lucide-react';
import { cn } from '@packages/base/lib/utils';
import { Button } from './button';
import { toast } from 'sonner';

// Constants for better maintainability
const FILE_TYPE_ICONS = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const,
  PDF: ['pdf'] as const,
  ARCHIVE: ['zip', 'rar', '7z'] as const,
} as const;

const ACCEPTED_FILE_TYPES: Record<string, string> = {
  resource: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  submission: '.pdf,.zip,.jpg,.jpeg,.png,.mp4',
  image: 'image/*',
  'organization-logo': 'image/*',
};

interface FileUploadProps {
  type: UploadType;
  entityId?: string;
  maxFiles?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
  className?: string;
}

export function FileUpload({
  type,
  entityId,
  maxFiles = 5,
  value = [],
  onChange,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<string[]>(value);
  const { upload, isUploading: uploading, uploadProgress: progress, error } = useFileUpload(type, entityId);

  // Sync internal state with external value prop
  useEffect(() => {
    setFiles(value);
  }, [value]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const remainingSlots = maxFiles - files.length;
      const filesToUpload = Array.from(selectedFiles).slice(0, remainingSlots);

      // Process uploads sequentially to avoid race conditions
      const uploadedUrls: string[] = [];
      
      for (const file of filesToUpload) {
        try {
          const result = await upload(file);
          if (result?.url) {
            uploadedUrls.push(result.url);
            toast.success(`${file.name} uploaded successfully`);
          }
        } catch (err) {
          console.error('Failed to upload file:', err);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Update state only once with all uploaded files
      if (uploadedUrls.length > 0) {
        const newFiles = [...files, ...uploadedUrls];
        setFiles(newFiles);
        onChange?.(newFiles);
      }

      // Reset input value to allow re-uploading the same file
      event.target.value = '';
    },
    [files, maxFiles, upload, onChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, onChange]
  );

  // Memoized utility functions for better performance
  const getFileIcon = useCallback((url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (extension && FILE_TYPE_ICONS.IMAGE.includes(extension as any)) {
      return <Image className="h-4 w-4" />;
    }
    if (extension && FILE_TYPE_ICONS.PDF.includes(extension as any)) {
      return <FileText className="h-4 w-4" />;
    }
    if (extension && FILE_TYPE_ICONS.ARCHIVE.includes(extension as any)) {
      return <Archive className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  }, []);

  const getFileName = useCallback((url: string) => {
    return url.split('/').pop() || 'file';
  }, []);

  // Memoized computed values
  const acceptedFileTypes = useMemo(() => {
    return ACCEPTED_FILE_TYPES[type] || ACCEPTED_FILE_TYPES.image;
  }, [type]);

  const remainingSlots = useMemo(() => {
    return maxFiles - files.length;
  }, [maxFiles, files.length]);

  const canUploadMore = useMemo(() => {
    return files.length < maxFiles;
  }, [files.length, maxFiles]);

  return (
    <div className={cn('space-y-4', className)}>
      {canUploadMore && (
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${type}`}
            accept={acceptedFileTypes}
          />
          <label
            htmlFor={`file-upload-${type}`}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-8 cursor-pointer hover:bg-white/10 transition-colors',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Upload className="h-5 w-5 text-white/60" />
            <span className="text-white/60">
              {uploading 
                ? `Uploading... ${progress}%` 
                : `Click to upload files (${files.length}/${maxFiles})`
              }
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-white/60">
            Uploaded files ({files.length}/{maxFiles}):
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file}-${index}`}
                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-3"
              >
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <span className="text-sm text-white/80 truncate max-w-[300px]">
                    {getFileName(file)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 p-0 hover:bg-white/10"
                  aria-label={`Remove ${getFileName(file)}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}