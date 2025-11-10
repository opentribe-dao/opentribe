"use client";

import { useCallback, useState } from "react";

export type UploadType =
  | "organization-logo"
  | "grant-banner"
  | "bounty-banner"
  | "resource"
  | "submission"
  | "profile-avatar";

interface UploadResult {
  url: string;
  downloadUrl?: string;
  pathname?: string;
  size: number;
  type: string;
}

interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

export function useFileUpload(
  type: UploadType,
  entityId?: string,
  options?: UseFileUploadOptions
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      // Validate file size
      const maxSize = options?.maxSize || getDefaultMaxSize(type);
      if (file.size > maxSize) {
        const error = new Error(
          `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`
        );
        setError(error.message);
        options?.onError?.(error);
        return null;
      }

      // Validate file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const allowedTypes =
        options?.allowedTypes || getDefaultAllowedTypes(type);
      if (!(fileExtension && allowedTypes.includes(fileExtension))) {
        const error = new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        );
        setError(error.message);
        options?.onError?.(error);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify({ type, entityId }));

        // Upload with progress tracking
        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              setUploadProgress(Math.round(percentComplete));
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status === 200) {
              const result = JSON.parse(xhr.responseText);
              setIsUploading(false);
              setUploadProgress(100);
              options?.onSuccess?.(result);
              resolve(result);
            } else {
              const error = new Error("Upload failed");
              setIsUploading(false);
              setError(error.message);
              options?.onError?.(error);
              reject(error);
            }
          });

          xhr.addEventListener("error", () => {
            const error = new Error("Upload failed");
            setIsUploading(false);
            setError(error.message);
            options?.onError?.(error);
            reject(error);
          });

          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          xhr.open("POST", `${apiUrl}/api/v1/upload`);
          xhr.withCredentials = true;
          xhr.send(formData);
        });
      } catch (error) {
        setIsUploading(false);
        const err = error as Error;
        setError(err.message || "Upload failed");
        options?.onError?.(err);
        return null;
      }
    },
    [type, entityId, options]
  );

  const deleteFile = useCallback(async (url: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/upload?url=${encodeURIComponent(url)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return true;
    } catch (error) {
      const err = error as Error;
      setError(err.message || "Delete failed");
      return false;
    }
  }, []);

  return {
    upload,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
  };
}

// Helper functions
function getDefaultMaxSize(type: UploadType): number {
  switch (type) {
    case "organization-logo":
    case "profile-avatar":
      return 2 * 1024 * 1024; // 2MB
    case "grant-banner":
    case "bounty-banner":
      return 5 * 1024 * 1024; // 5MB
    case "resource":
    case "submission":
      return 10 * 1024 * 1024; // 10MB
    default:
      return 5 * 1024 * 1024; // 5MB default
  }
}

function getDefaultAllowedTypes(type: UploadType): string[] {
  switch (type) {
    case "organization-logo":
    case "profile-avatar":
    case "grant-banner":
    case "bounty-banner":
      return ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    case "resource":
    case "submission":
      return [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "pdf",
        "doc",
        "docx",
        "txt",
        "md",
        "zip",
      ];
    default:
      return ["jpg", "jpeg", "png", "gif", "webp"];
  }
}
