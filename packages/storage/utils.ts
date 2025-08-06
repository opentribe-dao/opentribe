import { z } from 'zod';

// Upload type definitions
export const UPLOAD_TYPES = [
  'organization-logo',
  'grant-banner',
  'grant-logo',
  'bounty-banner',
  'resource',
  'submission',
  'profile-avatar',
] as const;

export type UploadType = typeof UPLOAD_TYPES[number];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS: Record<UploadType, number> = {
  'organization-logo': 2 * 1024 * 1024, // 2MB
  'grant-banner': 5 * 1024 * 1024, // 5MB
  'grant-logo': 2 * 1024 * 1024, // 2MB
  'bounty-banner': 5 * 1024 * 1024, // 5MB
  'resource': 10 * 1024 * 1024, // 10MB
  'submission': 20 * 1024 * 1024, // 20MB
  'profile-avatar': 2 * 1024 * 1024, // 2MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES: Record<UploadType, string[]> = {
  'organization-logo': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'grant-banner': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'grant-logo': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'bounty-banner': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  'resource': [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
  ],
  'submission': [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'video/mp4',
  ],
  'profile-avatar': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

// Upload metadata schema
export const uploadMetadataSchema = z.object({
  type: z.enum(UPLOAD_TYPES),
  entityId: z.string().optional(),
});

// File validation
export function validateFile(file: File, type: UploadType): { valid: boolean; error?: string } {
  const maxSize = FILE_SIZE_LIMITS[type];
  const allowedTypes = ALLOWED_MIME_TYPES[type];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

// Generate unique filename
export function generateUniqueFileName(originalName: string, type: UploadType): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${type}/${timestamp}-${randomString}.${extension}`;
}

// Get public URL from Blob URL
export function getPublicUrl(blobUrl: string): string {
  // Vercel Blob URLs are already public
  return blobUrl;
}