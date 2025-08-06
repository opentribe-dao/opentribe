import type { ReactNode } from 'react';

interface OrgLayoutProps {
  children: ReactNode;
  params: {
    orgId: string;
  };
}

export default function OrgLayout({ children, params }: OrgLayoutProps) {
  return <>{children}</>;
}