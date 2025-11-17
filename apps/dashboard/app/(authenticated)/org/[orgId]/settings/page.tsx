"use client";

import { authClient, useSession } from "@packages/auth/client";
import { ImageUpload } from "@packages/base";
import { Alert, AlertDescription } from "@packages/base/components/ui/alert";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@packages/base/components/ui/avatar";
import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@packages/base/components/ui/dropdown-menu";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@packages/base/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import { Textarea } from "@packages/base/components/ui/textarea";
import {
  Copy,
  Linkedin,
  Loader2,
  MapPin,
  MoreVertical,
  Settings,
  Shield,
  Trash2,
  Twitter,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { env } from "@/env";

const ORGANIZATION_TYPES = [
  { value: "protocol", label: "Protocol" },
  { value: "dao", label: "DAO" },
  { value: "company", label: "Company" },
  { value: "foundation", label: "Foundation" },
  { value: "community", label: "Community" },
  { value: "other", label: "Other" },
];

const INDUSTRIES = [
  { value: "defi", label: "DeFi" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "gaming", label: "Gaming" },
  { value: "nft", label: "NFT" },
  { value: "social", label: "Social" },
  { value: "governance", label: "Governance" },
  { value: "tooling", label: "Developer Tooling" },
  { value: "other", label: "Other" },
];

const LOCATION_PRESETS = [
  "Berlin, Germany",
  "Bengaluru, India",
  "San Francisco, United States",
  "Remote-first",
];

const getOrganizationTypeFromMetadata = (metadata?: string | undefined) => {
  if (!metadata) {
    return;
  }
  try {
    const parsed = JSON.parse(metadata);
    if (parsed && typeof parsed.type === "string") {
      return parsed.type;
    }
  } catch {
    // Ignore malformed metadata
  }
  return;
};

type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  email?: string;
  websiteUrl?: string;
  twitter?: string;
  linkedin?: string;
  description?: string;
  logo?: string;
  location?: string;
  industry?: string[];
  metadata?: string | null;
  members: Array<{
    id: string;
    role: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
};

type PendingInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
};

export default function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  // const { data: activeOrg } = useActiveOrganization();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [copiedInvitationId, setCopiedInvitationId] = useState<string | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: "",
    websiteUrl: "",
    twitter: "",
    linkedin: "",
    description: "",
    logo: "",
    location: "",
    type: "",
    industry: "",
  });

  // Zod schema for validating email input
  const inviteEmailSchema = z.email();
  const isValidEmail = (email: string) =>
    inviteEmailSchema.safeParse(email).success;

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgId) {
        return;
      }

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
          name: data.organization.name || undefined,
          slug: data.organization.slug || undefined,
          email: data.organization.email || undefined,
          websiteUrl: data.organization.websiteUrl || undefined,
          twitter: data.organization.twitter || undefined,
          linkedin: data.organization.linkedin || undefined,
          description: data.organization.description || undefined,
          logo: data.organization.logo || undefined,
          location: data.organization.location || undefined,
          type: getOrganizationTypeFromMetadata(data.organization.metadata),
          industry: data.organization.industry?.[0] || undefined,
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
    if (!organization) {
      return;
    }

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
        toast.error("Failed to update organization");
        throw new Error("Failed to update organization");
      }

      const data = await response.json();
      setOrganization(data.organization);
      toast.success("Organization updated");
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("An unexpected error occurred while updating");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!(organization && inviteEmail)) {
      return;
    }
    if (!isValidEmail(inviteEmail)) {
      setInviteError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setInviting(true);
      setInviteError(null);
      setInviteSuccess(false);

      // Check if user is already a member
      const existingMember = organization.members.find(
        (member) =>
          member.user.email.toLowerCase() === inviteEmail.toLowerCase()
      );

      if (existingMember) {
        setInviteError("This user is already a member of your organization.");
        toast.error("This user is already a member of your organization.");
        setInviting(false);
        return;
      }

      // Check if user has a pending invitation
      const pendingInvitation = pendingInvitations.find(
        (invitation) =>
          invitation.email.toLowerCase() === inviteEmail.toLowerCase()
      );

      if (pendingInvitation) {
        setInviteError(
          `An invitation has already been sent to ${inviteEmail}. You can copy the invitation link from the Pending Invitations section below.`
        );
        toast.error(`An invitation has already been sent to ${inviteEmail}.`);
        setInviting(false);
        return;
      }

      const { data, error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole as "member" | "admin",
        organizationId: organization.id,
        resend: true,
      });

      if (error) {
        // Handle specific error cases
        let errorMessage = error.message || "Failed to send invitation";

        // Check for unique constraint violation or already invited
        if (
          errorMessage.includes("unique") ||
          errorMessage.includes("already") ||
          errorMessage.includes("P2002")
        ) {
          errorMessage = "An invitation has already been sent to this email.";
        }

        setInviteError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (data) {
        setInviteSuccess(true);
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        setInviteRole("member");
        // Refresh pending invitations
        fetchPendingInvitations();
        // Hide success message after 5 seconds
        setTimeout(() => setInviteSuccess(false), 5000);
      }
    } catch (_error) {
      setInviteError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) {
      return;
    }

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}/members/${memberId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error("Failed to remove member");
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
      toast.success("Member removed");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("An unexpected error occurred while removing member");
    }
  };

  const fetchPendingInvitations = async () => {
    if (!organization) {
      return;
    }

    try {
      setLoadingInvitations(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}/invitations`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pending invitations");
      }

      const data = await response.json();
      setPendingInvitations(data.invitations || []);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!organization) {
      return;
    }

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organization.id}/invitations`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to delete invitation");
        return;
      }

      toast.success("Invitation deleted");
      fetchPendingInvitations();
    } catch (_error) {
      toast.error("An unexpected error occurred while deleting invitation");
    }
  };

  const handleCopyInvitationLink = async (invitationId: string) => {
    const inviteLink = `${env.NEXT_PUBLIC_WEB_URL}/org-invite?token=${invitationId}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedInvitationId(invitationId);
      toast.success("Invitation link copied");
      setTimeout(() => setCopiedInvitationId(null), 2000);
    } catch (_error) {
      toast.error("Failed to copy link");
    }
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
      <div className="flex min-h-screen items-center justify-center">
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
        <h1 className="mb-2 font-bold text-3xl text-white">
          Organization Settings
        </h1>
        <p className="text-white/60">
          Manage your organization profile, team members, and preferences
        </p>
      </div>

      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-8 border-white/20 bg-white/10">
          <TabsTrigger
            className="data-[state=active]:bg-white/20"
            value="general"
          >
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:bg-white/20"
            value="members"
          >
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger
            className="data-[state=active]:bg-white/20"
            value="security"
          >
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="general">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Organization Profile</CardTitle>
              <CardDescription className="text-white/60">
                Update your organization's public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-4 block text-white">
                  Organization Logo
                </Label>
                <ImageUpload
                  currentImageUrl={formData.logo}
                  disabled={!canEditOrganization}
                  entityId={organization.id}
                  onImageChange={(url) =>
                    setFormData((prev) => ({ ...prev, logo: url || "" }))
                  }
                  uploadType="organization-logo"
                  variant="logo"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white" htmlFor="name">
                    Organization Name
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="name"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    value={formData.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white" htmlFor="slug">
                    URL Slug
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="slug"
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    value={formData.slug}
                  />
                  <p className="text-white/60 text-xs">
                    opentribe.io/org/{formData.slug}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white" htmlFor="email">
                    Contact Email
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    type="email"
                    value={formData.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white" htmlFor="websiteUrl">
                    Website
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="websiteUrl"
                    onChange={(e) =>
                      setFormData({ ...formData, websiteUrl: e.target.value })
                    }
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white" htmlFor="description">
                  Description
                </Label>
                <Textarea
                  className="min-h-[80px] border-white/20 bg-white/10 text-white"
                  disabled={!canEditOrganization}
                  id="description"
                  maxLength={1000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of your organization"
                  rows={4}
                  value={formData.description}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white">Type</Label>
                  <Select
                    disabled={!canEditOrganization}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type: value }))
                    }
                    value={formData.type}
                  >
                    <SelectTrigger className="border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="border-white/20 bg-zinc-900 text-white">
                      {ORGANIZATION_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Industry</Label>
                  <Select
                    disabled={!canEditOrganization}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, industry: value }))
                    }
                    value={formData.industry}
                  >
                    <SelectTrigger className="border-white/20 bg-white/10 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="border-white/20 bg-zinc-900 text-white">
                      {INDUSTRIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <OrganizationLocationField
                disabled={!canEditOrganization}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, location: value }))
                }
                value={formData.location}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white" htmlFor="twitter">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      Twitter Handle
                    </div>
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="twitter"
                    onChange={(e) =>
                      setFormData({ ...formData, twitter: e.target.value })
                    }
                    placeholder="@yourhandle"
                    value={formData.twitter}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white" htmlFor="instagram">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4" />
                      LinkedIn Handle
                    </div>
                  </Label>
                  <Input
                    className="border-white/20 bg-white/10 text-white"
                    disabled={!canEditOrganization}
                    id="instagram"
                    onChange={(e) =>
                      setFormData({ ...formData, linkedin: e.target.value })
                    }
                    placeholder="your-linkedin-handle"
                    value={formData.linkedin}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                disabled={!canEditOrganization || saving}
                onClick={handleUpdateOrganization}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="members">
          {canManageMembers && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Invite Members</CardTitle>
                <CardDescription className="text-white/60">
                  Invite new members to join your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inviteSuccess && (
                  <Alert className="border-green-500/20 bg-green-500/10">
                    <AlertDescription className="text-green-400">
                      Invitation sent successfully! The user will receive an
                      email with instructions to join your organization.
                    </AlertDescription>
                  </Alert>
                )}

                {inviteError && (
                  <Alert className="border-red-500/20 bg-red-500/10">
                    <AlertDescription className="text-red-400">
                      {inviteError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4">
                  <Input
                    aria-invalid={!!inviteEmail && !isValidEmail(inviteEmail)}
                    className={`flex-1 border-white/20 bg-white/10 text-white ${
                      inviteEmail && !isValidEmail(inviteEmail)
                        ? "border-red-500/50 focus-visible:ring-red-500/60"
                        : ""
                    }`}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    type="email"
                    value={inviteEmail}
                  />
                  <Select onValueChange={setInviteRole} value={inviteRole}>
                    <SelectTrigger className="w-[180px] border-white/20 bg-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                    disabled={
                      !(inviteEmail && isValidEmail(inviteEmail)) || inviting
                    }
                    onClick={handleInviteMember}
                  >
                    {inviting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Current Members</CardTitle>
              <CardDescription className="text-white/60">
                {organization.members.length} member
                {organization.members.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "40%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-left align-middle text-white">
                      Member
                    </TableHead>
                    <TableHead className="text-left align-middle text-white" />
                    <TableHead className="text-center align-middle text-white">
                      Role
                    </TableHead>
                    <TableHead className="text-center align-middle text-white">
                      Joined
                    </TableHead>
                    {canManageMembers && (
                      <TableHead className="text-center align-middle text-white">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.members.map((member) => (
                    <TableRow className="border-white/10" key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.user.image} />
                            <AvatarFallback>
                              {member.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">
                              {member.user.name}
                            </p>
                            <p className="text-sm text-white/60">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle" />
                      <TableCell className="whitespace-nowrap text-center align-middle">
                        <Badge
                          className={`${getRoleBadgeColor(
                            member.role
                          )} border-0 px-2 py-0.5 text-xs`}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center align-middle text-white/60">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      {canManageMembers && (
                        <TableCell className="whitespace-nowrap text-center align-middle">
                          {member.role !== "owner" &&
                          member.user.id !== session?.user?.id ? (
                            <Button
                              className="whitespace-nowrap px-3 py-1.5 text-red-400 text-xs hover:bg-red-500/20 md:text-sm"
                              onClick={() => handleRemoveMember(member.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-white/40">-</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {canManageMembers &&
            (loadingInvitations || pendingInvitations.length > 0) && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">
                    Pending Invitations
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {pendingInvitations.length} pending invitation
                    {pendingInvitations.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#E6007A]" />
                    </div>
                  ) : (
                    <Table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <TableHeader>
                        <TableRow className="border-white/10">
                          <TableHead className="text-left align-middle text-white">
                            Email
                          </TableHead>
                          <TableHead className="text-left align-middle text-white">
                            Invited By
                          </TableHead>
                          <TableHead className="text-center align-middle text-white">
                            Role
                          </TableHead>
                          <TableHead className="text-center align-middle text-white">
                            Expires
                          </TableHead>
                          <TableHead className="text-center align-middle text-white">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingInvitations.map((invitation) => (
                          <TableRow
                            className="border-white/10"
                            key={invitation.id}
                          >
                            <TableCell className="align-middle">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {invitation.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-white">
                                    {invitation.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-left align-middle text-white/60">
                              {invitation.inviter.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-center align-middle">
                              <Badge
                                className={`${getRoleBadgeColor(
                                  invitation.role
                                )} border-0 px-2 py-0.5 text-xs`}
                              >
                                {invitation.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-center align-middle text-white/60">
                              {new Date(
                                invitation.expiresAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-center align-middle">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className="text-white hover:bg-white/10"
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44"
                                >
                                  <DropdownMenuItem
                                    className="gap-2"
                                    onClick={() =>
                                      handleCopyInvitationLink(invitation.id)
                                    }
                                  >
                                    <Copy className="h-4 w-4" />
                                    <span>
                                      {copiedInvitationId === invitation.id
                                        ? "Copied!"
                                        : "Copy link"}
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 text-red-500 focus:text-red-500"
                                    onClick={() =>
                                      handleDeleteInvitation(invitation.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete invite</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent className="space-y-6" value="security">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-white/60">
                Manage your organization's security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <AlertDescription className="text-yellow-400">
                  Security settings are coming soon. We're working on features
                  like two-factor authentication, API keys, and audit logs.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {canDeleteOrganization && (
            <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-red-400/60">
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium text-white">
                      Delete Organization
                    </h4>
                    <p className="mb-4 text-sm text-white/60">
                      Once you delete an organization, there is no going back.
                      All data including bounties, grants, and submissions will
                      be permanently deleted.
                    </p>
                    <Button
                      className="bg-red-500 hover:bg-red-600"
                      variant="destructive"
                    >
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

type LocationFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function OrganizationLocationField({
  value,
  onChange,
  disabled,
}: LocationFieldProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-white">Location</p>
          <p className="text-sm text-white/60">
            Share your primary operating city so builders know where you’re
            based.
          </p>
        </div>
        <Badge
          className="border-white/15 bg-transparent text-white/70"
          variant="outline"
        >
          Recommended
        </Badge>
      </div>

      <div className="relative">
        <MapPin className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 h-4 w-4 text-white/50" />
        <Input
          className="border-white/20 bg-white/10 pl-11 text-white placeholder:text-white/40"
          disabled={disabled}
          id="organizationLocation"
          onChange={(e) => onChange(e.target.value)}
          placeholder="City, Country"
          value={value}
        />
      </div>
      <p className="mt-2 text-white/50 text-xs">
        Format: City, Country. Add “Remote-first” if you don’t have a single
        hub.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {LOCATION_PRESETS.map((preset) => (
          <button
            className="rounded-full border border-white/15 px-3 py-1 text-white/70 text-xs transition-colors hover:border-[#E6007A] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            key={preset}
            onClick={() => onChange(preset)}
            type="button"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
