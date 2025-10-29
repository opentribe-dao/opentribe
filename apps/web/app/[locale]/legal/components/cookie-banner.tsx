"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@packages/base/components/ui/button";
import { Card, CardContent } from "@packages/base/components/ui/card";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

  useEffect(() => {
    const hasConsent = document.cookie.includes("cookie_consent=");
    setVisible(!hasConsent);
  }, [pathname]);

  if (!visible) {
    return null;
  }

  const setConsent = (value: "accepted" | "rejected") => {
    const days = 180;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `cookie_consent=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
    setVisible(false);
  };

  return (
    <dialog
      open
      className="fixed right-0 bottom-0 z-50 m-4 mx-auto max-w-screen-md rounded-xl bg-transparent p-4"
    >
      <Card aria-live="polite">
        <CardContent className="px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-muted-foreground text-sm">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking "Accept
              All", you consent to our use of cookies. See our {""}
              <Link
                href={`/${locale}/legal/cookie-policy`}
                className="underline"
              >
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex flex-row gap-2 sm:gap-4">
              <Button variant="outline" onClick={() => setConsent("rejected")}>
                Reject
              </Button>
              <Button onClick={() => setConsent("accepted")}>Accept All</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </dialog>
  );
}
