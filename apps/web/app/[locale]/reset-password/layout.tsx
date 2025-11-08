import type { Metadata } from "next";
import type { ReactNode } from "react";

type ResetPasswordLayoutProps = {
  readonly children: ReactNode;
};

const ResetPasswordLayout = ({ children }: ResetPasswordLayoutProps) => (
  <>{children}</>
);

export default ResetPasswordLayout;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
