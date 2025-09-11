'use client';

import { useBounty,} from "@/hooks/use-bounty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/base/components/ui/card";
import { Badge, CalendarIcon, CoinsIcon, ExternalLink, Trophy } from "lucide-react";

import { useParams } from 'next/navigation';


export default function BountyOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bounty} = useBounty(id);

  if (!bounty) {
    return <div className="text-white">Bounty not found</div>;
  }



  const sortedWinnings = Object.entries(bounty.winnings).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div className="space-y-6">
       {/* Stats Cards */}
       <div className='grid grid-cols-1 gap-4 md:grid-cols-3 '>
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
                    <Badge key={skill} variant="secondary" className='border-0 bg-white/10 text-white'>
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
    </div>
  );
}