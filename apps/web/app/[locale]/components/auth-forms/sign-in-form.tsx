"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@packages/auth/client";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
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
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="email"
                    disabled={isLoading}
                    placeholder="Enter your email"
                    type="email"
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
                    className="text-[#E6007A] text-sm hover:underline"
                    href="/forgot-password"
                    onClick={() => {
                      if (onSuccess) {
                        onSuccess();
                      }
                    }}
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative grid-cols-[1fr_auto] items-center gap-x-2">
                    <Input
                      {...field}
                      autoComplete="current-password"
                      className="static"
                      disabled={isLoading}
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                    />
                    <Button
                      className="-translate-y-1/2 !absolute !rounded-lg top-1/2 right-0 flex w-1/5 items-center justify-center rounded-l-none bg-transparent hover:bg-transparent"
                      // variant="outline"
                      // size="icon"
                      disabled={isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
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

          <Button className="w-full" disabled={isLoading} type="submit">
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
