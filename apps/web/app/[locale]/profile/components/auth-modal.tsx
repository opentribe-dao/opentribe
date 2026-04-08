"use client";

import { Button } from "@packages/base/components/ui/button";
import Link from "next/link";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  redirectTo?: string;
  children?: React.ReactNode;
}

export function AuthModal({ isOpen = true, onClose, redirectTo }: AuthModalProps) {
  if (!isOpen) return null;

  const signInUrl = redirectTo
    ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}`
    : "/sign-in";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-[10px]">
        <h2 className="mb-2 text-xl font-bold text-white">
          Sign in to claim this profile
        </h2>
        <p className="mb-6 text-sm text-white/60">
          You need to be signed in to claim an ecosystem profile. Sign in or
          create an account to get started.
        </p>
        <div className="flex gap-3">
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}
          <Link href={signInUrl} className="flex-1">
            <Button className="w-full bg-[#E6007A] hover:bg-[#E6007A]/90">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
