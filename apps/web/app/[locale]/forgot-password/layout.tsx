import type { Metadata } from "next";
import type { ReactNode } from "react";

type ForgotPasswordLayoutProps = {
  readonly children: ReactNode;
};

const ForgotPasswordLayout = ({ children }: ForgotPasswordLayoutProps) => (
  <>{children}</>
);

export default ForgotPasswordLayout;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
