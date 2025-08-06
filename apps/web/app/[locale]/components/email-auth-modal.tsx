'use client';

import { Button } from '@packages/base/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@packages/base/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@packages/base/components/ui/tabs';
import { useState } from 'react';
import { SignInForm } from './auth-forms/sign-in-form';
import { SignUpForm } from './auth-forms/sign-up-form';

interface EmailAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'sign-in' | 'sign-up';
  redirectTo?: string;
}

export const EmailAuthModal = ({
  open,
  onOpenChange,
  defaultTab = 'sign-up',
  redirectTo,
}: EmailAuthModalProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-zinc-900/95 backdrop-blur-md border-white/10">
        <DialogHeader>
          <DialogTitle className="text-center text-white">
            {activeTab === 'sign-in' ? 'Welcome back' : 'Create your account'}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as 'sign-in' | 'sign-up')
          }
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="sign-in" className="data-[state=active]:bg-white/10">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="sign-up" className="data-[state=active]:bg-white/10">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sign-in" className="mt-6 space-y-4">
            <SignInForm onSuccess={handleSuccess} redirectTo={redirectTo} />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setActiveTab('sign-up')}
                className="px-0 text-muted-foreground text-sm"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sign-up" className="mt-6 space-y-4">
            <SignUpForm onSuccess={handleSuccess} redirectTo={redirectTo} />
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setActiveTab('sign-in')}
                className="px-0 text-muted-foreground text-sm"
              >
                Already have an account? Sign in
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};