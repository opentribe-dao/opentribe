import type { ReactNode } from "react";

type AuthLayoutProps = {
  readonly children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container-fluid flex h-dvh items-center justify-center">
    <div className="w-full max-w-[400px] px-4 lg:px-8">{children}</div>
  </div>
);

export default AuthLayout;
