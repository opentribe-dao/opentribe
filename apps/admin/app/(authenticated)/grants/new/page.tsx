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
import { useCreateGrant } from "@/hooks/use-admin-grants";

export default function NewGrantPage() {
  const router = useRouter();
  const createGrant = useCreateGrant();
  const [form, setForm] = useState({
    title: "",
    description: "",
    organizationId: "",
    summary: "",
    token: "DOT",
    status: "OPEN",
    visibility: "DRAFT",
    source: "NATIVE",
    fundingSource: "SELF_FUNDED",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGrant.mutateAsync(form);
      router.push("/grants");
    } catch (error) {
      console.error("Failed to create grant:", error);
    }
  };

  return (
    <>
      <Header
        pages={[{ label: "Grants", href: "/grants" }]}
        page="Create Grant"
      >
        <div className="pr-4">
          <Link href="/grants">
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
            <CardTitle className="text-white">New Grant</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/60">Title *</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                    value={form.title}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Organization ID *</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, organizationId: e.target.value })
                    }
                    placeholder="Paste organization ID"
                    required
                    value={form.organizationId}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Token</Label>
                  <Input
                    className="border-white/10 bg-white/5 text-white"
                    onChange={(e) =>
                      setForm({ ...form, token: e.target.value })
                    }
                    value={form.token}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Status</Label>
                  <Select
                    onValueChange={(v) => setForm({ ...form, status: v })}
                    value={form.status}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="NATIVE">Native</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Funding Source</Label>
                  <Select
                    onValueChange={(v) =>
                      setForm({ ...form, fundingSource: v })
                    }
                    value={form.fundingSource}
                  >
                    <SelectTrigger className="border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELF_FUNDED">Self Funded</SelectItem>
                      <SelectItem value="TREASURY">Treasury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Summary</Label>
                <Textarea
                  className="min-h-[80px] border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, summary: e.target.value })
                  }
                  value={form.summary}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60">Description *</Label>
                <Textarea
                  className="min-h-[160px] border-white/10 bg-white/5 text-white"
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  value={form.description}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                  disabled={
                    createGrant.isPending ||
                    !form.title ||
                    !form.description ||
                    !form.organizationId
                  }
                  type="submit"
                >
                  {createGrant.isPending ? "Creating..." : "Create Grant"}
                </Button>
                <Link href="/grants">
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
