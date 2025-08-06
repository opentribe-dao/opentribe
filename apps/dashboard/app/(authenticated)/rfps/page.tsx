'use client';

import { useActiveOrganization, useSession } from '@packages/auth/client';
import { Badge } from '@packages/base/components/ui/badge';
import { Button } from '@packages/base/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@packages/base/components/ui/table';
import {
  Edit,
  Eye,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '../components/header';
import { env } from '@/env';
import { toast } from 'sonner';

interface RFP {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  viewCount: number;
  commentCount: number;
  voteCount: number;
  applicationCount: number;
  createdAt: string;
  publishedAt?: string;
  grant: {
    id: string;
    title: string;
    slug: string;
  };
}

const STATUSES = [
  { value: 'all', label: 'All Status' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'COMPLETED', label: 'Completed' },
];

const VISIBILITIES = [
  { value: 'all', label: 'All Visibility' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function RFPsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  useEffect(() => {
    if (activeOrg) {
      fetchRFPs();
    }
  }, [activeOrg]);

  const fetchRFPs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch RFPs');
      }

      const data = await response.json();
      setRfps(data.rfps || []);
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      toast.error('Failed to load RFPs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRFP = async (rfpId: string) => {
    if (!confirm('Are you sure you want to delete this RFP?')) return;

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps/${rfpId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete RFP');
      }

      toast.success('RFP deleted successfully');
      fetchRFPs();
    } catch (error) {
      console.error('Error deleting RFP:', error);
      toast.error('Failed to delete RFP');
    }
  };

  const filteredRfps = rfps.filter((rfp) => {
    const matchesSearch = rfp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rfp.grant.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfp.status === statusFilter;
    const matchesVisibility = visibilityFilter === 'all' || rfp.visibility === visibilityFilter;
    
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-500/20 text-green-400';
      case 'CLOSED':
        return 'bg-red-500/20 text-red-400';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'PUBLISHED':
        return 'bg-green-500/20 text-green-400';
      case 'DRAFT':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!activeOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white/60 mb-4">No organization selected</p>
          <Button
            onClick={() => router.push('/organization/new')}
            className="bg-[#E6007A] hover:bg-[#E6007A]/90"
          >
            Create Organization
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header pages={['RFPs']} page="RFPs" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">RFPs</h1>
            <p className="text-white/60">
              Manage your organization's Requests for Proposals
            </p>
          </div>
          <Button
            onClick={() => router.push('/rfps/new')}
            className="bg-[#E6007A] hover:bg-[#E6007A]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create RFP
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
                  <Input
                    placeholder="Search RFPs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITIES.map((visibility) => (
                      <SelectItem key={visibility.value} value={visibility.value}>
                        {visibility.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* RFPs Table */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
              </div>
            ) : filteredRfps.length === 0 ? (
              <div className="text-center p-8">
                <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-4">
                  {searchTerm || statusFilter !== 'all' || visibilityFilter !== 'all'
                    ? 'No RFPs found matching your filters'
                    : 'No RFPs created yet'}
                </p>
                {!searchTerm && statusFilter === 'all' && visibilityFilter === 'all' && (
                  <Button
                    onClick={() => router.push('/rfps/new')}
                    className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First RFP
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">RFP</TableHead>
                    <TableHead className="text-white">Grant</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Visibility</TableHead>
                    <TableHead className="text-white text-center">Stats</TableHead>
                    <TableHead className="text-white">Created</TableHead>
                    <TableHead className="text-white text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRfps.map((rfp) => (
                    <TableRow key={rfp.id} className="border-white/10">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{rfp.title}</p>
                          <p className="text-sm text-white/60">/{rfp.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/grants/${rfp.grant.id}`}
                          className="text-[#E6007A] hover:underline"
                        >
                          {rfp.grant.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(rfp.status)} border-0`}>
                          {rfp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getVisibilityColor(rfp.visibility)} border-0`}>
                          {rfp.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{rfp.viewCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{rfp.commentCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{rfp.voteCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{rfp.applicationCount}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {formatDate(rfp.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/rfps/${rfp.id}`)}
                            className="text-white/60 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/rfps/${rfp.id}/edit`)}
                            className="text-white/60 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRFP(rfp.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}