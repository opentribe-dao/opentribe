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
import { Badge } from '@packages/base/components/ui/badge';
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
import { toast } from 'sonner';
import { Header } from '../../components/header';
import { env } from '@/env';
import SkillsOptions from '@packages/base/components/ui/skills-options';
import { getSkillLabel } from '@packages/base/lib/skills';
import { useEffect } from 'react';
import { useGrantForm } from '@/hooks/grants/use-manage-grant';
import { on } from 'events';

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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
                    className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-white' : 'text-white/60'
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-white/40">{step.description}</p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-px w-24 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/20'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-white/10 backdrop-blur-[10px] border border-white/20 rounded-lg">
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
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    {...formMethods.register('summary')}
                    id="summary"
                    placeholder="A brief summary of your grant program..."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white"
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
                  <Label className="text-white mb-4 block">Grant Logo</Label>
                  <ImageUpload
                    currentImageUrl={formData.logoUrl}
                    onImageChange={(url) => setValue('logoUrl', url || '')}
                    uploadType="organization-logo"
                    entityId={activeOrg?.id}
                    variant="logo"
                  />
                </div>

                <div>
                  <Label className="text-white mb-4 block">Grant Banner</Label>
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
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-400">
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
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount</Label>
                    <Input
                      {...formMethods.register('maxAmount')}
                      id="maxAmount"
                      type="number"
                      placeholder="0"
                      className="bg-white/5 border-white/10 text-white"
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
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token">Token</Label>
                    <Select
                      value={formData.token}
                      onValueChange={(val) => setValue('token', val)}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
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
                  <Label htmlFor="applicationUrl">
                    External Application URL
                  </Label>
                  <Input
                    {...formMethods.register('applicationUrl')}
                    id="applicationUrl"
                    type="url"
                    placeholder="https://..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-sm text-white/40 mt-1">
                    If you have an external application form, provide the URL
                    here.
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Resources</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addResource}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Resource
                    </Button>
                  </div>
                  {formData.resources.length > 0 ? (
                    <div className="space-y-3">
                      {formData.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={resource.title}
                                onChange={(e) =>
                                  updateResource(index, 'title', e.target.value)
                                }
                                placeholder="Resource title"
                                className="bg-white/5 border-white/10 text-white"
                              />
                              <Input
                                value={resource.url}
                                onChange={(e) =>
                                  updateResource(index, 'url', e.target.value)
                                }
                                placeholder="https://..."
                                className="bg-white/5 border-white/10 text-white"
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
                                className="bg-white/5 border-white/10 text-white"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResource(index)}
                              className="text-white/60 hover:text-white ml-2"
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
                  <p className="text-sm text-white/40 mb-3">
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
                  <div className="flex items-center justify-between mb-3">
                    <Label>Screening Questions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addScreeningQuestion}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                  {formData.screening.length > 0 ? (
                    <div className="space-y-3">
                      {formData.screening.map((question, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-4 space-y-3"
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
                                className="bg-white/5 border-white/10 text-white"
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
                                  <SelectTrigger className="bg-white/5 border-white/10 text-white w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 border-white/10">
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
                              className="text-white/60 hover:text-white ml-2"
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
                {/* <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <h3 className="text-lg font-medium text-white font-heading">
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
                    <p className="text-white whitespace-pre-wrap">
                      {formData.description}
                    </p>
                  </div>
                  {(formData.skills.length > 0) && (
                    <div>
                      <p className="text-sm text-white/60">Skills</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.skills.map(skill => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="bg-white/10 text-white border-0"
                          >
                            {getSkillLabel(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(formData.minAmount || formData.maxAmount ||
                    formData.totalFunds) && (
                    <div>
                      <p className="text-sm text-white/60">Funding</p>
                      <div className="space-y-1 mt-1">
                        {(formData.minAmount && formData.maxAmount) && (
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
                  <Label>Grant Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        {...formMethods.register('source')}
                        value="NATIVE"
                        checked={formData.source === 'NATIVE'}
                        className="text-[#E6007A]"
                      />
                      <span className="text-white font-sans">
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
                      <span className="text-white font-sans">
                        External (managed externally)
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <div className="flex gap-4 mt-2">
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
                </div> */}
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
            <ChevronLeft className="h-4 w-4 mr-2" />
            {canGoBack ? 'Back' : 'Cancel'}
          </Button>
          {canGoNext ? (
            <Button
              onClick={handleNext}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
