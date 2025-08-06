"use client";

import { use } from "react";
import { useActiveOrganization, useSession } from "@packages/auth/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { Textarea } from "@packages/base/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/base/components/ui/tabs";
import { Alert, AlertDescription } from "@packages/base/components/ui/alert";
import { Badge } from "@packages/base/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@packages/base/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/base/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { ImageUpload } from "@packages/base";
import {
  Building2,
  Globe,
  Instagram,
  Loader2,
  Plus,
  Settings,
  Shield,
  Trash2,
  Twitter,
  Users,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { env } from "@/env";

interface OrganizationDetails {
  id: string;
  name: string;
  slug: string;
  email?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  shortDescription?: string;
  longDescription?: string;
  logo?: string;
  members: Array<{
    id: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationSettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    website: "",
    twitter: "",
    instagram: "",
    shortDescription: "",
    longDescription: "",
    logo: "",
  });

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${orgId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch organization");
        }

        const data = await response.json();
        setOrganization(data.organization);
        setFormData({
          name: data.organization.name || "",
          slug: data.organization.slug || "",
          email: data.organization.email || "",
          website: data.organization.website || "",
          twitter: data.organization.twitter || "",
          instagram: data.organization.instagram || "",
          shortDescription: data.organization.shortDescription || "",
          longDescription: data.organization.longDescription || "",
          logo: data.organization.logo || "",
        });
      } catch (error) {
        console.error("Error fetching organization:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgId, router]);

  const handleUpdateOrganization = async () => {
    if (!organization) return;

    try {
      setSaving(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update organization");
      }

      const data = await response.json();
      setOrganization(data.organization);
    } catch (error) {
      console.error("Error updating organization:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!organization || !inviteEmail) return;

    try {
      setInviting(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}/invitations`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      setInviteEmail("");
      setInviteRole("member");
      // TODO: Show success message
    } catch (error) {
      console.error("Error sending invitation:", error);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;

    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      // Refresh organization data
      const orgResponse = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}`,
        {
          credentials: "include",
        }
      );
      const data = await orgResponse.json();
      setOrganization(data.organization);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${organization?.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-500/20 text-purple-400";
      case "admin":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const userRole = organization?.members.find(
    (member) => member.user.id === session?.user?.id
  )?.role;

  const canEditOrganization = userRole === "owner" || userRole === "admin";
  const canManageMembers = userRole === "owner" || userRole === "admin";
  const canDeleteOrganization = userRole === "owner";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Organization Settings</h1>
        <p className="text-white/60">
          Manage your organization profile, team members, and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 border-white/20 mb-8">
          <TabsTrigger value="general" className="data-[state=active]:bg-white/20">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white/20">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Organization Profile</CardTitle>
              <CardDescription className="text-white/60">
                Update your organization's public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-4 block">Organization Logo</Label>
                <ImageUpload
                  currentImageUrl={formData.logo}
                  onImageChange={(url) =>
                    setFormData((prev) => ({ ...prev, logo: url || "" }))
                  }
                  uploadType="organization-logo"
                  entityId={organization.id}
                  variant="logo"
                  disabled={!canEditOrganization}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Organization Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-white">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-white/60">
                    opentribe.io/org/{formData.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Contact Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-white">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription" className="text-white">
                  Short Description
                </Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  disabled={!canEditOrganization}
                  className="bg-white/10 border-white/20 text-white min-h-[80px]"
                  placeholder="Brief description of your organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription" className="text-white">
                  Long Description
                </Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  disabled={!canEditOrganization}
                  className="bg-white/10 border-white/20 text-white min-h-[150px]"
                  placeholder="Detailed description of your organization"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-white">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter Handle
                    </div>
                  </Label>
                  <Input
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="@yourhandle"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-white">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram Handle
                    </div>
                  </Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    disabled={!canEditOrganization}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpdateOrganization}
                disabled={!canEditOrganization || saving}
                className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          {canManageMembers && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Invite Members</CardTitle>
                <CardDescription className="text-white/60">
                  Invite new members to join your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white flex-1"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleInviteMember}
                    disabled={!inviteEmail || inviting}
                    className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
                  >
                    {inviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white text-sm font-medium">Share invite link</p>
                    <p className="text-white/60 text-xs mt-1">
                      Anyone with this link can request to join your organization
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={handleCopyInviteLink}
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Current Members</CardTitle>
              <CardDescription className="text-white/60">
                {organization.members.length} member{organization.members.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white">Member</TableHead>
                    <TableHead className="text-white">Role</TableHead>
                    <TableHead className="text-white">Joined</TableHead>
                    {canManageMembers && <TableHead className="text-white">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.members.map((member) => (
                    <TableRow key={member.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.image} />
                            <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{member.user.name}</p>
                            <p className="text-white/60 text-sm">{member.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(member.role)} border-0`}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/60">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell>
                          {member.role !== "owner" && member.user.id !== session?.user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-white/60">
                Manage your organization's security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertDescription className="text-yellow-400">
                  Security settings are coming soon. We're working on features like two-factor
                  authentication, API keys, and audit logs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {canDeleteOrganization && (
            <Card className="bg-red-500/5 backdrop-blur-md border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-red-400/60">
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Delete Organization</h4>
                    <p className="text-white/60 text-sm mb-4">
                      Once you delete an organization, there is no going back. All data including
                      bounties, grants, and submissions will be permanently deleted.
                    </p>
                    <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
                      Delete Organization
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}