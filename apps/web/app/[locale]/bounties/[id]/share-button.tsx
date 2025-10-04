"use client";

import { Button } from "@packages/base/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  className?: string;
}

export function ShareButton({ url, className }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      // Convert relative URL to absolute URL
      const absoluteUrl = url.startsWith('http') 
        ? url 
        : `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
      
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant="outline"
      // size="icon"
      className={className || "border-white/20 text-white hover:bg-white/10"}
      onClick={handleShare}
    >
      <Share2 className="h-4 w-4" /> Share
    </Button>
  );
}
