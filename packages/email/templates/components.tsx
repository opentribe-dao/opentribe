import { Button, Hr, Link, Section, Text } from '@react-email/components';

interface EmailButtonProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly variant?: 'primary' | 'secondary';
}

export const EmailButton = ({ href, children, variant = 'primary' }: EmailButtonProps) => {
  const styles = variant === 'primary' 
    ? 'bg-[#E6007A] text-white' 
    : 'bg-white/10 text-white border border-white/20';
    
  return (
    <Section className="text-center my-8">
      <Button
        href={href}
        className={`${styles} rounded-lg px-8 py-4 font-medium no-underline inline-block`}
      >
        {children}
      </Button>
    </Section>
  );
};

interface EmailHeadingProps {
  readonly children: React.ReactNode;
}

export const EmailHeading = ({ children }: EmailHeadingProps) => (
  <Text className="mb-4 text-2xl font-bold text-white">
    {children}
  </Text>
);

interface EmailTextProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const EmailText = ({ children, className = '' }: EmailTextProps) => (
  <Text className={`text-base text-white/80 ${className}`}>
    {children}
  </Text>
);

export const EmailDivider = () => (
  <Hr className="my-6 border-white/10" />
);

interface EmailCardProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const EmailCard = ({ children, className = '' }: EmailCardProps) => (
  <Section className={`rounded-lg bg-white/5 p-6 ${className}`}>
    {children}
  </Section>
);

interface EmailLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
}

export const EmailLink = ({ href, children }: EmailLinkProps) => (
  <Link href={href} className="text-[#E6007A] underline">
    {children}
  </Link>
);

interface EmailListProps {
  readonly items: string[];
}

export const EmailList = ({ items }: EmailListProps) => (
  <Section className="my-4">
    {items.map((item, index) => (
      <Text key={`item-${index}`} className="mb-2 text-white/80">
        • {item}
      </Text>
    ))}
  </Section>
);

interface EmailHighlightProps {
  readonly label: string;
  readonly value: string | number;
}

export const EmailHighlight = ({ label, value }: EmailHighlightProps) => (
  <Section>
    <Text className="text-sm text-white/60">{label}: <span className="font-semibold text-white">{value}</span></Text>
  </Section>
);