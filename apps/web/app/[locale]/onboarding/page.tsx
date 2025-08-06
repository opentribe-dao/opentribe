'use client';

import { useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import { Checkbox } from '@packages/base/components/ui/checkbox';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import builderIllustration from '../../../public/images/builder-illustration.png';
import organizationIllustration from '../../../public/images/organization-illustration.png';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [selectedType, setSelectedType] = useState<'builder' | 'organization' | null>('builder');
  const [contributions, setContributions] = useState({
    polkadot: false,
    web3: false,
    crypto: false,
  });

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        // User is not authenticated, redirect to home
        router.push('/');
      } else if (session.user.profileCompleted) {
        // User has already completed profile, redirect to dashboard
        router.push(process.env.NEXT_PUBLIC_DASHBOARD_URL || '/dashboard');
      }
    }
  }, [session, isPending, router]);

  const handleContinue = () => {
    if (!selectedType) return;
    
    if (selectedType === 'builder') {
      router.push('/onboarding/builder');
    } else {
      router.push('/onboarding/organization');
    }
  };

  const handleContributionChange = (type: 'polkadot' | 'web3' | 'crypto') => {
    setContributions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const canContinue = selectedType !== null;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no session, show loading (will redirect)
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-xl font-heading font-bold tracking-[0.25em] bg-gradient-to-r from-white/35 to-white bg-clip-text text-transparent">
            OPENTRIBE
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white text-center mb-8">
          How do you want to continue
        </h1>

        {/* Account Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Builder Option */}
          <button
            onClick={() => setSelectedType('builder')}
            className={`relative rounded-xl border-2 p-6 transition-all ${
              selectedType === 'builder'
                ? 'border-[#E6007A] bg-[#E6007A]/10'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="aspect-square relative mb-4">
              <Image
                src={builderIllustration}
                alt="Builder"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-white font-medium">As Builder</p>
          </button>

          {/* Organization Option */}
          <button
            onClick={() => setSelectedType('organization')}
            className={`relative rounded-xl border-2 p-6 transition-all ${
              selectedType === 'organization'
                ? 'border-[#E6007A] bg-[#E6007A]/10'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="aspect-square relative mb-4">
              <Image
                src={organizationIllustration}
                alt="Organization"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-white font-medium">As Organization</p>
          </button>
        </div>

        {/* Options based on selection */}
        {selectedType && (
          <div className="mb-8">
            {selectedType === 'builder' ? (
              <>
                <p className="text-white/80 text-sm mb-4">
                  Create a profile to start submitting, and get notified on new work opportunities
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={contributions.polkadot}
                      onCheckedChange={() => handleContributionChange('polkadot')}
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">Contribute to top Polkadot projects</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={contributions.web3}
                      onCheckedChange={() => handleContributionChange('web3')}
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">Build your web3 resume</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={contributions.crypto}
                      onCheckedChange={() => handleContributionChange('crypto')}
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">Get paid in crypto</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/80 text-sm mb-4">
                  List a bounty or freelance gig for your project and find your next contributor
                </p>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={true}
                      disabled
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">Get in front of 10,000 weekly contributors</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={true}
                      disabled
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">20+ template to choose from</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={true}
                      disabled
                      className="border-white/40 data-[state=checked]:bg-[#E6007A] data-[state=checked]:border-[#E6007A]"
                    />
                    <span className="text-white/80 text-sm">100% free</span>
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full h-12 bg-[#E6007A] hover:bg-[#E6007A]/90 text-white font-medium disabled:opacity-50"
        >
          Continue as {selectedType === 'builder' ? 'Builder' : selectedType === 'organization' ? 'Organization' : '...'}
        </Button>

        {/* Footer text */}
        <div className="text-center text-white/40 text-xs mt-4">
          {selectedType === 'builder' ? (
            <p>Join 94,500 above</p>
          ) : (
            <p>Logos</p>
          )}
        </div>
      </div>
    </div>
  );
}