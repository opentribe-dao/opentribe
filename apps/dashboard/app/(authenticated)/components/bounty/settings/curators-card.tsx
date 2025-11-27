"use client";

import { useActiveOrganization, useSession } from "@packages/auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@packages/base/components/ui/avatar";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { env } from "@/env";
import type { BountyDetails } from "@/hooks/use-bounty";
import { useBountyCurators } from "@/hooks/use-manage-bounty";

type CuratorsCardProps = {
  bounty: BountyDetails;
};

export function CuratorsCard({ bounty }: CuratorsCardProps) {
  const { data: activeOrg } = useActiveOrganization();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const {
    curators,
    isLoading: curatorsLoading,
    addCurator,
    isAdding,
    removeCurator,
    isRemoving,
  } = useBountyCurators(activeOrg?.id, bounty.id);

  // Fetch organization members
  const { data: membersData } = useQuery({
    queryKey: ["organization-members", activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) {
        return [];
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${activeOrg.id}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await res.json();
      return data.organization.members as Array<{
        id: string;
        userId: string;
        role: string;
        user: {
          id: string;
          name: string;
          email: string;
          image: string | null;
        };
      }>;
    },
    enabled: !!activeOrg?.id,
  });

  // Filter out members who are already curators
  const availableMembers =
    membersData?.filter(
      (member) => !curators?.some((c) => c.userId === member.userId)
    ) || [];

  const handleAddCurator = () => {
    if (!selectedMemberId) {
      return;
    }
    addCurator(selectedMemberId, {
      onSuccess: () => setSelectedMemberId(""),
    });
  };

  const { data: session } = useSession();
  
  const currentUserMember = membersData?.find(
    (m) => m.userId === session?.user?.id
  );

  const isOwnerOrAdmin =
    currentUserMember?.role === "owner" ||
    currentUserMember?.role === "admin" ||
    activeOrg?.membership?.role === "owner" ||
    activeOrg?.membership?.role === "admin";

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-medium text-lg text-white">
          <UserPlus className="h-5 w-5 text-blue-400" />
          Curators
        </CardTitle>
        <CardDescription className="text-white/60">
          Manage who can edit this bounty and receive applications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Curator Section - Only for Owner/Admin */}
        {isOwnerOrAdmin && (
          <div className="flex gap-2">
            <Select
              onValueChange={setSelectedMemberId}
              value={selectedMemberId}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Select a member to add" />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email} ({member.role})
                  </SelectItem>
                ))}
                {availableMembers.length === 0 && (
                  <SelectItem disabled value="no-members">
                    No available members
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!selectedMemberId || isAdding}
              onClick={handleAddCurator}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Curators List */}
        <div className="space-y-3">
          {curatorsLoading ? (
            <div className="text-center text-sm text-white/40">
              Loading curators...
            </div>
          ) : (
            <>
              {curators && curators.length > 0 ? (
                curators.map((curator) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3"
                    key={curator.id}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={curator.user.image || undefined} />
                        <AvatarFallback>
                          {curator.user.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-white">
                          {curator.user.name || curator.user.username}
                        </p>
                        <p className="text-white/40 text-xs">
                          {curator.user.email}
                        </p>
                      </div>
                    </div>
                    {isOwnerOrAdmin && (
                      <Button
                        className="text-white/40 hover:bg-white/5 hover:text-red-400"
                        disabled={isRemoving}
                        onClick={() => removeCurator(curator.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-white/40">
                  No curators assigned yet.
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
