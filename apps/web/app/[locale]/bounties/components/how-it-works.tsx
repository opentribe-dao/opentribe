"use client";

import { cn } from "@packages/base/lib/utils";
import React from "react";

interface HowItWorksProps {
  className?: string;
}

export function HowItWorksCard({ className = "" }: HowItWorksProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm",
        className
      )}
    >
      <h3 className="mb-4 font-heading font-semibold text-lg">How it works</h3>
      <div className="space-y-4">
        {[
          {
            step: "1",
            title: "Browse and select",
            description: "Find a bounty that matches your skills",
          },
          {
            step: "2",
            title: "Participate / Develop / Submit",
            description: "Work on the bounty and submit your solution",
          },
          {
            step: "3",
            title: "Get paid for your work",
            description: "Receive rewards when your submission is accepted",
          },
        ].map((item) => (
          <div className="flex gap-3" key={item.step}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
              <span className="font-bold text-sm">{item.step}</span>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-sm">{item.title}</h4>
              <p className="text-white/60 text-xs">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(HowItWorksCard);
