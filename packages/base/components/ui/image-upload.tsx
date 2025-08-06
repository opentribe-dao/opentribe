'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Progress } from './progress';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { 
  Upload, 
  X, 
  Loader2, 
  User, 
  Building2,
  Image as ImageIcon 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFileUpload, type UploadType } from '@packages/storage/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  uploadType: UploadType;
  entityId?: string;
  className?: string;
  variant?: 'avatar' | 'logo' | 'banner';
  placeholder?: string;
  disabled?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  onImageChange,
  uploadType,
  entityId,
  className,
  variant = 'avatar',
  placeholder,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { upload, deleteFile, isUploading, uploadProgress, error } = useFileUpload(
    uploadType,
    entityId,
    {
      onSuccess: (result) => {
        setPreviewUrl(result.url);
        onImageChange(result.url);
        toast.success('Image uploaded successfully');
      },
      onError: (error) => {
        console.error('Upload error:', error);
        toast.error(error.message || 'Failed to upload image');
      },
    }
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Create local preview immediately
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // Upload file
      const result = await upload(file);
      
      // Clean up local preview
      URL.revokeObjectURL(localPreviewUrl);
      
      if (!result) {
        // If upload failed, revert to original
        setPreviewUrl(currentImageUrl || null);
      }
    },
    [upload, currentImageUrl]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = async () => {
    if (previewUrl && previewUrl.startsWith('http')) {
      await deleteFile(previewUrl);
    }
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={previewUrl || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600">
          <User className="h-12 w-12 text-white" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="border-white/20 text-white hover:bg-white/10"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {previewUrl ? 'Change Avatar' : 'Upload Avatar'}
        </Button>
        
        {previewUrl && !isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isUploading && (
        <Progress value={uploadProgress} className="w-full max-w-xs" />
      )}
    </div>
  );

  const renderLogo = () => (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Logo" 
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-10 w-10 text-white/40" />
        )}
      </div>
      
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="border-white/20 text-white hover:bg-white/10"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {previewUrl ? 'Change Logo' : 'Upload Logo'}
        </Button>
        
        {previewUrl && !isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}

        {isUploading && (
          <Progress value={uploadProgress} className="w-full" />
        )}
      </div>
    </div>
  );

  const renderBanner = () => (
    <Card
      className={cn(
        "relative overflow-hidden border-white/10 bg-white/5 transition-all",
        isDragging && "border-pink-500 bg-pink-500/10",
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="aspect-[3/1] relative">
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Banner" 
              className="h-full w-full object-cover"
            />
            {!isUploading && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                disabled={disabled}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div 
            className="h-full w-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-12 w-12 text-white/40 mb-2" />
            <p className="text-sm text-white/60">
              {placeholder || 'Click or drag to upload banner'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              Recommended: 1200x400px
            </p>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-white mb-2 mx-auto" />
              <Progress value={uploadProgress} className="w-32" />
            </div>
          </div>
        )}
      </div>

      {previewUrl && !isUploading && (
        <div className="p-4 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Banner
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {variant === 'avatar' && renderAvatar()}
      {variant === 'logo' && renderLogo()}
      {variant === 'banner' && renderBanner()}
    </div>
  );
}