'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@packages/base/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Header } from '../../components/header';
import { env } from '@/env';

interface RFPDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  resources?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  status: string;
  visibility: string;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  grant: {
    id: string;
    title: string;
    slug: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  applications: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    applicant: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  _count: {
    comments: number;
    votes: number;
    applications: number;
  };
}

export default function RFPDetailPage() {
  const params = useParams();
  const { id } = use(params as Promise<{ id: string }>);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [rfp, setRfp] = useState<RFPDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchRFPDetails();
    }
  }, [id]);

  const fetchRFPDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/rfps/${id}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch RFP details');
      }

      const data = await response.json();
      setRfp(data.rfp);
      
      // Check if user has access to this RFP
      if (data.rfp.grant.organization.id !== activeOrg?.id) {
        toast.error('You do not have access to this RFP');
        router.push('/rfps');
      }
    } catch (error) {
      console.error('Error fetching RFP:', error);
      toast.error('Failed to load RFP details');
      router.push('/rfps');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this RFP?')) return;

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete RFP');
      }

      toast.success('RFP deleted successfully');
      router.push('/rfps');
    } catch (error) {
      console.error('Error deleting RFP:', error);
      toast.error('Failed to delete RFP');
    }
  };

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!rfp) {
    return null;
  }

  return (
    <>
      <Header pages={['RFPs', rfp.title]} page={rfp.title} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/rfps')}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFPs
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`${env.NEXT_PUBLIC_WEB_URL}/rfps/${rfp.slug}`, '_blank')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Public Page
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/rfps/${rfp.id}/edit`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* RFP Header */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl text-white mb-2">{rfp.title}</CardTitle>
                <CardDescription className="text-white/60">
                  <div className="flex items-center gap-4">
                    <span>Grant: </span>
                    <Link
                      href={`/grants/${rfp.grant.id}`}
                      className="text-[#E6007A] hover:underline"
                    >
                      {rfp.grant.title}
                    </Link>
                  </div>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(rfp.status)} border-0`}>
                  {rfp.status}
                </Badge>
                <Badge className={`${getVisibilityColor(rfp.visibility)} border-0`}>
                  {rfp.visibility}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">Views</span>
                </div>
                <p className="text-2xl font-bold text-white">{rfp.viewCount}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">Comments</span>
                </div>
                <p className="text-2xl font-bold text-white">{rfp._count.comments}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm">Votes</span>
                </div>
                <p className="text-2xl font-bold text-white">{rfp._count.votes}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Applications</span>
                </div>
                <p className="text-2xl font-bold text-white">{rfp._count.applications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-white/20">
              Applications ({rfp._count.applications})
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-white/20">
              Comments ({rfp._count.comments})
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-pink max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {rfp.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            {rfp.resources && rfp.resources.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Resources & Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rfp.resources.map((resource, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Globe className="h-5 w-5 text-white/40 mt-0.5" />
                        <div>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#E6007A] hover:underline font-medium"
                          >
                            {resource.title}
                          </a>
                          {resource.description && (
                            <p className="text-sm text-white/60 mt-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-white/60">Created</dt>
                    <dd className="text-white mt-1">{formatDate(rfp.createdAt)}</dd>
                  </div>
                  {rfp.publishedAt && (
                    <div>
                      <dt className="text-sm text-white/60">Published</dt>
                      <dd className="text-white mt-1">{formatDate(rfp.publishedAt)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-white/60">Slug</dt>
                    <dd className="text-white mt-1 font-mono text-sm">/{rfp.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-white/60">Organization</dt>
                    <dd className="text-white mt-1">{rfp.grant.organization.name}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6">
                {rfp.applications && rfp.applications.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 flex items-center justify-center text-white font-bold">
                            {application.applicant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{application.title}</p>
                            <p className="text-sm text-white/60">
                              by {application.applicant.name} • {formatDate(application.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No applications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="p-6">
                {rfp.comments && rfp.comments.length > 0 ? (
                  <div className="space-y-4">
                    {rfp.comments.map((comment) => (
                      <div key={comment.id} className="border-b border-white/10 pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {comment.author.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-white">{comment.author.name}</p>
                              <span className="text-xs text-white/40">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-white/80">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No comments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">RFP Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Manage this RFP's configuration and visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-yellow-400 text-sm">
                    Settings management is available in the edit page
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push(`/rfps/${rfp.id}/edit`)}
                    className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit RFP
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}