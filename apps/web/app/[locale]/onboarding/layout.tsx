import type { Metadata } from "next";
import type { ReactNode } from "react";

type OnboardingLayoutProps = {
  readonly children: ReactNode;
};

const OnboardingLayout = ({ children }: OnboardingLayoutProps) => (
  <>{children}</>
);

export default OnboardingLayout;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
