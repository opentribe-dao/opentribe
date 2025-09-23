import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@packages/base/components/ui/button";
import {
  Share2,
  MapPin,
  Building2,
  Clock,
  Mail,
  ExternalLink,
  MessageCircle,
  Heart,
} from "lucide-react";
import { env } from "@/env";
import { auth } from "@packages/auth/server";
import { headers } from "next/headers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

async function getGrant(id: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${apiUrl}/api/v1/grants/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.grant;
}

export default async function GrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grant = await getGrant(id);

  if (!grant) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate date range
  const getDateRange = () => {
    const start = new Date();
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    return {
      start: start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      end: end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  const dateRange = getDateRange();

  return (
    <div className="min-h-screen">
      {/* Glass Header Card */}
      <div className="relative overflow-hidden">
        <div className="container relative mx-auto px-6 py-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                {/* Organization Logo */}
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                  {grant.organization.logo ? (
                    <Image
                      src={grant.organization.logo}
                      alt={grant.organization.name}
                      fill
                      className="bg-white object-cover p-2"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-bold text-3xl">
                        {grant.organization.name[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grant Info */}
                <div>
                  <h1 className="mb-2 font-bold font-heading text-3xl">
                    {grant.title}
                  </h1>
                  <div className="flex items-center gap-4 text-white/60">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {grant.organization.industry?.[0] || "Technology"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {grant.organization.location || "Remote"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                {/* Application count badge */}
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                  <span className="font-medium text-sm">
                    {grant._count.applications} applications
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                {grant.source === "EXTERNAL" && grant.applicationUrl ? (
                  <a
                    href={grant.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="bg-pink-600 text-white hover:bg-pink-700"
                      disabled={grant.status !== "OPEN"}
                    >
                      Apply Externally
                    </Button>
                  </a>
                ) : (
                  <Link href={`/grants/${id}/apply`}>
                    <Button
                      className="bg-pink-600 text-white hover:bg-pink-700"
                      disabled={grant.status !== "OPEN"}
                    >
                      Apply Now
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* About Section */}
            <section>
              <h2 className="mb-4 font-bold font-heading text-2xl">
                About the {grant.title}
              </h2>
              <div className="prose prose-invert max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5 prose-headings:font-heading prose-code:text-pink-400 prose-li:text-white/80 prose-p:text-white/80 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {grant.description}
                </ReactMarkdown>
              </div>

              {grant.instructions && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-lg">
                    Application Requirements:
                  </h3>
                  <div className="space-y-2 text-white/80">
                    {grant.instructions
                      .split("\n")
                      .map((instruction: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-1 text-pink-400">•</span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Funding Details */}
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-3 font-semibold text-lg">
                  Funding is just the start
                </h3>
                <p className="text-white/70">
                  {grant.minAmount && grant.maxAmount ? (
                    <>
                      Grants range from {formatAmount(Number(grant.minAmount))}{" "}
                      to {formatAmount(Number(grant.maxAmount))} in{" "}
                      {grant.token || "DOT"} capital, designed to help teams
                      scale.
                    </>
                  ) : (
                    <>
                      Total funding available:{" "}
                      {formatAmount(Number(grant.totalFunds || 0))}{" "}
                      {grant.token || "DOT"}
                    </>
                  )}
                </p>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Grant Price Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-2 flex items-center gap-2 font-medium text-sm text-white/60">
                <span className="text-xl">💰</span> Grant Price
              </h3>
              <div className="font-bold font-heading text-2xl">
                {grant.minAmount && grant.maxAmount ? (
                  <>
                    {formatAmount(Number(grant.minAmount))} -{" "}
                    {formatAmount(Number(grant.maxAmount))}
                  </>
                ) : grant.minAmount ? (
                  <>From {formatAmount(Number(grant.minAmount))}</>
                ) : grant.maxAmount ? (
                  <>Up to {formatAmount(Number(grant.maxAmount))}</>
                ) : (
                  "Variable"
                )}
              </div>
              <p className="mt-1 text-sm text-white/50">
                {grant.token || "DOT"}
              </p>
            </div>

            {/* Grant Validity Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-3 flex items-center gap-2 font-medium text-sm text-white/60">
                <Clock className="h-4 w-4" /> Grant Validity
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Start Date</span>
                  <span className="font-medium">{dateRange.start}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">End Date</span>
                  <span className="font-medium">{dateRange.end}</span>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-3 font-medium text-sm text-white/60">
                Contact
              </h3>
              <div className="space-y-3">
                <a
                  href={`mailto:grants@${grant.organization.slug}.com`}
                  className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">
                    grants@{grant.organization.slug}.com
                  </span>
                </a>
                {grant.applicationUrl && (
                  <a
                    href={grant.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/80 transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">External Application</span>
                  </a>
                )}
              </div>
            </div>

            {/* Top RFPs Card */}
            {grant.rfps.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-medium text-sm text-white/60">
                  Top RFP's
                </h3>
                <div className="space-y-3">
                  {grant.rfps.map((rfp: any) => (
                    <Link
                      key={rfp.id}
                      href={`/rfps/${rfp.slug}`}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
                        <div>
                          <p className="line-clamp-1 font-medium text-sm">
                            {rfp.title}
                          </p>
                          <p className="text-white/50 text-xs">
                            {rfp.applicationCount} applications
                          </p>
                        </div>
                      </div>
                      <span className="text-pink-400 text-xs">View →</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Applicants */}
            {grant.applications.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 font-medium text-sm text-white/60">
                  Recent Applicants
                </h3>
                <div className="-space-x-2 flex">
                  {grant.applications.map((app: any, idx: number) => (
                    <div
                      key={idx}
                      className="h-10 w-10 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-br from-pink-500 to-purple-600"
                      title={`${app.applicant.firstName || ""} ${
                        app.applicant.lastName ||
                        app.applicant.username ||
                        "Anonymous"
                      }`}
                    >
                      {app.applicant.avatarUrl ? (
                        <Image
                          src={app.applicant.avatarUrl}
                          alt="Applicant"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-sm">
                          {(
                            app.applicant.firstName?.[0] ||
                            app.applicant.username?.[0] ||
                            "A"
                          ).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {grant._count.applications > 6 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white/10">
                      <span className="font-medium text-xs">
                        +{grant._count.applications - 6}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
