'use client';

import { use, useEffect } from 'react';
import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Card, CardContent } from '@packages/base/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '../../../components/header';
import { useGrantEdit } from '@/hooks/grants/use-grant-edit';
import { GrantDetailsForm } from '@/app/(authenticated)/components/grants/grant-detail-form';
import { GrantFundingForm } from '@/app/(authenticated)/components/grants/grant-funding-form';
import { GrantRequirementsForm } from '@/app/(authenticated)/components/grants/grant-requirement-form';
import { GrantPublishForm } from '@/app/(authenticated)/components/grants/grant-publish-form';
import { FormNavigation } from '@/app/(authenticated)/components/grants/grant-form-navigation';
import { useForm, FormProvider } from 'react-hook-form';
import type { GrantFormData } from '@/type';

const STEPS = [
  { id: 1, name: 'Details', description: 'Basic information' },
  { id: 2, name: 'Funding', description: 'Budget and amounts' },
  { id: 3, name: 'Requirements', description: 'Application criteria' },
  { id: 4, name: 'Publish', description: 'Review and publish' },
];
const EditGrantPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  const router = useRouter();
  const { id } = use(params);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    defaultValues,
    loading,
    error,
    submitting,
    setSubmitting,
    handleSubmit,
  } = useGrantEdit(id, activeOrg, router);

  const methods = useForm<GrantFormData>({
    defaultValues,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  // Show loading state while checking authentication
  if (sessionLoading || orgLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 1) {
      const valid = await methods.trigger(['title', 'description']);
      if (!valid) {
        toast.error('Please fill in all required fields');
        return false;
      }
      return true;
    }
    if (step === 2) {
      const min = methods.getValues('minAmount');
      const max = methods.getValues('maxAmount');
      if (min && max && Number.parseFloat(min) > Number.parseFloat(max)) {
        toast.error('Minimum amount cannot be greater than maximum amount');
        return false;
      }
      return true;
    }
    // Requirements are optional, hence the validation is for step 1 and 2.
    return true;
  };

  const handleNext = async () => {
    if (await validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = methods.handleSubmit((data) =>
    handleSubmit(data, { setSubmitting, router, toast })
  );

  return (
    <>
      <Header pages={['Overview', 'Grants']} page="Edit Grant" />
      <FormProvider {...methods}>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                          ? 'bg-[#E6007A] text-white'
                          : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={`font-medium text-sm ${
                        currentStep >= step.id ? 'text-white' : 'text-white/60'
                      }`}
                    >
                      {step.name}
                    </p>
                    <p className="text-white/40 text-xs">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-px w-24 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <Card className="border-white/10 bg-zinc-900/50">
            <CardContent>
              {currentStep === 1 && <GrantDetailsForm />}
              {currentStep === 2 && <GrantFundingForm />}
              {currentStep === 3 && <GrantRequirementsForm />}
              {currentStep === 4 && <GrantPublishForm />}
            </CardContent>
          </Card>

          {/* Navigation */}
          <FormNavigation
            currentStep={currentStep}
            maxStep={4}
            onBack={
              currentStep > 1 ? handleBack : () => router.push(`/grants/${id}`)
            }
            onNext={currentStep < 4 ? handleNext : undefined}
            onSubmit={currentStep === 4 ? onSubmit : undefined}
            submitting={submitting}
          />
        </div>
      </FormProvider>
    </>
  );
};

export default EditGrantPage;
