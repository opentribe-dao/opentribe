import { auth } from "@packages/auth/server";
import { Button } from "@packages/base/components/ui/button";
import { createMetadata } from "@packages/seo/metadata";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthButtons } from "@/app/[locale]/components/oauth-buttons";

const title = "Create an account";
const description = "Enter your details to get started.";
const SignUp = dynamic(() =>
  import("@/app/[locale]/(auth)/components/sign-up").then((mod) => mod.SignUp)
);

export const metadata: Metadata = createMetadata({ title, description });

type SignUpRouteParams = {
  locale: string;
  "sign-up"?: string[];
};

type SignUpSearchParams = {
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

const SignUpPage = async ({
  params,
  searchParams,
}: {
  params: Promise<SignUpRouteParams>;
  searchParams: Promise<SignUpSearchParams>;
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
  const signInHref = appendRedirectQuery(
    `/${locale}/sign-in`,
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

      <SignUp locale={locale} redirectTo={redirectDestination} />

      {/* Divider */}
      <div className="relative p-5 text-center">
        <div className="text-md text-white/50">OR sign up with</div>
      </div>

      <OAuthButtons redirectTo={redirectDestination} />

      {/* Navigation to sign in */}
      <div className="text-center">
        <p className="mt-4 text-muted-foreground text-sm">
          Already have an account?{" "}
          <Button
            asChild
            className="h-auto p-0 font-normal text-sm"
            variant="link"
          >
            <Link href={signInHref}>Sign in</Link>
          </Button>
        </p>
      </div>
    </>
  );
};

export default SignUpPage;
