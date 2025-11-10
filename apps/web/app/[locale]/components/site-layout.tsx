"use client";

import type { Dictionary } from "@packages/i18n";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LOCALE_PREFIX_REGEX } from "@/lib/config";
import { Footer } from "./footer";
import { Header } from "./header";

const shouldHideChrome = (pathname: string) => {
  const normalized = pathname.replace(LOCALE_PREFIX_REGEX, "") || "/";

  return (
    normalized.startsWith("/sign-in") ||
    normalized.startsWith("/sign-up") ||
    normalized.startsWith("/onboarding") ||
    normalized.startsWith("/verify-email") ||
    normalized.startsWith("/org-invite")
  );
};

type SiteLayoutProps = {
  readonly children: ReactNode;
  readonly dictionary: Dictionary;
};

export const SiteLayout = ({ children, dictionary }: SiteLayoutProps) => {
  const pathname = usePathname() ?? "/";
  const hideChrome = shouldHideChrome(pathname);

  return (
    <>
      {!hideChrome && <Header dictionary={dictionary} />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
};
