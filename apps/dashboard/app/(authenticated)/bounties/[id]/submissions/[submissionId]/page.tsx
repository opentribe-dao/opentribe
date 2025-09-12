'use client';

import { use } from 'react';
import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Textarea } from '@packages/base/components/ui/textarea';
import { Label } from '@packages/base/components/ui/label';
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
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Header } from '../../../../components/header';
import { env } from '@/env';

interface SubmissionDetails {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
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
  bounty: {
    id: string;
    title: string;
    organizationId: string;
    winnerCount: number;
    totalAmount: number;
    token: string;
    winnings: Array<{
      position: number;
      amount: number;
    }>;
    submissions: Array<{
      id: string;
      status: string;
    }>;
  };
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export default function SubmissionReviewPage({ params }: { params: Promise<{ id: string; submissionId: string }> }) {
  const { id, submissionId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  useEffect(() => {
    if (id && submissionId) {
      fetchSubmissionDetails();
    }
  }, [id, submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/submissions/${submissionId}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch submission details');
      }

      const data = await response.json();
      
      // Check if user has access to review this submission
      if (data.submission.bounty.organizationId !== activeOrg?.id) {
        toast.error('You do not have access to review this submission');
        router.push('/bounties');
        return;
      }

      setSubmission(data.submission);
      setFeedback(data.submission.feedback || '');
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load submission details');
      router.push(`/bounties/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'SELECTED' | 'REJECTED') => {
    if (!feedback && newStatus === 'REJECTED') {
      toast.error('Please provide feedback when rejecting a submission');
      return;
    }

    if (newStatus === 'SELECTED' && selectedPosition === null) {
      toast.error('Please select a winner position');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/submissions/${submissionId}/review`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            feedback: feedback || undefined,
            position: newStatus === 'SELECTED' ? selectedPosition : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update submission status');
      }

      toast.success(`Submission ${newStatus.toLowerCase()} successfully`);
      router.push(`/bounties/${id}`);
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission status');
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
      case 'SELECTED':
        return 'bg-green-500/20 text-green-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const getAvailablePositions = () => {
    if (!submission) return [];
    
    // Get positions that are already taken
    const takenPositions = submission.bounty.submissions
      .filter(s => s.status === 'SELECTED' && s.id !== submission.id)
      .length;
    
    // Create array of available positions
    const positions = [];
    for (let i = 1; i <= submission.bounty.winnerCount; i++) {
      const prize = submission.bounty.winnings.find(w => w.position === i);
      if (prize) {
        positions.push({
          position: i,
          amount: prize.amount,
          available: takenPositions < i,
        });
      }
    }
    
    return positions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  const availablePositions = getAvailablePositions();

  return (
    <>
      {/* <Header 
        pages={['Bounties', submission.bounty.title, 'Submissions', submission.title || 'Submission']} 
        page="Review Submission" 
      /> */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/bounties/${id}/submissions`)}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bounty
          </Button>
          <Badge className={`${getStatusColor(submission.status)} border-0`}>
            {submission.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Header */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  {submission.title || 'Untitled Submission'}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Submitted on {formatDate(submission.submittedAt)}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Submission Content */}
            {submission.description && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-pink max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {submission.description}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Submission Link */}
            {submission.submissionUrl && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Submission Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={submission.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#E6007A] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {submission.submissionUrl}
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Screening Questions */}
            {submission.answers && submission.answers.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Screening Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.answers.map((answer, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm font-medium text-white/80">{answer.question}</p>
                      {answer.type === 'url' ? (
                        <a
                          href={answer.answer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E6007A] hover:underline flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {answer.answer}
                        </a>
                      ) : (
                        <p className="text-white/60">{answer.answer}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Attached Files */}
            {submission.files && submission.files.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Attached Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submission.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-white/60" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-sm text-white/40">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-white/60" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Actions */}
            {submission.status === 'SUBMITTED' && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Review Decision</CardTitle>
                  <CardDescription className="text-white/60">
                    Select this submission as a winner or provide feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Winner Position Selection */}
                  <div>
                    <Label>Winner Position</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {availablePositions.map((pos) => (
                        <button
                          key={pos.position}
                          onClick={() => pos.available && setSelectedPosition(pos.position)}
                          disabled={!pos.available}
                          className={`p-4 rounded-lg border transition-all ${
                            selectedPosition === pos.position
                              ? 'bg-[#E6007A]/20 border-[#E6007A] text-white'
                              : pos.available
                              ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                              : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Position #{pos.position}</span>
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div className="mt-1 text-sm">
                            {formatAmount(pos.amount)} {submission.bounty.token}
                          </div>
                          {!pos.available && (
                            <div className="mt-1 text-xs text-white/40">Already taken</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="feedback">Feedback (Required for rejection)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the submitter..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-white mt-2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate('SELECTED')}
                      disabled={actionLoading || selectedPosition === null}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Select as Winner
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('REJECTED')}
                      disabled={actionLoading || !feedback}
                      variant="destructive"
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Reject Submission
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Decision */}
            {(submission.status === 'SELECTED' || submission.status === 'REJECTED') && submission.feedback && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Review Decision</CardTitle>
                  <CardDescription className="text-white/60">
                    Reviewed on {submission.reviewedAt ? formatDate(submission.reviewedAt) : 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">{submission.feedback}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submitter Info */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Submitter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {submission.creator.avatarUrl ? (
                    <img
                      src={submission.creator.avatarUrl}
                      alt={submission.creator.username}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 flex items-center justify-center text-white font-bold">
                      {submission.creator.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {submission.creator.firstName} {submission.creator.lastName}
                    </p>
                    <p className="text-sm text-white/60">@{submission.creator.username}</p>
                  </div>
                </div>

                {submission.creator.bio && (
                  <div>
                    <p className="text-sm text-white/60 mb-1">Bio</p>
                    <p className="text-white/80 text-sm">{submission.creator.bio}</p>
                  </div>
                )}

                {submission.creator.location && (
                  <div className="flex items-center gap-2 text-white/60">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{submission.creator.location}</span>
                  </div>
                )}

                {submission.creator.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${submission.creator.email}`}
                      className="text-sm hover:text-white"
                    >
                      {submission.creator.email}
                    </a>
                  </div>
                )}

                {submission.creator.skills && Array.isArray(submission.creator.skills) && submission.creator.skills.length > 0 && (
                  <div>
                    <p className="text-sm text-white/60 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {submission.creator.skills.map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-white/10 text-white border-0"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  {submission.creator.github && (
                    <a
                      href={submission.creator.github.startsWith('http') ? submission.creator.github : `https://github.com/${submission.creator.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#E6007A] hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  )}
                  {submission.creator.linkedin && (
                    <a
                      href={submission.creator.linkedin.startsWith('http') ? submission.creator.linkedin : `https://linkedin.com/in/${submission.creator.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#E6007A] hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {submission.creator.twitter && (
                    <a
                      href={submission.creator.twitter.startsWith('http') ? submission.creator.twitter : `https://twitter.com/${submission.creator.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#E6007A] hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Twitter Profile
                    </a>
                  )}
                  {submission.creator.website && (
                    <a
                      href={submission.creator.website.startsWith('http') ? submission.creator.website : `https://${submission.creator.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#E6007A] hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bounty Info */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Bounty Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Total Prize Pool</p>
                    <p className="text-white font-medium">
                      {formatAmount(submission.bounty.totalAmount)} {submission.bounty.token}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Winners</p>
                    <p className="text-white">{submission.bounty.winnerCount} positions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-white">{formatDate(submission.submittedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}