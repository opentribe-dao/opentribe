'use client';

import { useBounty, useBountySubmissions } from "@/hooks/use-bounty";
import { Button } from "@packages/base/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/base/components/ui/card";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import { Badge, CheckCircle, DollarSign, Loader2, Trophy } from "lucide-react";
import { useParams } from "next/navigation";

export default function SubmissionsPage() {

  const { id } = useParams<{ id: string }>();
  const { data: bounty, isLoading: bountyLoading } = useBounty(id);
  const { data: submissions, isLoading: submissionsLoading, error } = useBountySubmissions(id);



  if (submissionsLoading || bountyLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }
  if (error || !submissions) {
    return <div className="text-white">Submissions not found</div>;
  }



  return (
    <div className="text-white">
        { submissions.length === 0 ? (
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
    </div>
  );
}