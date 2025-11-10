"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { cn } from "@packages/base/lib/utils";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { checkLikes, createLike, removeLike } from "../../lib/api/community";

interface LikeButtonProps {
  applicationId?: string;
  submissionId?: string;
  initialCount: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
  onAuthRequired?: () => void;
}

export function LikeButton({
  applicationId,
  submissionId,
  initialCount,
  size = "md",
  showCount = true,
  className,
  onAuthRequired,
}: LikeButtonProps) {
  const { data: session, isPending } = useSession();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has liked this item
  useEffect(() => {
    if (!(session?.user && (applicationId || submissionId))) return;

    checkLikes({
      applicationIds: applicationId ? [applicationId] : [],
      submissionIds: submissionId ? [submissionId] : [],
    })
      .then((result) => {
        if (applicationId && result.applications[applicationId]) {
          setIsLiked(true);
        } else if (submissionId && result.submissions[submissionId]) {
          setIsLiked(true);
        }
      })
      .catch(console.error);
  }, [session?.user, applicationId, submissionId]);

  const handleLike = async () => {
    if (!session?.user) {
      onAuthRequired?.();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const wasLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (wasLiked) {
        await removeLike({ applicationId, submissionId });
      } else {
        await createLike({ applicationId, submissionId });
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
      toast.error(
        error instanceof Error ? error.message : "Failed to update like"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Button
      className={cn(
        "group relative",
        sizeClasses[size],
        isLiked && "text-pink-500",
        className
      )}
      disabled={isLoading || isPending}
      onClick={handleLike}
      size="sm"
      variant="ghost"
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all",
          isLiked && "fill-current"
        )}
      />
      {showCount && <span className="ml-1.5 font-medium">{likeCount}</span>}
    </Button>
  );
}
