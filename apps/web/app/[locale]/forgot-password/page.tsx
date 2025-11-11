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
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.forgetPassword({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send reset email");
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-8">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-[#E6007A]" />
            </div>
            <p className="text-center text-white/80">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-center text-sm text-white/60">
              Please check your email and follow the instructions to reset your
              password.
            </p>
            <Button
              className="w-full"
              onClick={() => router.back()}
              variant="outline"
            >
              Back to Home
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
          <CardTitle className="text-center">Forgot Password?</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <p className="text-sm text-white/60">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <div>
              <Input
                disabled={isLoading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                type="email"
                value={email}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              className="w-full"
              disabled={isLoading || !email}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <Button
              className="w-full"
              onClick={() => router.back()}
              type="button"
              variant="ghost"
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
