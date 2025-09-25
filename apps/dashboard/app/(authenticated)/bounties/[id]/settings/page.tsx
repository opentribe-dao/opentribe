'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/base/components/ui/card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Textarea } from "@packages/base/components/ui/textarea";
import { Label } from "@packages/base/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@packages/base/components/ui/select";
import { MarkdownEditor } from "@packages/base/components/ui/markdown-editor";
import { Badge } from "@packages/base/components/ui/badge";
import { useBountyContext } from "../../../components/bounty-provider";
import { toast } from 'sonner';
import { env } from '@/env';
import { 
  Save, 
  Loader2, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Users, 
  Eye, 
  EyeOff,
  Trash2,
  Plus,
  X,
  Settings,
  Award,
  Clock
} from 'lucide-react';

interface BountyFormData {
  title: string;
  description: string;
  skills: string[];
  amount: number;
  token: string;
  split: 'FIXED' | 'EQUAL_SPLIT' | 'VARIABLE';
  winnings: Record<string, number>;
  deadline: string;
  resources: Array<{ title: string; url: string; description?: string }>;
  screening: Array<{ question: string; type: 'text' | 'url' | 'file'; optional: boolean }>;
  visibility: 'DRAFT' | 'PUBLISHED';
  status: 'OPEN' | 'REVIEWING' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
}

export default function SettingsPage() {
  const { bounty, refreshBounty } = useBountyContext();
  const [formData, setFormData] = useState<BountyFormData>({
    title: '',
    description: '',
    skills: [],
    amount: 0,
    token: 'DOT',
    split: 'FIXED',
    winnings: {},
    deadline: '',
    resources: [],
    screening: [],
    visibility: 'DRAFT',
    status: 'OPEN',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '' });
  const [newScreening, setNewScreening] = useState({ question: '', type: 'text' as const, optional: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data from bounty
  useEffect(() => {
    if (bounty) {
      const deadline = bounty.deadline ? new Date(bounty.deadline).toISOString().slice(0, 16) : '';
      setFormData({
        title: bounty.title || '',
        description: bounty.description || '',
        skills: bounty.skills || [],
        amount: bounty.amount || 0,
        token: bounty.token || 'DOT',
        split: (bounty.split as any) || 'FIXED',
        winnings: bounty.winnings || {},
        deadline,
        resources: bounty.resources || [],
        screening: bounty.screening || [],
        visibility: (bounty.visibility as any) || 'DRAFT',
        status: (bounty.status as any) || 'OPEN',
      });
    }
  }, [bounty]);

  // Track changes
  useEffect(() => {
    if (bounty) {
      const hasFormChanges = JSON.stringify(formData) !== JSON.stringify({
        title: bounty.title || '',
        description: bounty.description || '',
        skills: bounty.skills || [],
        amount: bounty.amount || 0,
        token: bounty.token || 'DOT',
        split: (bounty.split as any) || 'FIXED',
        winnings: bounty.winnings || {},
        deadline: bounty.deadline ? new Date(bounty.deadline).toISOString().slice(0, 16) : '',
        resources: bounty.resources || [],
        screening: bounty.screening || [],
        visibility: (bounty.visibility as any) || 'DRAFT',
        status: (bounty.status as any) || 'OPEN',
      });
      setHasChanges(hasFormChanges);
    }
  }, [formData, bounty]);

  const handleInputChange = (field: keyof BountyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      handleInputChange('skills', [...formData.skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    handleInputChange('skills', formData.skills.filter(s => s !== skill));
  };

  const addResource = () => {
    if (newResource.title.trim() && newResource.url.trim()) {
      handleInputChange('resources', [...formData.resources, { ...newResource }]);
      setNewResource({ title: '', url: '', description: '' });
    }
  };

  const removeResource = (index: number) => {
    handleInputChange('resources', formData.resources.filter((_, i) => i !== index));
  };

  const addScreening = () => {
    if (newScreening.question.trim()) {
      handleInputChange('screening', [...formData.screening, { ...newScreening }]);
      setNewScreening({ question: '', type: 'text', optional: false });
    }
  };

  const removeScreening = (index: number) => {
    handleInputChange('screening', formData.screening.filter((_, i) => i !== index));
  };

  const updateWinnings = (position: string, amount: number) => {
    const newWinnings = { ...formData.winnings };
    if (amount > 0) {
      newWinnings[position] = amount;
    } else {
      delete newWinnings[position];
    }
    handleInputChange('winnings', newWinnings);
  };

  const saveBounty = async () => {
    if (!bounty) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update bounty');
      }

      toast.success('Bounty updated successfully!');
      await refreshBounty();
      setHasChanges(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update bounty');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBounty = async () => {
    if (!bounty) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bounty');
      }

      toast.success('Bounty deleted successfully!');
      // Redirect to bounties list
      window.location.href = '/bounties';
    } catch (error) {
      toast.error('Failed to delete bounty');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!bounty) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
      
        <div className="flex gap-2 mb-4">
          {hasChanges && (
            <Button
              onClick={saveBounty}
              disabled={isSaving}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Basic Settings */}
        <div className="space-y-6">
          {/* Basic Information */}
          {/* <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-white/60">
                Core bounty details and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white/80">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  placeholder="Enter bounty title"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white/80">Description</Label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Describe the bounty requirements and deliverables..."
                  height={200}
                />
              </div>

              <div>
                <Label className="text-white/80">Required Skills</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      placeholder="Add a skill"
                    />
                    <Button onClick={addSkill} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Prize Distribution */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="h-5 w-5" />
                Prize Distribution
              </CardTitle>
              <CardDescription className="text-white/60">
                Set the total amount and how it's distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-white/80">Total Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="token" className="text-white/80">Token</Label>
                  <Select value={formData.token} onValueChange={(value) => handleInputChange('token', value)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="DOT" className="text-white">DOT</SelectItem>
                      <SelectItem value="USDT" className="text-white">USDT</SelectItem>
                      <SelectItem value="USDC" className="text-white">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white/80">Distribution Type</Label>
                <Select value={formData.split} onValueChange={(value: any) => handleInputChange('split', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="FIXED" className="text-white">Fixed Amounts</SelectItem>
                    <SelectItem value="EQUAL_SPLIT" className="text-white">Equal Split</SelectItem>
                    <SelectItem value="VARIABLE" className="text-white">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.split === 'FIXED' && (
                <div>
                  <Label className="text-white/80">Winner Prizes</Label>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((position) => (
                      <div key={position} className="flex items-center gap-2">
                        <span className="w-16 text-sm text-white/60">{position}st Place</span>
                        <Input
                          type="number"
                          value={formData.winnings[position.toString()] || ''}
                          onChange={(e) => updateWinnings(position.toString(), Number(e.target.value))}
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          placeholder="0"
                        />
                        <span className="text-sm text-white/60">{formData.token}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Screening Questions */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <DollarSign className="h-5 w-5" />
                Screening Questions
              </CardTitle>
              <CardDescription className="text-white/60">
                Add questions to screen participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newScreening.question}
                  onChange={(e) => setNewScreening(prev => ({ ...prev, question: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  placeholder="Enter screening question"
                />
                <div className="flex gap-2">
                  <Select value={newScreening.type} onValueChange={(value: any) => setNewScreening(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      <SelectItem value="text" className="text-white">Text</SelectItem>
                      <SelectItem value="url" className="text-white">URL</SelectItem>
                      <SelectItem value="file" className="text-white">File</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addScreening} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {formData.screening.map((question, index) => (
                  <div key={index} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white">{question.question}</div>
                        <div className="text-xs text-white/60 mt-1">
                          Type: {question.type} • {question.optional ? 'Optional' : 'Required'}
                        </div>
                      </div>
                      <button
                        onClick={() => removeScreening(index)}
                        className="ml-2 text-white/40 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
              <CardDescription className="text-white/60">
                Set submission deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="deadline" className="text-white/80">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Advanced Settings */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5" />
                Status & Visibility
              </CardTitle>
              <CardDescription className="text-white/60">
                Control bounty visibility and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white/80">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="OPEN" className="text-white">Open</SelectItem>
                    <SelectItem value="REVIEWING" className="text-white">Reviewing</SelectItem>
                    <SelectItem value="COMPLETED" className="text-white">Completed</SelectItem>
                    <SelectItem value="CLOSED" className="text-white">Closed</SelectItem>
                    <SelectItem value="CANCELLED" className="text-white">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white/80">Visibility</Label>
                <Select value={formData.visibility} onValueChange={(value: any) => handleInputChange('visibility', value)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="DRAFT" className="text-white">Draft (Private)</SelectItem>
                    <SelectItem value="PUBLISHED" className="text-white">Published (Public)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-sm text-white/60 mb-2">Current Status</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/80">Created:</span>
                    <span className="text-white">{new Date(bounty.createdAt).toLocaleDateString()}</span>
                  </div>
                  {bounty.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-white/80">Published:</span>
                      <span className="text-white">{new Date(bounty.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/80">Submissions:</span>
                    <span className="text-white">{bounty.submissionCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Resources
              </CardTitle>
              <CardDescription className="text-white/60">
                Add helpful resources for participants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    value={newResource.title}
                    onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="Resource title"
                  />
                  <Input
                    value={newResource.url}
                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="Resource URL"
                  />
                  <Input
                    value={newResource.description}
                    onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="Description (optional)"
                  />
                </div>
                <Button onClick={addResource} size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Resource
                </Button>
              </div>

              <div className="space-y-2">
                {formData.resources.map((resource, index) => (
                  <div key={index} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{resource.title}</div>
                        <div className="text-sm text-white/60 truncate">{resource.url}</div>
                        {resource.description && (
                          <div className="text-xs text-white/40 mt-1">{resource.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => removeResource(index)}
                        className="ml-2 text-white/40 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>


          {/* Danger Zone */}
          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
              Delete Bounty
              </CardTitle>
              <CardDescription className="text-red-400/60">
              This will permanently delete the bounty and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Bounty
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-red-400/80">
                        Are you sure? Type "DELETE" to confirm.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type DELETE to confirm"
                          className="bg-white/5 border-red-500/50 text-white placeholder:text-white/40"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value === 'DELETE') {
                              deleteBounty();
                            }
                          }}
                        />
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}