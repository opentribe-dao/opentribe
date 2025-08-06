'use client';

import { use } from 'react';
import { useActiveOrganization, useSession } from '@packages/auth/client';
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
import { MarkdownEditor } from '@packages/base';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Badge } from '@packages/base/components/ui/badge';
import { ArrowLeft, Loader2, Plus, X, Globe, FileText, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '../../../components/header';
import { env } from '@/env';

interface Grant {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface Resource {
  title: string;
  url: string;
  description?: string;
}

interface RfpFormData {
  grantId: string;
  title: string;
  description: string;
  resources: Resource[];
  status: 'OPEN' | 'CLOSED' | 'COMPLETED';
  visibility: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export default function EditRFPPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGrants, setLoadingGrants] = useState(true);
  const [formData, setFormData] = useState<RfpFormData>({
    grantId: '',
    title: '',
    description: '',
    resources: [],
    status: 'OPEN',
    visibility: 'DRAFT',
  });

  useEffect(() => {
    if (activeOrg && id) {
      fetchRFPDetails();
      fetchGrants();
    }
  }, [activeOrg, id]);

  const fetchRFPDetails = async () => {
    try {
      setLoadingData(true);
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
      const rfp = data.rfp;

      // Check if user has access to edit this RFP
      if (rfp.grant.organization.id !== activeOrg?.id) {
        toast.error('You do not have access to edit this RFP');
        router.push('/rfps');
        return;
      }

      setFormData({
        grantId: rfp.grant.id,
        title: rfp.title,
        description: rfp.description,
        resources: rfp.resources || [],
        status: rfp.status,
        visibility: rfp.visibility,
      });
    } catch (error) {
      console.error('Error fetching RFP:', error);
      toast.error('Failed to load RFP details');
      router.push('/rfps');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchGrants = async () => {
    try {
      setLoadingGrants(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/grants`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch grants');
      }

      const data = await response.json();
      // Only show active grants that can have RFPs
      const activeGrants = data.grants.filter((grant: Grant) => 
        grant.status === 'OPEN' || grant.status === 'ACTIVE'
      );
      setGrants(activeGrants);
    } catch (error) {
      console.error('Error fetching grants:', error);
      toast.error('Failed to load grants');
    } finally {
      setLoadingGrants(false);
    }
  };

  const updateFormData = (field: keyof RfpFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addResource = () => {
    updateFormData('resources', [
      ...formData.resources,
      { title: '', url: '', description: '' }
    ]);
  };

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    const updatedResources = [...formData.resources];
    updatedResources[index] = { ...updatedResources[index], [field]: value };
    updateFormData('resources', updatedResources);
  };

  const removeResource = (index: number) => {
    updateFormData('resources', formData.resources.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.grantId || !formData.title || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const submitData = {
        ...formData,
        resources: formData.resources.filter(r => r.title && r.url),
      };

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg?.id}/rfps/${id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update RFP');
      }

      toast.success('RFP updated successfully!');
      router.push(`/rfps/${id}`);
    } catch (error) {
      console.error('Error updating RFP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update RFP');
    } finally {
      setLoading(false);
    }
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

  if (loadingData || loadingGrants) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <>
      <Header pages={['RFPs', 'Edit']} page="Edit RFP" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/rfps/${id}`)}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFP
          </Button>
        </div>

        <Card className="bg-white/5 backdrop-blur-md border-white/10 max-w-4xl mx-auto w-full">
          <CardHeader>
            <CardTitle className="text-white">Edit RFP</CardTitle>
            <CardDescription className="text-white/60">
              Update your Request for Proposal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grant Selection */}
            <div>
              <Label htmlFor="grant">Parent Grant *</Label>
              <Select
                value={formData.grantId}
                onValueChange={(value) => updateFormData('grantId', value)}
                disabled={loadingGrants}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue placeholder="Select a grant" />
                </SelectTrigger>
                <SelectContent>
                  {grants.map((grant) => (
                    <SelectItem key={grant.id} value={grant.id}>
                      {grant.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">RFP Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter a clear, descriptive title for your RFP"
                className="bg-white/5 border-white/10 text-white mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <div className="mt-2">
                <MarkdownEditor
                  value={formData.description}
                  onChange={(value) => updateFormData('description', value)}
                  placeholder="Provide a detailed description of what you're looking for..."
                  height={400}
                />
              </div>
              <p className="text-sm text-white/60 mt-2">
                Be specific about requirements, deliverables, and evaluation criteria
              </p>
            </div>

            {/* Resources */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Resources & Links</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addResource}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Resource
                </Button>
              </div>
              <div className="space-y-3">
                {formData.resources.map((resource, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-white/40 mt-2" />
                      <div className="flex-1 space-y-3">
                        <Input
                          placeholder="Resource title"
                          value={resource.title}
                          onChange={(e) => updateResource(index, 'title', e.target.value)}
                          className="bg-white/10 border-white/10 text-white"
                        />
                        <Input
                          placeholder="https://example.com"
                          value={resource.url}
                          onChange={(e) => updateResource(index, 'url', e.target.value)}
                          className="bg-white/10 border-white/10 text-white"
                        />
                        <Input
                          placeholder="Description (optional)"
                          value={resource.description || ''}
                          onChange={(e) => updateResource(index, 'description', e.target.value)}
                          className="bg-white/10 border-white/10 text-white"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResource(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formData.resources.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-4">
                    No resources added yet
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'OPEN' | 'CLOSED' | 'COMPLETED') => 
                  updateFormData('status', value)
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={formData.visibility}
                onValueChange={(value: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => 
                  updateFormData('visibility', value)
                }
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-white/60 mt-2">
                {formData.visibility === 'DRAFT' && 'This RFP is only visible to your organization'}
                {formData.visibility === 'PUBLISHED' && 'This RFP is publicly visible'}
                {formData.visibility === 'ARCHIVED' && 'This RFP is hidden from public view'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => router.push(`/rfps/${id}`)}
                disabled={loading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.grantId || !formData.title || !formData.description}
                className="bg-[#E6007A] hover:bg-[#E6007A]/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}