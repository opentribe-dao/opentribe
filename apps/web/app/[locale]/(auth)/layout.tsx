import type { ReactNode } from "react";

type AuthLayoutProps = {
  readonly children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container-fluid flex h-dvh items-center justify-center">
    {/* <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
      <div className="absolute inset-0 bg-zinc-900" />
      <div className="relative z-20 flex items-center font-medium text-lg">
        <CommandIcon className="mr-2 h-6 w-6" />
        Acme Inc
      </div>
      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg">
            &ldquo;This library has saved me countless hours of work and helped
            me deliver stunning designs to my clients faster than ever
            before.&rdquo;
          </p>
          <footer className="text-sm">Sofia Davis</footer>
        </blockquote>
      </div>
    </div> */}
    <div className="w-full max-w-[400px] px-4 lg:px-8">{children}</div>
  </div>
);

export default AuthLayout;
