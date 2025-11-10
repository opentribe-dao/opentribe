"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@packages/base/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import { useState } from "react";
import { SignInForm } from "./auth-forms/sign-in-form";
import { SignUpForm } from "./auth-forms/sign-up-form";

interface EmailAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "sign-in" | "sign-up";
  redirectTo?: string;
}

export const EmailAuthModal = ({
  open,
  onOpenChange,
  defaultTab = "sign-up",
  redirectTo,
}: EmailAuthModalProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-white/10 bg-zinc-900/95 backdrop-blur-md sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-center text-white">
            {activeTab === "sign-in" ? "Welcome back" : "Create your account"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          className="mt-4"
          onValueChange={(value) =>
            setActiveTab(value as "sign-in" | "sign-up")
          }
          value={activeTab}
        >
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger
              className="data-[state=active]:bg-white/50"
              value="sign-in"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/50"
              value="sign-up"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6 space-y-4" value="sign-in">
            <SignInForm onSuccess={handleSuccess} redirectTo={redirectTo} />
            <div className="text-center">
              <Button
                className="px-0 text-muted-foreground text-sm"
                onClick={() => setActiveTab("sign-up")}
                variant="link"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </TabsContent>

          <TabsContent className="mt-6 space-y-4" value="sign-up">
            <SignUpForm onSuccess={handleSuccess} redirectTo={redirectTo} />
            <div className="text-center">
              <Button
                className="px-0 text-muted-foreground text-sm"
                onClick={() => setActiveTab("sign-in")}
                variant="link"
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
