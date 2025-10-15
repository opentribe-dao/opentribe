'use client';

import { env } from '@/env';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import { Label } from '@packages/base/components/ui/label';
import { Textarea } from '@packages/base/components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface ApplicationDetails {
  id: string;
  title: string;
  content: string;
  budget?: number;
  timeline?: Array<{
    milestone: string;
    date: string;
  }>;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
  answers?: Array<{
    question: string;
    answer: string;
    type: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  grant: {
    id: string;
    slug: string;
    title: string;
    organizationId: string;
    token: string;
    minAmount?: number;
    maxAmount?: number;
  };
  applicant: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export default function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const { id, applicationId } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (id && applicationId) {
      fetchApplicationDetails();
    }
  }, [id, applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}/applications/${applicationId}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setApplication(data.application);
      setFeedback(data.application.feedback || '');
    } catch (error) {
      toast.error('Failed to load application details');
      router.push(`/grants/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    newStatus: 'APPROVED' | 'REJECTED'
  ) => {
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}/applications/${applicationId}/review`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          feedback: feedback || undefined,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update application status');
    }
  };

  const handleStatusUpdate = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!feedback && newStatus === 'REJECTED') {
      toast.error('Please provide feedback when rejecting an application');
      return;
    }

    try {
      setActionLoading(true);
      await updateApplicationStatus(newStatus);
      toast.success(`Application ${newStatus.toLowerCase()} successfully`);
      router.push(`/grants/${id}`);
    } catch (error) {
      toast.error('Failed to update application status');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-blue-500/20 text-blue-400';
      case 'UNDER_REVIEW':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      {/* <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="items-start justify-between md:flex">
              <div className="items-start gap-6 md:flex">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/grants/${id}`)}
                    className="text-white/60 hover:text-white"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Grant
                  </Button>
                  <Badge
                    className={`${getStatusColor(application.status)} border-0`}
                  >
                    {application.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Application Header */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h1 className="mb-2 font-bold text-2xl text-white">
                {application.title}
              </h1>
              <p className="text-white/60">
                Submitted on {formatDate(application.submittedAt)}
              </p>
            </div>

            {/* Application Content */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-4 font-semibold text-white text-xl">
                Application Details
              </h2>
              <div className="prose prose-invert prose-pink max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {application.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Screening Questions */}
            {application.answers && application.answers.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-white text-xl">
                  Screening Questions
                </h2>
                <div className="space-y-4">
                  {application.answers.map((answer, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium text-sm text-white/80">
                        {answer.question}
                      </p>
                      {answer.type === 'url' ? (
                        <a
                          href={answer.answer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#E6007A] hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {answer.answer}
                        </a>
                      ) : (
                        <p className="text-white/60">{answer.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Files */}
            {application.files && application.files.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h2 className="mb-4 font-semibold text-white text-xl">
                  Attached Files
                </h2>
                <div className="space-y-2">
                  {application.files.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <FileText className="h-5 w-5 text-white/60" />
                      <div className="flex-1">
                        <p className="font-medium text-white">{file.name}</p>
                        <p className="text-sm text-white/40">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-white/60" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Review Actions */}
            {application.status === 'SUBMITTED' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h2 className="mb-2 font-semibold text-white text-xl">
                  Review Decision
                </h2>
                <p className="mb-4 text-white/60">
                  Provide feedback and make a decision on this application
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback" className="text-white/80">
                      Feedback (Required for rejection)
                    </Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the applicant..."
                      rows={4}
                      className="mt-2 border-white/10 bg-white/5 text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate('APPROVED')}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Approve Application
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('REJECTED')}
                      disabled={actionLoading || !feedback}
                      variant="destructive"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject Application
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Decision */}
            {(application.status === 'APPROVED' ||
              application.status === 'REJECTED') &&
              application.feedback && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                  <h2 className="mb-2 font-semibold text-white text-xl">
                    Review Decision
                  </h2>
                  <p className="mb-4 text-white/60">
                    Reviewed on{' '}
                    {application.reviewedAt
                      ? formatDate(application.reviewedAt)
                      : 'N/A'}
                  </p>
                  <p className="text-white/80">{application.feedback}</p>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Badge className={`${getStatusColor(application.status)} border-0`}>
              {application.status}
            </Badge>
            {/* Applicant Info */}
            {/* <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-semibold text-lg text-white">
                Applicant
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {application.applicant.image ? (
                    <Image
                      src={application.applicant.image}
                      alt={application.applicant.username}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                      {application.applicant.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {application.applicant.firstName}{' '}
                      {application.applicant.lastName}
                    </p>
                    <p className="text-sm text-white/60">
                      @{application.applicant.username}
                    </p>
                  </div>
                </div>

                {application.applicant.bio && (
                  <div>
                    <p className="mb-1 text-sm text-white/60">Bio</p>
                    <p className="text-sm text-white/80">
                      {application.applicant.bio}
                    </p>
                  </div>
                )}

                {application.applicant.location && (
                  <div className="flex items-center gap-2 text-white/60">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      {application.applicant.location}
                    </span>
                  </div>
                )}

                {application.applicant.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${application.applicant.email}`}
                      className="text-sm hover:text-white"
                    >
                      {application.applicant.email}
                    </a>
                  </div>
                )}

                {application.applicant.skills &&
                  Array.isArray(application.applicant.skills) &&
                  application.applicant.skills.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-white/60">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {application.applicant.skills.map((skill: string) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="border-0 bg-white/10 text-white"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-2 pt-2">
                  {application.applicant.github && (
                    <a
                      href={
                        application.applicant.github.startsWith('http')
                          ? application.applicant.github
                          : `https://github.com/${application.applicant.github}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  )}
                  {application.applicant.linkedin && (
                    <a
                      href={
                        application.applicant.linkedin.startsWith('http')
                          ? application.applicant.linkedin
                          : `https://linkedin.com/in/${application.applicant.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {application.applicant.twitter && (
                    <a
                      href={
                        application.applicant.twitter.startsWith('http')
                          ? application.applicant.twitter
                          : `https://twitter.com/${application.applicant.twitter}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Twitter Profile
                    </a>
                  )}
                  {application.applicant.website && (
                    <a
                      href={
                        application.applicant.website.startsWith('http')
                          ? application.applicant.website
                          : `https://${application.applicant.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div> */}

            {/* Application Metadata */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-semibold text-lg text-white">
                Application Info
              </h3>
              <div className="space-y-3">
                {application.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-white/60" />
                    <div>
                      <p className="text-sm text-white/60">Budget Request</p>
                      <p className="font-medium text-white">
                        {formatAmount(application.budget)}{' '}
                        {application.grant.token}
                      </p>
                    </div>
                  </div>
                )}

                {application.timeline &&
                  Array.isArray(application.timeline) &&
                  application.timeline.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <p className="text-sm text-white/60">Timeline</p>
                      </div>
                      <div className="space-y-1">
                        {application.timeline.map((milestone, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-white">
                              {milestone.milestone}
                            </span>
                            <span className="text-white/60">
                              {milestone.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-white">
                      {formatDate(application.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
