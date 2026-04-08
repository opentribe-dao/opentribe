"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Textarea } from "@packages/base/components/ui/textarea";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Header } from "../../components/header";
import { useCreateProfile } from "@/hooks/use-admin-profiles";

export default function NewProfilePage() {
  const router = useRouter();
  const createProfile = useCreateProfile();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    github: "",
    twitter: "",
    linkedin: "",
    website: "",
    bio: "",
    location: "",
    source: "MANUAL_ADMIN",
    contactable: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProfile.mutateAsync(form);
      router.push("/profiles");
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  };

  return (
    <>
      <Header
        pages={[{ label: "Ecosystem Profiles", href: "/profiles" }]}
        page="Create Profile"
      >
        <div className="pr-4">
          <Link href="/profiles">
            <Button size="sm" variant="outline">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </Header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="border-white/10 bg-white/5 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-white">New Ecosystem Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/60">Display Name *</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, displayName: e.target.value })
                    }
                    required
                    value={form.displayName}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Email</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    value={form.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">GitHub</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, github: e.target.value })
                    }
                    value={form.github}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Twitter</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, twitter: e.target.value })
                    }
                    value={form.twitter}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">LinkedIn</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, linkedin: e.target.value })
                    }
                    value={form.linkedin}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Website</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                    value={form.website}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Location</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    value={form.location}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Source</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, source: v })}
                    value={form.source}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL_ADMIN">Manual Admin</SelectItem>
                      <SelectItem value="W3F_GRANTS">W3F Grants</SelectItem>
                      <SelectItem value="POLKADOT_OPEN_SOURCE">
                        Open Source
                      </SelectItem>
                      <SelectItem value="FAST_GRANTS">Fast Grants</SelectItem>
                      <SelectItem value="ON_CHAIN_BOUNTY">
                        On-chain Bounty
                      </SelectItem>
                      <SelectItem value="HACKATHON">Hackathon</SelectItem>
                      <SelectItem value="PBA">PBA</SelectItem>
                      <SelectItem value="FELLOWSHIP">Fellowship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Bio</Label>
                <Textarea
                  className="min-h-[120px] border-white/10 bg-white/5 text-white"
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  value={form.bio}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  disabled={createProfile.isPending || !form.displayName}
                  type="submit"
                >
                  {createProfile.isPending
                    ? "Creating..."
                    : "Create Profile"}
                </Button>
                <Link href="/profiles">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
