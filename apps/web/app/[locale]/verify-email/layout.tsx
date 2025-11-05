import type { Metadata } from "next";
import type { ReactNode } from "react";

type VerifyEmailLayoutProps = {
  readonly children: ReactNode;
};

const VerifyEmailLayout = ({ children }: VerifyEmailLayoutProps) => (
  <>{children}</>
);

export default VerifyEmailLayout;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
