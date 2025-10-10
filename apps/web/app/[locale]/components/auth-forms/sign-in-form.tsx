"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@packages/base/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@packages/base/components/ui/form";
import { Input } from "@packages/base/components/ui/input";
import { authClient } from "@packages/auth/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const SignInForm = ({ onSuccess, redirectTo }: SignInFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);

      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        const errorMessage =
          result.error.message || "Sign in failed. Please try again.";
        toast.error(errorMessage);
        return;
      }

      // Success
      toast.success("Welcome back! You have been signed in successfully.");

      // Call onSuccess callback if provided (for modal close)
      if (onSuccess) {
        onSuccess();
      }

      // Get the current session to check profile completion
      const session = await authClient.getSession();

      // Determine redirect URL based on profile completion
      let redirectUrl = redirectTo;
      if (!redirectUrl) {
        if (session.data?.user?.profileCompleted) {
          redirectUrl = "/";
        } else {
          redirectUrl = "/onboarding";
        }
      }

      router.push(redirectUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-[#E6007A] text-sm hover:underline"
                    tabIndex={-1}
                    onClick={() => {
                      if (onSuccess) {
                        onSuccess();
                      }
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative grid-cols-[1fr_auto] items-center gap-x-2">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="static"
                    />
                    <Button
                      type="button"
                      // variant="outline"
                      // size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="-translate-y-1/2 !absolute !rounded-lg top-1/2 right-0 flex w-1/5 items-center justify-center rounded-l-none bg-transparent hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
