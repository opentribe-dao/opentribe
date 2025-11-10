"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@packages/base/components/ui/dialog";
import { Label } from "@packages/base/components/ui/label";
import { Switch } from "@packages/base/components/ui/switch";
import {
  acceptAllCookies,
  type CookieConsent,
  getCookieConsent,
  hasConsent,
  rejectNonEssentialCookies,
  updateCookieConsent,
} from "@packages/base/lib/cookie-consent";
import { BarChart3, Cookie, Settings, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Partial<CookieConsent>>({
    strictlyNecessary: true,
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    const consentGiven = hasConsent();
    setVisible(!consentGiven);

    if (consentGiven) {
      const consent = getCookieConsent();
      if (consent) {
        setPreferences({
          strictlyNecessary: consent.strictlyNecessary,
          functional: consent.functional,
          analytics: consent.analytics,
        });
      }
    }
  }, []);

  if (!visible) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAllCookies();
    setVisible(false);
  };

  const handleRejectAll = () => {
    rejectNonEssentialCookies();
    setVisible(false);
  };

  const handleCustomize = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = () => {
    updateCookieConsent({
      functional: preferences.functional,
      analytics: preferences.analytics,
    });
    setShowPreferences(false);
    setVisible(false);
  };

  return (
<<<<<<< HEAD
    <dialog
      className="fixed right-0 bottom-0 z-50 m-4 mx-auto max-w-screen-md rounded-xl bg-transparent p-4"
      open
    >
      <Card aria-live="polite">
        <CardContent className="px-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-muted-foreground text-sm">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking "Accept
              All", you consent to our use of cookies. See our {""}
              <Link className="underline" href="/legal/cookie-policy">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex flex-row gap-2 sm:gap-4">
              <Button onClick={() => setConsent("rejected")} variant="outline">
                Reject
              </Button>
              <Button onClick={() => setConsent("accepted")}>Accept All</Button>
=======
    <>
      {/* Cookie Consent Banner */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-screen-lg p-4">
        <Card className="border-primary/20 bg-background/95 py-0 shadow-2xl backdrop-blur-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              {/* Text Content - Left Side */}
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base">
                    Cookie Preferences
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  We use cookies to enhance your experience, analyze site usage,
                  and improve our platform. By clicking "Accept All", you
                  consent to our use of cookies. See our{" "}
                  <Link
                    className="text-primary underline hover:text-primary/80"
                    href="/legal/cookie-policy"
                  >
                    Cookie Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    className="text-primary underline hover:text-primary/80"
                    href="/legal/privacy-policy"
                  >
                    Privacy Policy
                  </Link>{" "}
                  for details.
                </p>
              </div>

              {/* Buttons - Right Side */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  className="order-1 sm:flex-1"
                  onClick={handleRejectAll}
                  size="sm"
                  variant="outline"
                >
                  Reject
                </Button>
                <Button
                  className="order-2 sm:order-3 sm:w-full"
                  onClick={handleCustomize}
                  size="sm"
                  variant="outline"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Cookies
                </Button>
                <Button
                  className="order-3 sm:order-2 sm:flex-1"
                  onClick={handleAcceptAll}
                  size="sm"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cookie Preferences Dialog */}
      <Dialog onOpenChange={setShowPreferences} open={showPreferences}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Customize Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which types of cookies you want to allow. Strictly
              necessary cookies cannot be disabled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Strictly Necessary Cookies */}
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Shield className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <Label className="font-semibold text-base">
                      Strictly Necessary Cookies
                    </Label>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Essential for the platform to function. These cannot be
                      disabled as they are required for authentication,
                      security, and core features.
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <strong>Cookies:</strong> better-auth.session-token,
                        csrf-token, cookie-consent
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Purpose:</strong> User login, security
                        protection, consent preferences
                      </p>
                    </div>
                  </div>
                </div>
                <Switch
                  aria-label="Strictly necessary cookies (always enabled)"
                  checked={true}
                  className="mt-1"
                  disabled={true}
                />
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <Label
                      className="cursor-pointer font-semibold text-base"
                      htmlFor="functional-cookies"
                    >
                      Functional Cookies
                    </Label>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Remember your preferences like theme (dark/light mode) and
                      language settings for a personalized experience.
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <strong>Cookies:</strong> theme, locale
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Purpose:</strong> Remember your display and
                        language preferences
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Duration:</strong> 1 year
                      </p>
                    </div>
                  </div>
                </div>
                <Switch
                  aria-label="Functional cookies toggle"
                  checked={preferences.functional}
                  className="mt-1"
                  id="functional-cookies"
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, functional: checked }))
                  }
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <Label
                      className="cursor-pointer font-semibold text-base"
                      htmlFor="analytics-cookies"
                    >
                      Analytics Cookies
                    </Label>
                    <p className="mt-1 text-muted-foreground text-sm">
                      Help us understand how users interact with our platform so
                      we can improve features and user experience.
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-muted-foreground">
                        <strong>Cookies:</strong> _ga, _gid, _gat (Google
                        Analytics), ph_* (PostHog)
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Purpose:</strong> Track page views, user
                        behavior, feature usage
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Duration:</strong> Up to 2 years
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Third Parties:</strong> Google Analytics (US),
                        PostHog (US)
                      </p>
                    </div>
                  </div>
                </div>
                <Switch
                  aria-label="Analytics cookies toggle"
                  checked={preferences.analytics}
                  className="mt-1"
                  id="analytics-cookies"
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, analytics: checked }))
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-muted bg-muted/20 p-4">
              <p className="text-muted-foreground text-xs">
                <strong>Privacy Notice:</strong> Analytics cookies transfer data
                to the United States. We ensure adequate protection through
                Standard Contractual Clauses. You can opt-out anytime by
                changing your cookie settings in the footer or using browser
                settings. For more information, see our{" "}
                <Link
                  className="text-primary underline hover:text-primary/80"
                  href="/legal/cookie-policy"
                >
                  Cookie Policy
                </Link>
                .
              </p>
>>>>>>> chore/biome-sweep
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={() => {
                setPreferences({
                  strictlyNecessary: true,
                  functional: false,
                  analytics: false,
                });
                handleSavePreferences();
              }}
              variant="outline"
            >
              Reject All
            </Button>
            <Button
              onClick={() => {
                setPreferences({
                  strictlyNecessary: true,
                  functional: true,
                  analytics: true,
                });
                handleSavePreferences();
              }}
              variant="outline"
            >
              Accept All
            </Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
