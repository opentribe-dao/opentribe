import { type Grant, useGrant } from '@/hooks/use-grant';
import type React from 'react';
import { createContext, useContext } from 'react';

interface GrantProviderProps {
  grantId: string;
  children: React.ReactNode;
}

interface GrantContextValue {
  grant: Grant | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

const GrantContext = createContext<GrantContextValue | undefined>(undefined);

export const GrantProvider = ({ grantId, children }: GrantProviderProps) => {
  const { data: grant, isLoading, isError, error, refetch } = useGrant(grantId);

  return (
    <GrantContext.Provider
      value={{ grant, isLoading, isError, error, refetch }}
    >
      {children}
    </GrantContext.Provider>
  );
};

export const useGrantContext = () => {
  const context = useContext(GrantContext);
  if (!context) {
    throw new Error('useGrantContext must be used within a GrantProvider');
  }
  return context;
};
