import { auth } from "@packages/auth/server";
import { Button } from "@packages/base/components/ui/button";
import { createMetadata } from "@packages/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthButtons } from "@/app/[locale]/components/oauth-buttons";

const title = "Welcome back";
const description = "Enter your details to sign in.";
const SignIn = dynamic(() =>
  import("@/app/[locale]/(auth)/components/sign-in").then((mod) => mod.SignIn)
);

export const metadata: Metadata = createMetadata({ title, description });

type SignInRouteParams = {
  locale: string;
  "sign-in"?: string[];
};

type SignInSearchParams = {
  redirect?: string;
};

const isValidRedirectPath = (value?: string | null) => {
  if (!value) {
    return;
  }

  if (!value.startsWith("/")) {
    return;
  }

  if (value.startsWith("//")) {
    return;
  }

  return value;
};

const appendRedirectQuery = (href: string, redirectPath?: string) => {
  if (!redirectPath) {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}redirect=${encodeURIComponent(redirectPath)}`;
};

const SignInPage = async ({
  params,
  searchParams,
}: {
  params: Promise<SignInRouteParams>;
  searchParams: Promise<SignInSearchParams>;
}) => {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const requestedRedirect = isValidRedirectPath(resolvedSearchParams?.redirect);
  const redirectDestination = requestedRedirect ?? `/${locale}`;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect(redirectDestination);
  }

  const homeHref = `/${locale}`;
  const signUpHref = appendRedirectQuery(
    `/${locale}/sign-up`,
    requestedRedirect
  );

  return (
    <>
      <div className="mb-8 flex flex-col space-y-2 text-center">
        <Link
          className="flex items-center justify-center gap-2"
          href={homeHref}
        >
          <span className="bg-gradient-to-r from-white/35 to-white bg-clip-text font-bold font-heading text-2xl text-transparent leading-[2] tracking-[0.25em]">
            OPENTRIBE
          </span>
        </Link>
        <h1 className="mt-4 font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <SignIn redirectTo={redirectDestination} />

      {/* Divider */}
      <div className="relative p-5 text-center">
        <div className="text-md text-white/50">OR sign In with</div>
      </div>

      <OAuthButtons redirectTo={redirectDestination} />

      {/* Navigation to sign up */}
      <div className="text-center">
        <p className="mt-4 text-muted-foreground text-sm">
          Don't have an account?{" "}
          <Button
            asChild
            className="h-auto p-0 font-normal text-sm"
            variant="link"
          >
            <Link href={signUpHref}>Create an account</Link>
          </Button>
        </p>
      </div>
    </>
  );
};

export default SignInPage;
