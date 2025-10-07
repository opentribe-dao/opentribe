import { Button } from "@packages/base/components/ui/button";
import { createMetadata } from "@packages/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { OAuthButtons } from "@/app/[locale]/components/oauth-buttons";

const title = "Welcome back";
const description = "Enter your details to sign in.";
const SignIn = dynamic(() =>
  import("@/app/[locale]/(auth)/components/sign-in").then((mod) => mod.SignIn)
);

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = () => (
  <>
    <div className="mb-8 flex flex-col space-y-2 text-center">
      <Link href="/" className="flex items-center justify-center gap-2">
        <span className="bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading text-2xl text-transparent leading-[2] tracking-[0.25em]">
          OPENTRIBE
        </span>
      </Link>
      <h1 className='mt-4 font-semibold text-2xl tracking-tight'>{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>

    <OAuthButtons />

    {/* Divider */}
    <div className="relative p-5 text-center">
      <div className="text-md text-white/50">OR sign In with email</div>
    </div>

    <SignIn />

    {/* Navigation to sign up */}
    <div className="text-center">
      <p className="mt-4 text-muted-foreground text-sm">
        Don't have an account?{" "}
        <Button
          variant="link"
          className="h-auto p-0 font-normal text-sm"
          asChild
        >
          <Link href="/sign-up">Create an account</Link>
        </Button>
      </p>
    </div>
  </>
);

export default SignInPage;
