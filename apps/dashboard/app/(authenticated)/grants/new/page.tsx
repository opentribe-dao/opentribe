'use client';

import { useSession, useActiveOrganization } from '@packages/auth/client';
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
import { MarkdownEditor } from '@packages/base';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { ImageUpload, FileUpload } from '@packages/base';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { env } from '@/env';
import SkillsOptions from '@packages/base/components/ui/skills-options';
import { useEffect } from 'react';
import { useGrantForm } from '@/hooks/grants/use-manage-grant';
import { Badge } from '@packages/base/components/ui/badge';
import { getSkillLabel } from '@packages/base/lib/skills';

const STEPS = [
  { id: 1, name: 'Details', description: 'Basic information' },
  { id: 2, name: 'Funding', description: 'Budget and amounts' },
  { id: 3, name: 'Requirements', description: 'Application criteria' },
  { id: 4, name: 'Publish', description: 'Review and publish' },
];

const TOKENS = [
  { value: 'DOT', label: 'DOT' },
  { value: 'KSM', label: 'KSM' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
];

const CreateGrantPage = () => {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();

  const {
    currentStep,
    canGoBack,
    canGoNext,
    submitting,
    formMethods,
    setStep,
    handleBack,
    handleNext,
    handleSubmit,
    addResource,
    removeResource,
    updateResource,
    addScreeningQuestion,
    removeScreeningQuestion,
    updateScreeningQuestion,
    addSkill,
    removeSkill,
  } = useGrantForm({ session, org: activeOrg, router, env });

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push('/sign-in');
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!activeOrg) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  const { watch, control, setValue, getValues } = formMethods;
  const formData = watch();

  const onSubmit = formMethods.handleSubmit((data) => handleSubmit(data));

  return (
    <>
      <Header pages={['Overview', 'Grants']} page="Create Grant" />
      <form className="flex flex-1 flex-col gap-6 p-6" autoComplete="off">
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

        <Card className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="font-heading">
              {STEPS[currentStep - 1].name}
            </CardTitle>
            <CardDescription className="font-sans">
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* --- STEP 1: DETAILS --- */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Grant Title *</Label>
                  <Input
                    {...formMethods.register('title', { required: true })}
                    id="title"
                    placeholder="e.g., Polkadot Ecosystem Development Grant"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    {...formMethods.register('summary')}
                    id="summary"
                    placeholder="A brief summary of your grant program..."
                    rows={3}
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <div className="mt-2">
                    <MarkdownEditor
                      value={formData.description}
                      onChange={(val) => setValue('description', val)}
                      placeholder="Describe your grant program, what you're looking to fund, and the impact you want to create..."
                      height={350}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Application Instructions</Label>
                  <div className="mt-2">
                    <MarkdownEditor
                      value={formData.instructions}
                      onChange={(val) => setValue('instructions', val)}
                      placeholder="Provide detailed instructions on how to apply, what to include, etc..."
                      height={300}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-4 block text-white">Grant Logo</Label>
                  <ImageUpload
                    currentImageUrl={formData.logoUrl}
                    onImageChange={(url) => setValue('logoUrl', url || '')}
                    uploadType="organization-logo"
                    entityId={activeOrg?.id}
                    variant="logo"
                  />
                </div>

                <div>
                  <Label className="mb-4 block text-white">Grant Banner</Label>
                  <ImageUpload
                    currentImageUrl={formData.bannerUrl}
                    onImageChange={(url) => setValue('bannerUrl', url || '')}
                    uploadType="grant-banner"
                    entityId={activeOrg?.id}
                    variant="banner"
                    placeholder="Upload a banner image for your grant (1200x400px recommended)"
                  />
                </div>

                <div>
                  <Label>Skills</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <SkillsOptions
                        value={formData.skills ?? []}
                        onChange={(skills) => addSkill(skills)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 2: FUNDING --- */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-blue-400 text-sm">
                    Funding information is optional. Leave blank if funding
                    amounts are not predetermined.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minAmount">Minimum Amount</Label>
                    <Input
                      {...formMethods.register('minAmount')}
                      id="minAmount"
                      type="number"
                      placeholder="0"
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount</Label>
                    <Input
                      {...formMethods.register('maxAmount')}
                      id="maxAmount"
                      type="number"
                      placeholder="0"
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalFunds">Total Available Funds</Label>
                    <Input
                      {...formMethods.register('totalFunds')}
                      id="totalFunds"
                      type="number"
                      placeholder="0"
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Select
                      value={formData.token}
                      onValueChange={(val) => setValue('token', val)}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-zinc-900">
                        {TOKENS.map((token) => (
                          <SelectItem
                            key={token.value}
                            value={token.value}
                            className="text-white"
                          >
                            {token.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 3: REQUIREMENTS --- */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label>Source</Label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...formMethods.register('source')}
                        value="NATIVE"
                        checked={formData.source === 'NATIVE'}
                        className="text-[#E6007A]"
                      />
                      <span className="font-sans text-white">
                        Native (managed in Opentribe)
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...formMethods.register('source')}
                        value="EXTERNAL"
                        checked={formData.source === 'EXTERNAL'}
                        className="text-[#E6007A]"
                      />
                      <span className="font-sans text-white">
                        External (managed externally)
                      </span>
                    </label>
                  </div>
                </div>
                {formData.source === 'EXTERNAL' && (
                  <div>
                    <Label htmlFor="applicationUrl">
                      External Application URL
                    </Label>
                    <Input
                      {...formMethods.register('applicationUrl')}
                      id="applicationUrl"
                      type="url"
                      placeholder="https://..."
                      className="border-white/10 bg-white/5 text-white"
                    />
                    <p className="mt-1 text-sm text-white/40">
                      If you have an external application form, provide the URL
                      here.
                    </p>
                  </div>
                )}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Resources</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addResource}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Resource
                    </Button>
                  </div>
                  {formData.resources.length > 0 ? (
                    <div className="space-y-3">
                      {formData.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="space-y-3 rounded-lg bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(index, 'title', e.target.value)
                                }
                                placeholder="Resource title"
                                className="border-white/10 bg-white/5 text-white"
                              />
                              <Input
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(index, 'url', e.target.value)
                                }
                                placeholder="https://..."
                                className="border-white/10 bg-white/5 text-white"
                              />
                              <Input
                                value={resource.description}
                                onChange={(e) =>
                                  updateResource(
                                    index,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Brief description (optional)"
                                className="border-white/10 bg-white/5 text-white"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResource(index)}
                              className="ml-2 text-white/60 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">
                      No resources added yet
                    </p>
                  )}
                </div>
                <div>
                  <Label>Resource Files</Label>
                  <p className="mb-3 text-sm text-white/40">
                    Upload PDF documents, images, or other files as resources
                    for applicants
                  </p>
                  <FileUpload
                    type="resource"
                    maxFiles={10}
                    value={formData.resourceFiles}
                    onChange={(urls) => setValue('resourceFiles', urls)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Screening Questions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addScreeningQuestion}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                  {formData.screening.length > 0 ? (
                    <div className="space-y-3">
                      {formData.screening.map((question, index) => (
                        <div
                          key={index}
                          className="space-y-3 rounded-lg bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={question.question}
                                onChange={(e) =>
                                  updateScreeningQuestion(
                                    index,
                                    'question',
                                    e.target.value
                                  )
                                }
                                placeholder="Enter your question"
                                className="border-white/10 bg-white/5 text-white"
                              />
                              <div className="flex items-center gap-3">
                                <Select
                                  value={question.type}
                                  onValueChange={(val) =>
                                    updateScreeningQuestion(
                                      index,
                                      'type',
                                      val as 'text' | 'url' | 'file'
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="border-white/10 bg-zinc-900">
                                    <SelectItem
                                      value="text"
                                      className="text-white"
                                    >
                                      Text
                                    </SelectItem>
                                    <SelectItem
                                      value="url"
                                      className="text-white"
                                    >
                                      URL
                                    </SelectItem>
                                    <SelectItem
                                      value="file"
                                      className="text-white"
                                    >
                                      File
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <label className="flex items-center gap-2 text-sm text-white/60">
                                  <input
                                    type="checkbox"
                                    checked={question.optional}
                                    onChange={(e) =>
                                      updateScreeningQuestion(
                                        index,
                                        'optional',
                                        e.target.checked
                                      )
                                    }
                                    className="rounded border-white/20"
                                  />
                                  Optional
                                </label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScreeningQuestion(index)}
                              className="ml-2 text-white/60 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/40">
                      No screening questions added yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* --- STEP 4: PUBLISH --- */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4 rounded-lg bg-white/5 p-6">
                  <h3 className="font-heading font-medium text-lg text-white">
                    Review Your Grant
                  </h3>
                  <div>
                    <p className="text-sm text-white/60">Title</p>
                    <p className="text-white">{formData.title}</p>
                  </div>
                  {formData.summary && (
                    <div>
                      <p className="text-sm text-white/60">Summary</p>
                      <p className="text-white">{formData.summary}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-white/60">Description</p>
                    <p className="whitespace-pre-wrap text-white">
                      {formData.description}
                    </p>
                  </div>
                  {formData.skills.length > 0 && (
                    <div>
                      <p className="text-sm text-white/60">Skills</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="border-0 bg-white/10 text-white"
                          >
                            {getSkillLabel(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(formData.minAmount ||
                    formData.maxAmount ||
                    formData.totalFunds) && (
                    <div>
                      <p className="text-sm text-white/60">Funding</p>
                      <div className="mt-1 space-y-1">
                        {formData.minAmount && formData.maxAmount && (
                          <p className="text-white">
                            Range: {formData.minAmount} - {formData.maxAmount}{' '}
                            {formData.token}
                          </p>
                        )}
                        {formData.totalFunds && (
                          <p className="text-white">
                            Total Funds: {formData.totalFunds} {formData.token}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Visibility</Label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...formMethods.register('visibility')}
                        value="DRAFT"
                        checked={formData.visibility === 'DRAFT'}
                        className="text-[#E6007A]"
                      />
                      <span className="text-white">Save as Draft</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...formMethods.register('visibility')}
                        value="PUBLISHED"
                        checked={formData.visibility === 'PUBLISHED'}
                        className="text-[#E6007A]"
                      />
                      <span className="text-white">Publish Now</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={canGoBack ? handleBack : () => router.push('/grants')}
            className="border-white/20 text-white hover:bg-white/10"
            type="button"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {canGoBack ? 'Back' : 'Cancel'}
          </Button>
          {canGoNext ? (
            <Button
              onClick={handleNext}
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
              type="button"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled={submitting}
              className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
              type="button"
              onClick={() => onSubmit()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : formData.visibility === 'PUBLISHED' ? (
                'Publish Grant'
              ) : (
                'Save Draft'
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default CreateGrantPage;
