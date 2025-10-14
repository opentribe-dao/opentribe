"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@packages/base/components/ui/dialog";
import { authClient } from "@packages/auth/client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmailAuthModal } from "./email-auth-modal";
import { env } from "@/env";

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  redirectTo?: string;
}

export const AuthModal = ({
  isOpen,
  onClose,
  children,
  redirectTo,
}: AuthModalProps) => {
  const [open, setOpen] = useState(isOpen || false);
  const [loading, setLoading] = useState<"google" | "github" | "email" | null>(
    null
  );
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const router = useRouter();

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(provider);

      await authClient.signIn.social({
        provider,
        callbackURL:
          redirectTo === undefined
            ? `${env.NEXT_PUBLIC_WEB_URL}/`
            : redirectTo,
        newUserCallbackURL: `${env.NEXT_PUBLIC_WEB_URL}/onboarding`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to sign in with ${provider}. Please try again.`;
      toast.error(errorMessage);
      setLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    setOpen(false);
    setShowEmailSignIn(true);
  };

  const handleEmailModalClose = (open: boolean) => {
    setShowEmailSignIn(open);
    if (!open) {
      // Optionally reopen the main modal after closing email modal
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={!onClose ? setOpen : onClose}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="border-white/10 bg-zinc-900/95 backdrop-blur-md sm:max-w-[440px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Sign in to Opentribe</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 text-center">
            {/* Logo */}
            <div className="font-medium text-white/70 text-xs tracking-[0.2em]">
              OPENTRIBE
            </div>

            {/* Title and subtitle */}
            <div className="space-y-2">
              <h2 className="font-semibold text-2xl text-white">
                You are one step away
              </h2>
              <p className="text-sm text-white/60">
                From earning in global standards
              </p>
            </div>

            {/* OAuth buttons */}
            <div className="space-y-3 px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn("google")}
                disabled={loading !== null}
                className="h-12 w-full font-medium text-white"
              >
                {loading === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  // <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  //   <path
                  //     fill="#FFFFFF"
                  //     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  //   />
                  //   <path
                  //     fill="#FFFFFF"
                  //     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  //   />
                  //   <path
                  //     fill="#FFFFFF"
                  //     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  //   />
                  //   <path
                  //     fill="#FFFFFF"
                  //     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  //   />
                  // </svg>
                  // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.714 12.225c0-.984-.08-1.701-.252-2.445H12.234v4.438h6.59c-.133 1.102-.85 2.764-2.445 3.88l-.022.148 3.55 2.75.246.025c2.259-2.086 3.561-5.156 3.561-8.796Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.234 23.918c3.228 0 5.939-1.063 7.919-2.897l-3.774-2.923c-1.01.704-2.365 1.195-4.145 1.195-3.163 0-5.847-2.086-6.804-4.969l-.14.012L1.6 17.193l-.049.134c1.967 3.906 6.006 6.59 10.684 6.59Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.43 14.324a7.362 7.362 0 0 1-.398-2.365c0-.824.146-1.621.385-2.365l-.007-.159-3.737-2.903-.123.059a11.97 11.97 0 0 0-1.275 5.368c0 1.927.465 3.747 1.275 5.368l3.88-3.003Z"
                    />
                    <path
                      fill="#EB4335"
                      d="M12.234 4.624c2.245 0 3.76.97 4.624 1.78l3.375-3.295C18.16 1.183 15.463 0 12.233 0 7.557 0 3.518 2.684 1.55 6.59l3.867 3.004c.97-2.884 3.654-4.97 6.817-4.97Z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn("github")}
                disabled={loading !== null}
                className="h-12 w-full font-medium text-white"
              >
                {loading === "github" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4 "
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#fff"
                      fillRule="evenodd"
                      d="M12 0c6.628 0 12 5.508 12 12.303 0 5.435-3.434 10.046-8.2 11.674-.608.121-.824-.263-.824-.59 0-.406.014-1.73.014-3.377 0-1.147-.384-1.896-.814-2.278 2.672-.305 5.48-1.345 5.48-6.07 0-1.345-.466-2.441-1.236-3.303.125-.31.536-1.562-.118-3.257 0 0-1.005-.33-3.296 1.262A11.275 11.275 0 0 0 12 5.95a11.25 11.25 0 0 0-3.004.414c-2.293-1.591-3.3-1.262-3.3-1.262-.652 1.695-.24 2.946-.117 3.257-.767.862-1.236 1.958-1.236 3.302 0 4.714 2.802 5.77 5.467 6.081-.343.307-.654.85-.762 1.645-.684.314-2.422.858-3.492-1.022 0 0-.635-1.182-1.84-1.268 0 0-1.17-.016-.081.747 0 0 .786.378 1.332 1.8 0 0 .704 2.196 4.043 1.452.006 1.029.016 1.998.016 2.29 0 .326-.22.706-.82.592C3.439 22.352 0 17.74 0 12.303 0 5.508 5.374 0 12 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative px-6">
              <div className="text-white/50 text-xs">OR</div>
            </div>

            {/* Email button */}
            <div className="px-6">
              <Button
                type="button"
                onClick={handleEmailSignIn}
                disabled={loading !== null}
                variant="outline"
                className="h-12 w-full border-white/20 bg-white/5 font-medium text-white hover:bg-white/10"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Continue with Email
              </Button>
            </div>

            {/* Footer text */}
            <div className="px-6 text-white/40 text-xs">
              By using this website, you agree to our{" "}
              <a
                href="/legal/terms-of-service"
                className="underline hover:text-white/60"
              >
                Terms of Use
              </a>{" "}
              and our{" "}
              <a
                href="/legal/privacy-policy"
                className="underline hover:text-white/60"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Auth Modal */}
      <EmailAuthModal
        open={showEmailSignIn}
        onOpenChange={handleEmailModalClose}
        redirectTo={redirectTo}
      />
    </>
  );
};
