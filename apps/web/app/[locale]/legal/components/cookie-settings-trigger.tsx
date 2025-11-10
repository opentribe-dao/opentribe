"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@packages/base/components/ui/dialog";
import { Label } from "@packages/base/components/ui/label";
import { Switch } from "@packages/base/components/ui/switch";
import {
  type CookieConsent,
  getCookieConsent,
  updateCookieConsent,
} from "@packages/base/lib/cookie-consent";
import { BarChart3, Settings, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface CookieSettingsTriggerProps {
  /**
   * Custom trigger element. If not provided, a default button will be used.
   */
  children?: React.ReactNode;
  /**
   * Variant for the default button
   */
  variant?: "link" | "default" | "outline" | "ghost";
}

export function CookieSettingsTrigger({
  children,
  variant = "link",
}: CookieSettingsTriggerProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Partial<CookieConsent>>(() => {
    const consent = getCookieConsent();
    return {
      strictlyNecessary: consent?.strictlyNecessary ?? true,
      functional: consent?.functional ?? false,
      analytics: consent?.analytics ?? false,
    };
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Refresh preferences when opening
      const consent = getCookieConsent();
      setPreferences({
        strictlyNecessary: consent?.strictlyNecessary ?? true,
        functional: consent?.functional ?? false,
        analytics: consent?.analytics ?? false,
      });
    }
  };

  const handleSavePreferences = () => {
    updateCookieConsent({
      functional: preferences.functional,
      analytics: preferences.analytics,
    });
    setOpen(false);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-auto p-0" size="sm" variant={variant}>
            Cookie Settings
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie preferences. Strictly necessary cookies cannot be
            disabled.
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
                    disabled as they are required for authentication, security,
                    and core features.
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      <strong>Cookies:</strong> better-auth.session-token,
                      csrf-token, cookie-consent
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
                    htmlFor="functional-cookies-settings"
                  >
                    Functional Cookies
                  </Label>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Remember your preferences like theme (dark/light mode) and
                    language settings.
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      <strong>Cookies:</strong> theme, locale
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
                id="functional-cookies-settings"
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
                    htmlFor="analytics-cookies-settings"
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
                id="analytics-cookies-settings"
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-muted bg-muted/20 p-4">
            <p className="text-muted-foreground text-xs">
              For more information about the cookies we use, see our{" "}
              <Link
                className="text-primary underline hover:text-primary/80"
                href="/legal/cookie-policy"
              >
                Cookie Policy
              </Link>
              .
            </p>
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
  );
}
