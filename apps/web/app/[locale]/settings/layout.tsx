import type { Metadata } from "next";
import type { ReactNode } from "react";

type SettingsLayoutProps = {
  readonly children: ReactNode;
};

const SettingsLayout = ({ children }: SettingsLayoutProps) => (
  <>{children}</>
);

export default SettingsLayout;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
