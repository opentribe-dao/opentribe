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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { env } from "@/env";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const SignUpForm = ({ onSuccess, redirectTo }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true);

      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        // @TODO: @itsyogesh fix this, after sign up, it redirects to signin instead of verify-email
        callbackURL: redirectTo || `${env.NEXT_PUBLIC_WEB_URL}/verify-email`,
      });

      if (result.error) {
        const errorMessage =
          result.error.message || "Sign up failed. Please try again.";
        toast.error(errorMessage);
        return;
      }

      toast.success("Account created successfully! Welcome to Opentribe.");

      if (onSuccess) {
        onSuccess();
      }

      // New users always go to onboarding
      const redirectUrl =
        redirectTo === undefined
          ? `${env.NEXT_PUBLIC_WEB_URL}/onboarding`
          : redirectTo;
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="name"
                    disabled={isLoading}
                    placeholder="Enter your full name"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative grid-cols-[1fr_auto] items-center gap-x-2">
                    <Input
                      {...field}
                      autoComplete="new-password"
                      className="static"
                      disabled={isLoading}
                      placeholder="Create a secure password"
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
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};
