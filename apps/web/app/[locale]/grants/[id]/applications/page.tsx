import { Badge } from "@packages/base/components/ui/badge";
import {
  clampDescription,
  clampTitle,
  createDetailMetadata,
} from "@packages/seo/meta";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  DollarSign,
  FileText,
  User,
} from "lucide-react";
import { env } from "@/env";

type Props = {
  params: Promise<{ id: string }>;
};

interface ApplicationListItem {
  id: string;
  title: string;
  status: string;
  budget?: number | null;
  milestoneCount?: number;
  completedMilestones?: number;
  submittedAt?: string | null;
  createdAt: string;
  applicant?: {
    id?: string | null;
    name?: string;
    username?: string;
    image?: string | null;
    slug?: string;
  } | null;
  ecosystemProfile?: {
    id: string;
    slug: string;
    displayName: string;
    image?: string | null;
  } | null;
}

interface GrantApplicationsData {
  grant: {
    id: string;
    title: string;
    slug: string;
    token?: string | null;
    organization: {
      name: string;
      logo?: string | null;
    };
  };
  applications: ApplicationListItem[];
  total: number;
}

async function getGrantApplications(
  id: string
): Promise<GrantApplicationsData | null> {
  try {
    // Fetch applications
    const appsRes = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}/applications`,
      { next: { revalidate: 300 }, cache: "force-cache" }
    );
    if (!appsRes.ok) return null;
    const appsData = await appsRes.json();

    // Fetch grant info separately (the applications API doesn't include it)
    const grantRes = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${id}`,
      { next: { revalidate: 300 }, cache: "force-cache" }
    );
    const grantData = grantRes.ok ? await grantRes.json() : null;

    return {
      grant: grantData
        ? {
            id: grantData.id,
            title: grantData.title,
            slug: grantData.slug || id,
            token: grantData.token,
            organization: grantData.organization || { name: "Unknown" },
          }
        : { id, title: "Grant", slug: id, organization: { name: "Unknown" } },
      applications: appsData.applications || appsData || [],
      total: appsData.total || (appsData.applications || appsData || []).length,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getGrantApplications(id);

  const grantTitle = data?.grant?.title ?? "Grant";
  const title = clampTitle(`Applications for ${grantTitle}`);
  const description = clampDescription(
    `View all applications for ${grantTitle} on Opentribe. ${data?.total || 0} applications submitted.`
  );

  return createDetailMetadata({
    title,
    description,
    path: `/grants/${id}/applications`,
  });
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-500/20 text-green-400 border-0";
    case "SUBMITTED":
      return "bg-blue-500/20 text-blue-400 border-0";
    case "UNDER_REVIEW":
      return "bg-yellow-500/20 text-yellow-400 border-0";
    case "REJECTED":
      return "bg-red-500/20 text-red-400 border-0";
    case "WITHDRAWN":
      return "bg-gray-500/20 text-gray-400 border-0";
    default:
      return "bg-white/10 text-white/60 border-0";
  }
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default async function GrantApplicationsPage({ params }: Props) {
  const { id } = await params;
  const data = await getGrantApplications(id);

  if (!data) {
    notFound();
  }

  const { grant, applications, total } = data;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-sm text-white/50">
            <Link
              className="hover:text-white/80"
              href={`/grants/${grant.slug || id}`}
            >
              {grant.title || "Grant"}
            </Link>
            <span>/</span>
            <span>Applications</span>
          </div>
          <h1 className="mb-3 font-bold font-heading text-3xl text-white">
            Applications
          </h1>
          <p className="text-white/60">
            {total} application{total !== 1 ? "s" : ""} for{" "}
            <Link
              className="text-[#E6007A] hover:underline"
              href={`/grants/${grant.slug || grant.id}`}
            >
              {grant.title}
            </Link>
            {grant.organization && (
              <span className="text-white/40">
                {" "}
                by {grant.organization.name}
              </span>
            )}
          </p>
        </div>

        {/* Applications List */}
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => {
              const applicantName =
                app.applicant?.name ||
                app.applicant?.username ||
                app.ecosystemProfile?.displayName ||
                "Anonymous";
              const applicantSlug =
                app.applicant?.username ||
                app.applicant?.slug ||
                app.ecosystemProfile?.slug;
              const applicantImage =
                app.applicant?.image || app.ecosystemProfile?.image;

              return (
                <div
                  className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                  key={app.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left Content */}
                    <div className="flex items-start gap-4">
                      {/* Applicant Avatar */}
                      <div className="flex-shrink-0">
                        {applicantImage ? (
                          <img
                            alt={applicantName}
                            className="h-10 w-10 rounded-full"
                            height={40}
                            src={applicantImage}
                            width={40}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-sm text-white">
                            {applicantName[0]?.toUpperCase() || "A"}
                          </div>
                        )}
                      </div>

                      {/* Application Details */}
                      <div className="min-w-0 flex-1">
                        <Link
                          className="block"
                          href={`/grants/${grant.slug || grant.id}/applications/${app.id}`}
                        >
                          <h3 className="mb-1 font-semibold text-white hover:text-[#E6007A]">
                            {app.title}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
                          {/* Applicant Link */}
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {applicantSlug ? (
                              <Link
                                className="text-[#E6007A] hover:underline"
                                href={`/profile/${applicantSlug}`}
                              >
                                {applicantName}
                              </Link>
                            ) : (
                              <span>{applicantName}</span>
                            )}
                          </span>

                          {/* Budget */}
                          {app.budget != null && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {new Intl.NumberFormat("en-US").format(
                                Number(app.budget)
                              )}{" "}
                              {grant.token || "DOT"}
                            </span>
                          )}

                          {/* Milestones */}
                          {app.milestoneCount != null &&
                            app.milestoneCount > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5" />
                                {app.completedMilestones || 0}/
                                {app.milestoneCount} milestones
                              </span>
                            )}

                          {/* Date */}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(app.submittedAt || app.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right - Status Badge */}
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(app.status)}>
                        {formatStatus(app.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-white/30" />
            <h3 className="mb-2 font-semibold text-lg text-white">
              No applications yet
            </h3>
            <p className="mb-4 text-white/60">
              Be the first to apply for this grant.
            </p>
            <Link
              className="inline-flex items-center rounded-lg bg-[#E6007A] px-6 py-2 font-medium text-white hover:bg-[#FF1493]"
              href={`/grants/${grant.slug || grant.id}/apply`}
            >
              Apply Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
