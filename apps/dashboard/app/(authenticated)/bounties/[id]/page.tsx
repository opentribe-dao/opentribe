'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Badge } from '@packages/base/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@packages/base/components/ui/tabs';
import { Checkbox } from '@packages/base/components/ui/checkbox';
import { CalendarIcon, CoinsIcon, ExternalLink, Loader2, Trophy, Users, Award, DollarSign, CheckCircle } from 'lucide-react';
import { Header } from '../../components/header';
import Link from 'next/link';
import { env } from '@/env';
import { toast } from 'sonner';
import { PaymentModal } from './payment-modal';

interface BountyDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  amount: number;
  token: string;
  split: string;
  winnings: Record<string, number>;
  deadline: string;
  resources?: Array<{ title: string; url: string; description?: string }>;
  screening?: Array<{ question: string; type: string; optional: boolean }>;
  status: string;
  visibility: string;
  submissionCount: number;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  publishedAt?: string;
  winnersAnnouncedAt?: string;
}

interface Submission {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
  responses?: any;
  status: string;
  isWinner: boolean;
  position?: number;
  winningAmount?: number;
  submittedAt?: string;
  submitter: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    headline?: string;
    walletAddress?: string;
  };
  stats: {
    commentsCount: number;
    likesCount: number;
  };
  payments?: Array<{
    id: string;
    status: string;
    extrinsicHash?: string;
    amount: number;
    createdAt: string;
  }>;
}

const BountyDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [bounty, setBounty] = useState<BountyDetails | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<Map<string, { position: number; amount: number }>>(new Map());
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentSubmission, setSelectedPaymentSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchBounty = async () => {
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch bounty');
        }

        const data = await response.json();
        setBounty(data.bounty);
      } catch (error) {
        console.error('Error fetching bounty:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounty();
  }, [id]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!bounty) return;
      
      setSubmissionsLoading(true);
      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/submissions`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissions();
  }, [bounty, id]);

  const handleSelectWinner = (submissionId: string, position: number, amount: number) => {
    const newSelected = new Map(selectedWinners);
    
    // Check if this submission is already selected
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      // Remove any other submission with the same position
      for (const [id, data] of newSelected) {
        if (data.position === position) {
          newSelected.delete(id);
        }
      }
      newSelected.set(submissionId, { position, amount });
    }
    
    setSelectedWinners(newSelected);
  };

  const handleAnnounceWinners = async () => {
    if (selectedWinners.size === 0) {
      toast.error('Please select at least one winner');
      return;
    }

    setIsAnnouncing(true);
    try {
      const winners = Array.from(selectedWinners.entries()).map(([submissionId, data]) => ({
        submissionId,
        position: data.position,
        amount: data.amount,
      }));

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/winners`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ winners }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to announce winners');
      }

      const result = await response.json();
      toast.success('Winners announced successfully!');
      
      // Refresh bounty data
      setBounty(result.bounty);
      setSelectedWinners(new Map());
      
      // Refresh submissions
      const submissionsResponse = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/submissions`,
        {
          credentials: 'include',
        }
      );
      if (submissionsResponse.ok) {
        const data = await submissionsResponse.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error announcing winners:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to announce winners');
    } finally {
      setIsAnnouncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-semibold text-white mb-4">Bounty not found</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/bounties')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back to Bounties
        </Button>
      </div>
    );
  }

  const sortedWinnings = Object.entries(bounty.winnings).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <>
      <Header pages={['Overview', 'Bounties']} page={bounty.title} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">{bounty.title}</h1>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span>by {bounty.organization.name}</span>
              <span>•</span>
              <span>{new Date(bounty.publishedAt || bounty.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={bounty.status === 'OPEN' ? 'bg-green-500/20 text-green-400 border-0' : 'bg-gray-500/20 text-gray-400 border-0'}
            >
              {bounty.status}
            </Badge>
            {bounty.status === 'OPEN' && submissions.length > 0 && !bounty.winnersAnnouncedAt && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAnnounceWinners}
                disabled={isAnnouncing || selectedWinners.size === 0}
              >
                {isAnnouncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Announcing...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Announce Winners ({selectedWinners.size})
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
              asChild
            >
              <Link href={`/bounties/${id}/edit`}>
                Edit Bounty
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
              Overview
            </TabsTrigger>
            <TabsTrigger value="submissions" className="data-[state=active]:bg-white/10">
              Submissions ({bounty.submissionCount})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/10">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardDescription className="text-white/60">Total Prize Pool</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CoinsIcon className="h-5 w-5 text-[#E6007A]" />
                    <span className="text-2xl font-semibold text-white">
                      {bounty.amount} {bounty.token}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardDescription className="text-white/60">Deadline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-[#E6007A]" />
                    <span className="text-2xl font-semibold text-white">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardDescription className="text-white/60">Submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-semibold text-white">
                    {bounty.submissionCount}
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 whitespace-pre-wrap">{bounty.description}</p>
              </CardContent>
            </Card>

            {/* Prize Distribution */}
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Prize Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedWinnings.map(([position, amount], index) => (
                    <div key={position} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          index === 0 ? 'bg-yellow-500/20' : 
                          index === 1 ? 'bg-gray-400/20' : 
                          index === 2 ? 'bg-orange-600/20' : 'bg-white/10'
                        }`}>
                          <Trophy className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-orange-600' : 'text-white/60'
                          }`} />
                        </div>
                        <span className="text-white font-medium">
                          {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${position}th`} Place
                        </span>
                      </div>
                      <span className="text-white font-semibold">
                        {amount} {bounty.token}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bounty.skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="bg-white/10 text-white border-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            {bounty.resources && bounty.resources.length > 0 && (
              <Card className="bg-zinc-900/50 border-white/10">
                <CardHeader>
                  <CardTitle>Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bounty.resources.map((resource, index) => (
                      <div key={index} className="flex items-start justify-between">
                        <div>
                          <a 
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#E6007A] transition-colors flex items-center gap-2"
                          >
                            {resource.title}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {resource.description && (
                            <p className="text-sm text-white/60 mt-1">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            {submissionsLoading ? (
              <Card className="bg-zinc-900/50 border-white/10">
                <CardContent className="p-6">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                  </div>
                </CardContent>
              </Card>
            ) : submissions.length === 0 ? (
              <Card className="bg-zinc-900/50 border-white/10">
                <CardContent className="p-6">
                  <p className="text-center text-white/60">No submissions yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Winners section if already announced */}
                {bounty.winnersAnnouncedAt && (
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-green-400" />
                        Winners Announced
                      </CardTitle>
                      <CardDescription>
                        Winners were announced on {new Date(bounty.winnersAnnouncedAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {submissions
                          .filter(s => s.isWinner)
                          .sort((a, b) => (a.position || 0) - (b.position || 0))
                          .map((winner) => (
                            <div key={winner.id} className="p-4 bg-white/5 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <Trophy className={`h-5 w-5 ${
                                    winner.position === 1 ? 'text-yellow-500' :
                                    winner.position === 2 ? 'text-gray-400' :
                                    winner.position === 3 ? 'text-orange-600' : 'text-white/60'
                                  }`} />
                                  <div>
                                    <p className="font-medium text-white">
                                      {winner.submitter.firstName || winner.submitter.username || 'Anonymous'}
                                    </p>
                                    <p className="text-sm text-white/60">
                                      {winner.position === 1 ? '1st' : 
                                       winner.position === 2 ? '2nd' : 
                                       winner.position === 3 ? '3rd' : 
                                       `${winner.position}th`} Place
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-white">
                                      {winner.winningAmount} {bounty.token}
                                    </p>
                                    <p className="text-xs text-white/60">Prize Amount</p>
                                  </div>
                                  {winner.payments && winner.payments.length > 0 ? (
                                    <Badge className="bg-green-500/20 text-green-400 border-0">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPaymentSubmission(winner);
                                        setPaymentModalOpen(true);
                                      }}
                                      className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
                                    >
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      Mark as Paid
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {winner.submitter.walletAddress && (
                                <div className="mt-3 p-2 bg-black/20 rounded">
                                  <p className="text-xs text-white/60 mb-1">Payment Address</p>
                                  <p className="text-sm text-white font-mono break-all">
                                    {winner.submitter.walletAddress}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Submissions list */}
                <div className="space-y-4">
                  {submissions.map((submission) => {
                    const isSelected = selectedWinners.has(submission.id);
                    const winnerData = selectedWinners.get(submission.id);
                    
                    return (
                      <Card 
                        key={submission.id} 
                        className={`bg-zinc-900/50 border-white/10 transition-all ${
                          isSelected ? 'ring-2 ring-green-500' : ''
                        } ${submission.isWinner ? 'border-green-500/50' : ''}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              {/* Winner selection checkbox (only if not already announced) */}
                              {!bounty.winnersAnnouncedAt && bounty.status === 'OPEN' && (
                                <div className="space-y-2">
                                  {sortedWinnings.map(([position, amount], index) => (
                                    <div key={position} className="flex items-center gap-2">
                                      <Checkbox
                                        checked={winnerData?.position === Number(position)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            handleSelectWinner(submission.id, Number(position), amount);
                                          } else {
                                            handleSelectWinner(submission.id, Number(position), amount);
                                          }
                                        }}
                                      />
                                      <label className="text-sm text-white/60">
                                        {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${position}th`}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-white">
                                    {submission.submitter.firstName || submission.submitter.username || 'Anonymous'}
                                  </h3>
                                  {submission.isWinner && (
                                    <div className="flex items-center gap-2">
                                      <Trophy className={`h-4 w-4 ${
                                        submission.position === 1 ? 'text-yellow-500' :
                                        submission.position === 2 ? 'text-gray-400' :
                                        submission.position === 3 ? 'text-orange-600' : 'text-white/60'
                                      }`} />
                                      <span className="text-sm font-medium text-white">
                                        {submission.position === 1 ? '1st' : 
                                         submission.position === 2 ? '2nd' : 
                                         submission.position === 3 ? '3rd' : 
                                         `${submission.position}th`} Place - {submission.winningAmount} {bounty.token}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {submission.submitter.headline && (
                                  <p className="text-sm text-white/60 mt-1">{submission.submitter.headline}</p>
                                )}
                                {submission.submitter.email && (
                                  <p className="text-sm text-white/40 mt-1">{submission.submitter.email}</p>
                                )}
                                {submission.isWinner && submission.submitter.walletAddress && (
                                  <div className="mt-3 p-3 bg-[#E6007A]/10 rounded-lg border border-[#E6007A]/30">
                                    <p className="text-xs text-white/60 mb-1">Payment Address</p>
                                    <p className="text-sm text-white font-mono break-all">
                                      {submission.submitter.walletAddress}
                                    </p>
                                  </div>
                                )}
                                {!submission.isWinner && submission.submitter.walletAddress && (
                                  <p className="text-sm text-white/40 mt-1 font-mono">
                                    Wallet: {submission.submitter.walletAddress}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-white/10 text-white border-0">
                                {submission.status}
                              </Badge>
                              {submission.submissionUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/20 text-white hover:bg-white/10"
                                  asChild
                                >
                                  <a href={submission.submissionUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {(submission.title || submission.description) && (
                          <CardContent>
                            {submission.title && (
                              <h4 className="font-medium text-white mb-2">{submission.title}</h4>
                            )}
                            {submission.description && (
                              <p className="text-white/80 text-sm">{submission.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
                              <span>Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}</span>
                              <span>•</span>
                              <span>{submission.stats.likesCount} likes</span>
                              <span>•</span>
                              <span>{submission.stats.commentsCount} comments</span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900/50 border-white/10">
              <CardHeader>
                <CardTitle>Bounty Settings</CardTitle>
                <CardDescription>Manage your bounty settings and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-white/60">Status</p>
                  <p className="text-white">{bounty.status}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Visibility</p>
                  <p className="text-white">{bounty.visibility}</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Created</p>
                  <p className="text-white">{new Date(bounty.createdAt).toLocaleString()}</p>
                </div>
                {bounty.publishedAt && (
                  <div>
                    <p className="text-sm text-white/60">Published</p>
                    <p className="text-white">{new Date(bounty.publishedAt).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Modal */}
      {selectedPaymentSubmission && bounty && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPaymentSubmission(null);
          }}
          submission={selectedPaymentSubmission}
          bounty={bounty}
          onPaymentRecorded={() => {
            // Refresh submissions to show updated payment status
            const fetchSubmissions = async () => {
              try {
                const response = await fetch(
                  `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${id}/submissions`,
                  {
                    credentials: 'include',
                  }
                );
                if (response.ok) {
                  const data = await response.json();
                  setSubmissions(data.submissions || []);
                }
              } catch (error) {
                console.error('Error refreshing submissions:', error);
              }
            };
            fetchSubmissions();
          }}
        />
      )}
    </>
  );
};

export default BountyDetailPage;