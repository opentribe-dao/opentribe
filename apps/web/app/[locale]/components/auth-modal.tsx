"use client";

import { authClient } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@packages/base/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { polkadot } from "@zig-zag/chains";
import { env } from "@/env";
import { EmailAuthModal } from "./email-auth-modal";

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
  const [open, setOpen] = useState(isOpen);
  const [loading, setLoading] = useState<
    "google" | "github" | "email" | "wallet" | null
  >(null);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [walletAccounts, setWalletAccounts] = useState<
    Array<{ address: string; name?: string; source?: string }>
  >([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const router = useRouter();

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    try {
      setLoading(provider);

      await authClient.signIn.social({
        provider,
        callbackURL:
          redirectTo === undefined ? `${env.NEXT_PUBLIC_WEB_URL}/` : redirectTo,
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

  const handleWalletSignIn = async (selectedAddress?: string) => {
    try {
      setLoading("wallet");

      const { web3Enable, web3Accounts, web3FromAddress } = await import(
        "@polkadot/extension-dapp"
      );

      const extensions = await web3Enable("Opentribe");
      if (extensions.length === 0) {
        toast.error(
          "No Polkadot wallet found. Install Talisman, Polkadot.js, or SubWallet."
        );
        setLoading(null);
        return;
      }

      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        toast.error("No accounts found in your wallet.");
        setLoading(null);
        return;
      }

      // If multiple accounts and none pre-selected, show picker
      if (accounts.length > 1 && !selectedAddress) {
        setWalletAccounts(
          accounts.map((a) => ({
            address: a.address,
            name: a.meta?.name,
            source: a.meta?.source,
          }))
        );
        setShowAccountPicker(true);
        setLoading(null);
        return;
      }

      const account = selectedAddress
        ? accounts.find((a) => a.address === selectedAddress) || accounts[0]
        : accounts[0];

      setShowAccountPicker(false);

      // 1. Get nonce from Better Auth SIWP endpoint
      const nonceRes = await authClient.siwp.nonce({
        walletAddress: account.address,
      });
      if (nonceRes.error) {
        throw new Error("Failed to get nonce");
      }
      const { nonce } = nonceRes.data;

      // 2. Build SIWS message
      const { SiwsMessage } = await import("@talismn/siws");
      const { polkadot } = await import("@zig-zag/chains");

      const siwsMessage = new SiwsMessage({
        domain: window.location.host,
        address: account.address,
        statement: "Sign in to Opentribe with your Polkadot wallet",
        uri: window.location.origin,
        version: "1.0.0",
        chainId: `${polkadot.network}:${polkadot.genesisHash.slice(2, 34)}`,
        nonce,
        issuedAt: Date.now(),
        expirationTime: Date.now() + 24 * 60 * 60 * 1000,
      });
      const message = siwsMessage.prepareMessage();

      // 3. Sign with wallet
      const injector = await web3FromAddress(account.address);
      const signRaw = injector.signer?.signRaw;
      if (!signRaw) {
        throw new Error("Wallet does not support message signing");
      }

      const { signature } = await signRaw({
        address: account.address,
        data: message,
        type: "bytes",
      });

      // 4. Verify with Better Auth SIWP endpoint → creates session
      const verifyRes = await authClient.siwp.verify({
        message,
        signature,
        walletAddress: account.address,
      });

      if (verifyRes.error) {
        throw new Error(
          verifyRes.error.message || "Wallet authentication failed"
        );
      }

      toast.success("Signed in with wallet!");
      setOpen(false);

      // Redirect
      const target = redirectTo || "/";
      router.push(target);
      router.refresh();
    } catch (error: any) {
      if (
        error?.message?.includes("Cancelled") ||
        error?.message?.includes("Rejected")
      ) {
        toast.error("Signing cancelled.");
      } else {
        toast.error(
          error?.message || "Failed to sign in with wallet. Please try again."
        );
      }
      setLoading(null);
    }
  };

  const handleEmailSignIn = () => {
    setOpen(false);
    setShowEmailSignIn(true);
  };

  const handleEmailModalClose = (open: boolean) => {
    setShowEmailSignIn(open);
  };

  return (
    <>
      <Dialog onOpenChange={onClose ? onClose : setOpen} open={open}>
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

            {/* Sign-in buttons */}
            <div className="space-y-3 px-6">
              <Button
                className="h-12 w-full font-medium text-white"
                disabled={loading !== null}
                onClick={() => handleOAuthSignIn("google")}
                type="button"
                variant="outline"
              >
                {loading === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M23.714 12.225c0-.984-.08-1.701-.252-2.445H12.234v4.438h6.59c-.133 1.102-.85 2.764-2.445 3.88l-.022.148 3.55 2.75.246.025c2.259-2.086 3.561-5.156 3.561-8.796Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12.234 23.918c3.228 0 5.939-1.063 7.919-2.897l-3.774-2.923c-1.01.704-2.365 1.195-4.145 1.195-3.163 0-5.847-2.086-6.804-4.969l-.14.012L1.6 17.193l-.049.134c1.967 3.906 6.006 6.59 10.684 6.59Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.43 14.324a7.362 7.362 0 0 1-.398-2.365c0-.824.146-1.621.385-2.365l-.007-.159-3.737-2.903-.123.059a11.97 11.97 0 0 0-1.275 5.368c0 1.927.465 3.747 1.275 5.368l3.88-3.003Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.234 4.624c2.245 0 3.76.97 4.624 1.78l3.375-3.295C18.16 1.183 15.463 0 12.233 0 7.557 0 3.518 2.684 1.55 6.59l3.867 3.004c.97-2.884 3.654-4.97 6.817-4.97Z"
                      fill="#EB4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                className="h-12 w-full font-medium text-white"
                disabled={loading !== null}
                onClick={() => handleOAuthSignIn("github")}
                type="button"
                variant="outline"
              >
                {loading === "github" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      clipRule="evenodd"
                      d="M12 0c6.628 0 12 5.508 12 12.303 0 5.435-3.434 10.046-8.2 11.674-.608.121-.824-.263-.824-.59 0-.406.014-1.73.014-3.377 0-1.147-.384-1.896-.814-2.278 2.672-.305 5.48-1.345 5.48-6.07 0-1.345-.466-2.441-1.236-3.303.125-.31.536-1.562-.118-3.257 0 0-1.005-.33-3.296 1.262A11.275 11.275 0 0 0 12 5.95a11.25 11.25 0 0 0-3.004.414c-2.293-1.591-3.3-1.262-3.3-1.262-.652 1.695-.24 2.946-.117 3.257-.767.862-1.236 1.958-1.236 3.302 0 4.714 2.802 5.77 5.467 6.081-.343.307-.654.85-.762 1.645-.684.314-2.422.858-3.492-1.022 0 0-.635-1.182-1.84-1.268 0 0-1.17-.016-.081.747 0 0 .786.378 1.332 1.8 0 0 .704 2.196 4.043 1.452.006 1.029.016 1.998.016 2.29 0 .326-.22.706-.82.592C3.439 22.352 0 17.74 0 12.303 0 5.508 5.374 0 12 0Z"
                      fill="#fff"
                      fillRule="evenodd"
                    />
                  </svg>
                )}
                Continue with GitHub
              </Button>

              {/* Polkadot Wallet — account picker or button */}
              {showAccountPicker && walletAccounts.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-left text-sm text-white/60">
                    Select an account:
                  </p>
                  {walletAccounts.map((acc) => (
                    <Button
                      key={acc.address}
                      className="h-auto w-full justify-start border-white/20 bg-white/5 py-3 text-left font-mono text-white hover:bg-white/10"
                      disabled={loading === "wallet"}
                      onClick={() => handleWalletSignIn(acc.address)}
                      type="button"
                      variant="outline"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-sans text-sm font-medium">
                          {acc.name || "Account"}
                          {acc.source && (
                            <span className="ml-2 text-xs text-white/40">
                              ({acc.source})
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-white/50">
                          {acc.address.slice(0, 10)}...{acc.address.slice(-6)}
                        </span>
                      </div>
                    </Button>
                  ))}
                  <Button
                    className="w-full text-white/50"
                    onClick={() => {
                      setShowAccountPicker(false);
                      setWalletAccounts([]);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  className="h-12 w-full font-medium text-white"
                  disabled={loading !== null}
                  onClick={() => handleWalletSignIn()}
                  type="button"
                  variant="outline"
                >
                  {loading === "wallet" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <img
                      src={polkadot.chainIconUrl}
                      alt="Polkadot"
                      className="mr-2 h-4 w-4"
                    />
                  )}
                  Continue with Polkadot
                </Button>
              )}
            </div>

            {/* Divider */}
            <div className="relative px-6">
              <div className="text-white/50 text-xs">OR</div>
            </div>

            {/* Email button */}
            <div className="px-6">
              <Button
                className="h-12 w-full border-white/20 bg-white/5 font-medium text-white hover:bg-white/10"
                disabled={loading !== null}
                onClick={handleEmailSignIn}
                type="button"
                variant="outline"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                Continue with Email
              </Button>
            </div>

            {/* Footer text */}
            <div className="px-6 text-white/40 text-xs">
              By using this website, you agree to our{" "}
              <a
                className="underline hover:text-white/60"
                href="/legal/terms-of-service"
              >
                Terms of Use
              </a>{" "}
              and our{" "}
              <a
                className="underline hover:text-white/60"
                href="/legal/privacy-policy"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Auth Modal */}
      <EmailAuthModal
        onOpenChange={handleEmailModalClose}
        open={showEmailSignIn}
        redirectTo={redirectTo}
      />
    </>
  );
};
