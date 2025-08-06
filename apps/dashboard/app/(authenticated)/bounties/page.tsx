'use client';

import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Badge } from '@packages/base/components/ui/badge';
import { Input } from '@packages/base/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Plus, Search, Filter, Users, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '../components/header';
import { env } from '@/env';

interface Bounty {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  amount: number;
  token: string;
  deadline: string;
  createdAt: string;
  publishedAt?: string;
  _count: {
    submissions: number;
  };
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
}

const BountiesPage = () => {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBounties = async () => {
      if (!activeOrg) return;

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}/bounties`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch bounties');
        }

        const data = await response.json();
        setBounties(data.bounties || []);
      } catch (error) {
        console.error('Error fetching bounties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, [activeOrg]);

  if (!session?.user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400 border-0';
      case 'REVIEW':
        return 'bg-yellow-500/20 text-yellow-400 border-0';
      case 'CLOSED':
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-400 border-0';
      case 'DRAFT':
      default:
        return 'bg-gray-500/20 text-gray-400 border-0';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'Open';
      case 'ACTIVE':
        return 'Active';
      case 'REVIEW':
        return 'Under Review';
      case 'CLOSED':
        return 'Closed';
      case 'COMPLETED':
        return 'Completed';
      case 'DRAFT':
      default:
        return 'Draft';
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter bounties based on search query
  const filteredBounties = bounties.filter(bounty => {
    const matchesSearch = searchQuery === '' || 
      bounty.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      bounty.status.toUpperCase() === filterStatus.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Sort bounties
  const sortedBounties = [...filteredBounties].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'submissions':
        return b._count.submissions - a._count.submissions;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header pages={['Overview']} page="Bounties" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Bounties</h1>
          <Button 
            className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
            asChild
          >
            <Link href="/bounties/new">
              Create New Bounty
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-white/40"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="border-white/10 text-white/60 hover:bg-white/5"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              <SelectItem value="newest" className="text-white">Newest first</SelectItem>
              <SelectItem value="oldest" className="text-white">Oldest first</SelectItem>
              <SelectItem value="submissions" className="text-white">Most submissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bounties Table */}
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">Title</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">Submissions</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white/40 mx-auto" />
                  </td>
                </tr>
              ) : sortedBounties.length > 0 ? (
                sortedBounties.map((bounty) => (
                  <tr key={bounty.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <Link 
                        href={`/bounties/${bounty.id}`}
                        className="text-white hover:text-[#E6007A] transition-colors font-medium"
                      >
                        {bounty.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={getStatusColor(bounty.status)}>
                        {getStatusLabel(bounty.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">{bounty._count?.submissions || 0} submissions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4 text-white/40" />
                        <span className="text-white/80">{formatDeadline(bounty.deadline)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="space-y-3">
                      <p className="text-white/60">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'No bounties match your search criteria' 
                          : 'No bounties yet'}
                      </p>
                      {!searchQuery && filterStatus === 'all' && (
                        <Button 
                          variant="outline" 
                          className="border-white/20 text-white hover:bg-white/10"
                          asChild
                        >
                          <Link href="/bounties/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first bounty
                          </Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BountiesPage;