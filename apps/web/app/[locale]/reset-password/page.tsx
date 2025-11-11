"use client";

import { authClient } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("No reset token provided");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to reset password");
      } else {
        // Success - redirect to sign in with success message
        router.push("/sign-in?message=Password+reset+successfully");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">
              Invalid Reset Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-8">
            <p className="text-center text-white/60">
              This password reset link is invalid or has expired.
            </p>
            <Button
              className="w-full"
              onClick={() => router.push("/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm text-white/60">
              Enter your new password below.
            </p>

            <div className="relative">
              <Input
                disabled={isLoading}
                minLength={8}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                className="-translate-y-1/2 absolute top-1/2 right-3 text-white/60 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                disabled={isLoading}
                minLength={8}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                className="-translate-y-1/2 absolute top-1/2 right-3 text-white/60 hover:text-white"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                type="button"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <Button
              className="w-full"
              onClick={() => router.push("/sign-in")}
              type="button"
              variant="ghost"
            >
              Back to Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
