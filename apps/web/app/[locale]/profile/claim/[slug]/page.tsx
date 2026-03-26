"use client";

import { useSession } from "@packages/auth/client";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { getSkillLabel } from "@packages/base/lib/skills";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Github,
  Loader2,
  Mail,
  MapPin,
  Shield,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import { AuthModal } from "../../../components/auth-modal";

type ClaimMethod = "GITHUB_OAUTH" | "WALLET_SIGNATURE" | "EMAIL_VERIFICATION";

interface EcosystemProfileData {
  id: string;
  slug: string;
  displayName: string;
  bio?: string | null;
  skills?: string[];
  location?: string | null;
  github?: string | null;
  twitter?: string | null;
  email?: string | null;
  walletAddresses?: string[];
  source?: string | null;
  claimStatus?: string;
}

interface ClaimState {
  step: "choose" | "verifying" | "success" | "pending" | "error";
  method?: ClaimMethod;
  claimId?: string;
  challenge?: string;
  maskedEmail?: string;
  message?: string;
  errorMessage?: string;
}

export default function ClaimProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { data: session, isPending: sessionLoading } = useSession();

  const [profile, setProfile] = useState<EcosystemProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimState, setClaimState] = useState<ClaimState>({ step: "choose" });
  const [submitting, setSubmitting] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [existingClaims, setExistingClaims] = useState<any[]>([]);

  // Fetch the ecosystem profile data directly (not via profile resolver,
  // because slug might also match a User username)
  useEffect(() => {
    async function fetchProfile() {
      try {
        // First try the ecosystem profiles API directly by slug
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/ecosystem/profiles?query=${encodeURIComponent(slug)}&pageSize=1`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          const profiles = data.profiles || [];
          const match = profiles.find(
            (p: any) => p.slug === slug || p.slug?.toLowerCase() === slug.toLowerCase()
          );
          if (match) {
            // Fetch full profile details via the resolver
            const detailRes = await fetch(
              `${env.NEXT_PUBLIC_API_URL}/api/v1/profiles/${slug}/public`,
              { credentials: "include" }
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.type === "ecosystem") {
                setProfile(detailData.data);
              } else if (detailData.type === "user" && detailData.data?.claimableProfile) {
                // User exists with same slug — use the claimable profile data
                setProfile({
                  ...detailData.data.claimableProfile,
                  contributions: [],
                });
              }
            }
          }
        }

        // Fallback: try the profile resolver directly
        if (!profile) {
          const fallbackRes = await fetch(
            `${env.NEXT_PUBLIC_API_URL}/api/v1/profiles/${slug}/public`,
            { credentials: "include" }
          );
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data.type === "ecosystem") {
              setProfile(data.data);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [slug, router]);

  // Check existing claim status
  useEffect(() => {
    async function checkClaimStatus() {
      if (!session?.user || !profile?.id) return;
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/ecosystem/profiles/${profile.id}/claim`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setExistingClaims(data.claims || []);
          // If there's a verified claim, show success
          const verified = data.claims?.find(
            (c: any) => c.status === "VERIFIED"
          );
          if (verified) {
            setClaimState({
              step: "success",
              message: "This profile has been claimed and linked to your account.",
            });
          }
          // If there's a pending claim, show pending
          const pending = data.claims?.find(
            (c: any) => c.status === "PENDING"
          );
          if (pending && !verified) {
            setClaimState({
              step: "pending",
              claimId: pending.id,
              method: pending.method,
              message: "Your claim is pending review.",
            });
          }
        }
      } catch (error) {
        console.error("Failed to check claim status:", error);
      }
    }
    checkClaimStatus();
  }, [session, profile]);

  const initiateClaim = useCallback(
    async (method: ClaimMethod) => {
      if (!session?.user) {
        setShowAuthModal(true);
        return;
      }

      if (!profile?.id) return;

      setSubmitting(true);
      setClaimState({ step: "verifying", method });

      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/ecosystem/profiles/${profile.id}/claim`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          if (data.requiresGithubLink) {
            toast.error(
              "Please link your GitHub account first. Go to Settings > Connected Accounts."
            );
            setClaimState({
              step: "error",
              errorMessage:
                "No GitHub account linked. Please link your GitHub account in Settings first.",
            });
          } else {
            toast.error(data.error || "Failed to initiate claim");
            setClaimState({
              step: "error",
              errorMessage: data.error || "Failed to initiate claim",
            });
          }
          return;
        }

        if (data.status === "VERIFIED") {
          setClaimState({
            step: "success",
            claimId: data.claimId,
            message: data.message,
          });
          toast.success("Profile claimed successfully!");
          return;
        }

        if (method === "WALLET_SIGNATURE" && data.challenge) {
          setClaimState({
            step: "verifying",
            method,
            claimId: data.claimId,
            challenge: data.challenge,
            message: data.message,
          });
          // Automatically trigger wallet signing
          await signWithWallet(data.claimId, data.challenge);
          return;
        }

        if (method === "EMAIL_VERIFICATION") {
          setClaimState({
            step: "verifying",
            method,
            claimId: data.claimId,
            maskedEmail: data.maskedEmail,
            message: data.message,
          });
          return;
        }

        // GITHUB_OAUTH pending (username match only)
        if (data.status === "PENDING") {
          setClaimState({
            step: "pending",
            claimId: data.claimId,
            method,
            message: data.message,
          });
        }
      } catch (error) {
        console.error("Claim initiation failed:", error);
        toast.error("Failed to initiate claim. Please try again.");
        setClaimState({
          step: "error",
          errorMessage: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [session, profile]
  );

  const signWithWallet = async (claimId: string, challenge: string) => {
    try {
      // Dynamically import polkadot extension
      const { web3Enable, web3Accounts, web3FromAddress } = await import(
        "@polkadot/extension-dapp"
      );

      // Enable the extension
      const extensions = await web3Enable("Opentribe");
      if (extensions.length === 0) {
        toast.error(
          "No Polkadot wallet extension found. Please install Polkadot.js, Talisman, or SubWallet."
        );
        setClaimState({
          step: "error",
          errorMessage:
            "No Polkadot wallet extension found. Please install a wallet extension.",
        });
        return;
      }

      // Get all accounts
      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        toast.error("No accounts found in your wallet extension.");
        setClaimState({
          step: "error",
          errorMessage:
            "No accounts found in your wallet extension. Please add an account.",
        });
        return;
      }

      // Find a matching account from the profile's wallet addresses
      const profileAddresses = profile?.walletAddresses || [];
      let matchingAccount = null;

      // Try importing polkadot address comparison
      try {
        const { isSameAddress } = await import("@packages/polkadot");
        for (const account of accounts) {
          for (const profileAddr of profileAddresses) {
            if (isSameAddress(account.address, profileAddr)) {
              matchingAccount = account;
              break;
            }
          }
          if (matchingAccount) break;
        }
      } catch {
        // Fallback: let the user sign with any account, server will verify
        matchingAccount = accounts[0];
      }

      if (!matchingAccount) {
        // No exact match found - let user choose (use first account)
        // The server will verify the address against the profile
        toast.info(
          "No matching wallet found. Signing with your first available account."
        );
        matchingAccount = accounts[0];
      }

      // Sign the challenge
      const injector = await web3FromAddress(matchingAccount.address);
      const signRaw = injector.signer?.signRaw;

      if (!signRaw) {
        toast.error("Your wallet does not support message signing.");
        setClaimState({
          step: "error",
          errorMessage: "Wallet does not support message signing.",
        });
        return;
      }

      const { signature } = await signRaw({
        address: matchingAccount.address,
        data: challenge,
        type: "bytes",
      });

      // Submit the verification
      await submitVerification(claimId, {
        signature,
        address: matchingAccount.address,
      });
    } catch (error: any) {
      if (error?.message?.includes("Cancelled") || error?.message?.includes("Rejected")) {
        toast.error("Signing was cancelled.");
        setClaimState({
          step: "choose",
          errorMessage: "Signing was cancelled. You can try again.",
        });
      } else {
        console.error("Wallet signing failed:", error);
        toast.error("Failed to sign with wallet. Please try again.");
        setClaimState({
          step: "error",
          errorMessage: "Wallet signing failed. Please try again.",
        });
      }
    }
  };

  const submitVerification = async (
    claimId: string,
    proof: { signature?: string; address?: string; token?: string; code?: string }
  ) => {
    if (!profile?.id) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/ecosystem/profiles/${profile.id}/claim/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId, ...proof }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Verification failed");
        setClaimState((prev) => ({
          ...prev,
          errorMessage: data.error,
        }));
        return;
      }

      if (data.status === "VERIFIED") {
        setClaimState({
          step: "success",
          message: data.message,
        });
        toast.success("Profile claimed successfully!");
      } else if (data.status === "PENDING") {
        setClaimState({
          step: "pending",
          message: data.message,
        });
        toast.success("Verification submitted. Pending admin review.");
      }
    } catch (error) {
      console.error("Verification submission failed:", error);
      toast.error("Failed to submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailVerify = async () => {
    if (!claimState.claimId || !emailCode) return;
    await submitVerification(claimState.claimId, { code: emailCode });
  };

  // Loading state
  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl text-white">Profile not found</h1>
        <p className="mb-8 text-white/60">
          The profile you are trying to claim does not exist.
        </p>
        <Link href="/builders">
          <Button variant="outline">Browse Builders</Button>
        </Link>
      </div>
    );
  }

  // Already claimed by someone else
  if (profile.claimStatus === "claimed") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl text-white">Profile Already Claimed</h1>
        <p className="mb-8 text-white/60">
          This profile has already been claimed by another user.
        </p>
        <Link href={`/profile/${slug}`}>
          <Button variant="outline">View Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container relative z-10 mx-auto max-w-3xl px-4 py-12">
        {/* Back button */}
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          href={`/profile/${slug}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>

        {/* Profile summary */}
        <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-xl text-white">
                {profile.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-white">
                  {profile.displayName}
                </h2>
                <p className="text-sm text-white/60">@{profile.slug}</p>
                {profile.location && (
                  <div className="mt-1 flex items-center gap-1 text-white/50 text-xs">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </div>
                )}
              </div>
              {profile.source && (
                <Badge className="ml-auto border-0 bg-purple-500/20 text-purple-300">
                  {profile.source}
                </Badge>
              )}
            </div>
            {profile.skills && profile.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.slice(0, 6).map((skill) => (
                  <Badge
                    className="border-0 bg-white/10 text-white/70"
                    key={skill}
                    variant="secondary"
                  >
                    {getSkillLabel(skill)}
                  </Badge>
                ))}
                {profile.skills.length > 6 && (
                  <Badge
                    className="border-0 bg-white/10 text-white/50"
                    variant="secondary"
                  >
                    +{profile.skills.length - 6} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claim Title */}
        <h1 className="mb-2 font-bold text-2xl text-white">
          Claim this profile
        </h1>
        <p className="mb-8 text-white/60">
          Verify your identity to link this ecosystem profile to your Opentribe
          account.
        </p>

        {/* Auth check */}
        {!session?.user && (
          <Card className="mb-8 border-[#E6007A]/30 bg-gradient-to-br from-[#E6007A]/10 to-purple-600/10 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto mb-4 h-10 w-10 text-[#E6007A]" />
              <h2 className="mb-2 font-semibold text-lg text-white">
                Sign in to claim this profile
              </h2>
              <p className="mb-6 text-sm text-white/60">
                You need to be signed in to claim an ecosystem profile. Sign in
                or create an account to get started.
              </p>
              <AuthModal redirectTo={`/profile/claim/${slug}`}>
                <Button className="bg-[#E6007A] text-white hover:bg-[#FF1493]">
                  Sign In to Continue
                </Button>
              </AuthModal>
            </CardContent>
          </Card>
        )}

        {/* Success state */}
        {claimState.step === "success" && (
          <Card className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-2 font-semibold text-xl text-white">
                Profile Claimed!
              </h2>
              <p className="mb-6 text-white/70">{claimState.message}</p>
              <div className="flex justify-center gap-4">
                <Link href={`/profile/${slug}`}>
                  <Button className="bg-[#E6007A] text-white hover:bg-[#FF1493]">
                    View Your Profile
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline">Edit Settings</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending review state */}
        {claimState.step === "pending" && (
          <Card className="border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md">
            <CardContent className="p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-yellow-400" />
              <h2 className="mb-2 font-semibold text-xl text-white">
                Claim Pending Review
              </h2>
              <p className="mb-6 text-white/70">{claimState.message}</p>
              <Link href={`/profile/${slug}`}>
                <Button variant="outline">Back to Profile</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {claimState.step === "error" && (
          <Card className="mb-8 border-red-500/30 bg-red-500/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-medium text-white">Claim Failed</p>
                  <p className="mt-1 text-sm text-white/70">
                    {claimState.errorMessage}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setClaimState({ step: "choose" })}
                    size="sm"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email verification code input */}
        {claimState.step === "verifying" &&
          claimState.method === "EMAIL_VERIFICATION" && (
            <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#E6007A]" />
                  <div className="flex-1">
                    <p className="font-medium text-white">Check your email</p>
                    <p className="mt-1 text-sm text-white/70">
                      We sent a verification code to{" "}
                      <span className="font-mono text-white/90">
                        {claimState.maskedEmail}
                      </span>
                    </p>
                    <div className="mt-4 flex gap-3">
                      <Input
                        className="max-w-[200px] border-white/20 bg-white/5 font-mono text-center text-lg tracking-widest text-white"
                        maxLength={6}
                        onChange={(e) =>
                          setEmailCode(e.target.value.toUpperCase())
                        }
                        placeholder="ABC123"
                        value={emailCode}
                      />
                      <Button
                        className="bg-[#E6007A] text-white hover:bg-[#FF1493]"
                        disabled={emailCode.length < 6 || submitting}
                        onClick={handleEmailVerify}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    <Button
                      className="mt-3"
                      onClick={() => setClaimState({ step: "choose" })}
                      size="sm"
                      variant="ghost"
                    >
                      Use a different method
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Wallet signing in progress */}
        {claimState.step === "verifying" &&
          claimState.method === "WALLET_SIGNATURE" && (
            <Card className="mb-8 border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-6 text-center">
                <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#E6007A]" />
                <p className="font-medium text-white">
                  Waiting for wallet signature...
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Please approve the signing request in your wallet extension.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setClaimState({ step: "choose" })}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}

        {/* Method selection */}
        {claimState.step === "choose" && session?.user && (
          <div className="space-y-4">
            {/* GitHub OAuth */}
            {profile.github && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/8">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-white/10 p-3">
                      <Github className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          Verify with GitHub
                        </h3>
                        <Badge className="border-0 bg-green-500/20 text-green-400">
                          Recommended
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-white/60">
                        We will verify that your linked GitHub account matches
                        the profile's GitHub:{" "}
                        <span className="font-mono text-white/80">
                          {profile.github}
                        </span>
                      </p>
                      <Button
                        className="mt-4 bg-[#E6007A] text-white hover:bg-[#FF1493]"
                        disabled={submitting}
                        onClick={() => initiateClaim("GITHUB_OAUTH")}
                      >
                        {submitting && claimState.method === "GITHUB_OAUTH" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Github className="mr-2 h-4 w-4" />
                        )}
                        Verify with GitHub
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet Signature */}
            {profile.walletAddresses &&
              profile.walletAddresses.length > 0 && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/8">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-white/10 p-3">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          Sign with Polkadot Wallet
                        </h3>
                        <p className="mt-1 text-sm text-white/60">
                          Sign a message with a wallet address associated with
                          this profile to prove ownership.
                        </p>
                        <p className="mt-2 text-white/40 text-xs">
                          Requires Polkadot.js, Talisman, or SubWallet extension
                        </p>
                        <Button
                          className="mt-4"
                          disabled={submitting}
                          onClick={() => initiateClaim("WALLET_SIGNATURE")}
                          variant="outline"
                        >
                          {submitting &&
                          claimState.method === "WALLET_SIGNATURE" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wallet className="mr-2 h-4 w-4" />
                          )}
                          Sign with Wallet
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Email Verification */}
            {profile.email && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/8">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-white/10 p-3">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        Verify via Email
                      </h3>
                      <p className="mt-1 text-sm text-white/60">
                        We will send a verification code to the email address
                        associated with this profile.
                      </p>
                      <p className="mt-2 text-white/40 text-xs">
                        Requires admin approval after verification
                      </p>
                      <Button
                        className="mt-4"
                        disabled={submitting}
                        onClick={() => initiateClaim("EMAIL_VERIFICATION")}
                        variant="outline"
                      >
                        {submitting &&
                        claimState.method === "EMAIL_VERIFICATION" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Verify via Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No methods available */}
            {!profile.github &&
              (!profile.walletAddresses ||
                profile.walletAddresses.length === 0) &&
              !profile.email && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardContent className="p-6 text-center">
                    <Shield className="mx-auto mb-4 h-8 w-8 text-white/40" />
                    <p className="text-white/60">
                      This profile does not have any verifiable identifiers
                      (GitHub, wallet address, or email). Please contact support
                      to claim this profile.
                    </p>
                  </CardContent>
                </Card>
              )}

            {/* Security note */}
            <div className="rounded-lg border border-white/5 bg-white/2 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                <p className="text-white/40 text-xs leading-relaxed">
                  Claiming a profile links your ecosystem contributions to your
                  Opentribe account. This is a one-time action and cannot be
                  undone. Only claim profiles that belong to you.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth modal for non-authenticated users clicking claim methods */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={`/profile/claim/${slug}`}
      />
    </div>
  );
}
