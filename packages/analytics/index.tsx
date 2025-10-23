import type { ReactNode } from "react";
import { GoogleAnalytics, GoogleTagManager } from "./google";
import { keys } from "./keys";
import { VercelAnalytics } from "./vercel";

type AnalyticsProviderProps = {
  readonly children: ReactNode;
};

const { NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_GTM_ID } = keys();

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => (
  <>
    {NEXT_PUBLIC_GTM_ID && <GoogleTagManager gtmId={NEXT_PUBLIC_GTM_ID} />}
    {children}
    <VercelAnalytics />
    {NEXT_PUBLIC_GA_MEASUREMENT_ID && (
      <GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    )}
  </>
);
