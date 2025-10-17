'use client';

import { use } from 'react';
import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { Textarea } from '@packages/base/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Badge } from '@packages/base/components/ui/badge';
import { ImageUpload } from '@packages/base';
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, X, Upload } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '../../../components/header';
import { env } from '@/env';
import { useGrantEdit } from '@/hooks/grants/use-grant-edit';
import { GrantDetailsForm } from '@/app/(authenticated)/components/grants/grant-detail-form';
import { GrantFundingForm } from '@/app/(authenticated)/components/grants/grant-funding-form';
import { GrantRequirementsForm } from '@/app/(authenticated)/components/grants/grant-requirement-form';
import { GrantPublishForm } from '@/app/(authenticated)/components/grants/grant-publish-form';
import { FormNavigation } from '@/app/(authenticated)/components/grants/grant-form-navigation';

const STEPS = [
  { id: 1, name: 'Details', description: 'Basic information' },
  { id: 2, name: 'Funding', description: 'Budget and amounts' },
  { id: 3, name: 'Requirements', description: 'Application criteria' },
  { id: 4, name: 'Publish', description: 'Review and publish' },
];

const SKILLS = [
  'Rust', 'Substrate', 'Polkadot SDK', 'Smart Contracts', 'ink!',
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Web3.js',
  'UI/UX Design', 'Technical Writing', 'Marketing', 'Community Management',
  'DeFi', 'NFTs', 'Governance', 'Research', 'Data Analysis'
];

const TOKENS = [
  { value: 'DOT', label: 'DOT' },
  { value: 'KSM', label: 'KSM' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

interface GrantFormData {
  // Step 1: Details
  title: string;
  description: string;
  summary: string;
  instructions: string;
  logoUrl: string;
  bannerUrl: string;
  skills: string[];

  // Step 2: Funding
  minAmount: string;
  maxAmount: string;
  totalFunds: string;
  token: string;

  // Step 3: Requirements
  applicationUrl: string;
  resources: Array<{ title: string; url: string; description: string }>;
  screening: Array<{ question: string; type: 'text' | 'url' | 'file'; optional: boolean }>;

  // Step 4: Publish
  visibility: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  source: 'NATIVE' | 'EXTERNAL';
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
}

const EditGrantPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  const router = useRouter();
  const { id } = use(params);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    formData, setFormData,
    loading,
    error,
    submitting,
    handleSubmit,
    addSkill, removeSkill,
    addResource, removeResource, updateResource,
    addScreeningQuestion, removeScreeningQuestion, updateScreeningQuestion,
    setSubmitting
  } = useGrantEdit(id, session, activeOrg, router);

  // Show loading state while checking authentication
  if (sessionLoading || orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  // If user is not authenticated
  if (!session?.user) {
    return null;
  }

  // If still loading organization (shouldn't happen with auto-select, but just in case)
  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title || !formData.description) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 2:
        // Funding is optional for grants
        if (formData.minAmount && formData.maxAmount) {
          const min = parseFloat(formData.minAmount);
          const max = parseFloat(formData.maxAmount);
          if (min > max) {
            toast.error('Minimum amount cannot be greater than maximum amount');
            return false;
          }
        }
        return true;
      case 3:
        // Requirements are optional
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <>
      <Header pages={['Overview', 'Grants']} page="Edit Grant" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                    ? 'bg-[#E6007A] text-white' 
                    : 'bg-white/10 text-white/60'
                }`}>
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-white' : 'text-white/60'
                  }`}>{step.name}</p>
                  <p className="text-xs text-white/40">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-px w-24 mx-4 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="bg-zinc-900/50 border-white/10">
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
             <GrantDetailsForm
             formData={formData}
             setFormData={setFormData}
             addSkill={addSkill}
             removeSkill={removeSkill}
           />
            )}

            {currentStep === 2 && (
              <GrantFundingForm
              formData={formData}
              setFormData={setFormData}
            />
            )}

            {currentStep === 3 && (
               <GrantRequirementsForm
               formData={formData}
               setFormData={setFormData}
               addResource={addResource}
               removeResource={removeResource}
               updateResource={updateResource}
               addScreeningQuestion={addScreeningQuestion}
               removeScreeningQuestion={removeScreeningQuestion}
               updateScreeningQuestion={updateScreeningQuestion}
             />
            )}

            {currentStep === 4 && (
              <GrantPublishForm
              formData={formData}
              setFormData={setFormData}
            />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <FormNavigation
            currentStep={currentStep}
            maxStep={4}
            onBack={currentStep > 1 ? handleBack : () => router.push(`/grants/${id}`)}
            onNext={currentStep < 4 ? handleNext : undefined}
            onSubmit={currentStep === 4 ? () => handleSubmit({ setSubmitting, router, toast }) : undefined}
            submitting={submitting}
          />
      </div>
    </>
  );
};

export default EditGrantPage;