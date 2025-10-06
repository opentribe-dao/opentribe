import { authClient } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { createMetadata } from "@packages/seo/metadata";
import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { env } from "node:process";
import { toast } from "sonner";

const title = "Create an account";
const description = "Enter your details to get started.";
const SignUp = dynamic(() =>
  import("@/app/[locale]/(auth)/components/sign-up").then((mod) => mod.SignUp)
);

const handleOAuthSignUp = async (provider: "google" | "github") => {
  try {
    setOauthLoading(provider);

    await authClient.signIn.social({
      provider,
      callbackURL:
        redirectTo === undefined
          ? `${env.NEXT_PUBLIC_WEB_URL}/onboarding`
          : redirectTo,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : `Failed to sign up with ${provider}. Please try again.`;
    toast.error(errorMessage);
    setOauthLoading(null);
  }
};

export const metadata: Metadata = createMetadata({ title, description });

const SignUpPage = () => (
  <>
    <div className="mb-8 flex flex-col space-y-2 text-center">
      <Link href="/" className="flex items-center justify-center gap-2">
        <span className="bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading text-2xl text-transparent leading-[2] tracking-[0.25em]">
          OPENTRIBE
        </span>
      </Link>
      <h1 className="mt-4 font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>

    {/* </div> */}
    <div className="grid grid-cols-2 justify-center gap-2 space-y-2 align-center">
       {/* TODO: @tarun Make google and github buttons funtional */}
      <Button
        type="button"
        variant="outline"
        // onClick={() => handleOAuthSignUp("google")}
        // disabled={isLoading || oauthLoading !== null}
        className="relative w-full"
      >
        {/* {oauthLoading === "google" ? ( */}
        {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
        {/* ) : ( */}
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <title>Google</title>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {/* )} */}
        Google
      </Button>

      <Button
        type="button"
        variant="outline"
        // onClick={() => handleOAuthSignUp("github")}
        // disabled={isLoading || oauthLoading !== null}
        className="w-full"
      >
        {/* {oauthLoading === "github" ? ( */}
        {/* <Loader2 className="mr-2 h-4 w-4 animate-spin" /> */}
        {/* ) : ( */}
        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <title>GitHub</title>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        {/* )} */}
        GitHub
      </Button>
    </div>

    {/* Divider */}
    <div className="relative p-5 text-center">
      <div className="text-md text-white/50">OR sign up with email</div>
    </div>

    <SignUp />

    {/* Navigation to sign in */}
    <div className="text-center">
      <p className="mt-4 text-muted-foreground text-sm">
        Already have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 font-normal text-sm"
          asChild
        >
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </p>
    </div>
  </>
);

export default SignUpPage;
