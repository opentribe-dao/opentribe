import Link from "next/link";
import { Calendar, Users, DollarSign, Clock, Trophy } from "lucide-react";

interface BountyCardProps {
  id: string;
  title: string;
  organization: {
    name: string;
    logo?: string;
  };
  amount: number;
  token: string;
  deadline?: Date;
  submissionCount: number;
  skills: string[];
  status: "OPEN" | "CLOSED";
  variant?: "default" | "list";
  amountUSD?: number;
  description?: string;
  createdAt?: Date;
  winnersAnnouncedAt?: Date;
}

export function BountyCard({
  id,
  title,
  organization,
  amount,
  token,
  deadline,
  submissionCount,
  skills,
  status,
  variant = "default",
}: BountyCardProps) {
  // Ensure skills is always an array
  const safeSkills = Array.isArray(skills) ? skills : [];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-green-500/20 text-green-300 border-green-500/20";
      case "REVIEWING":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/20";
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-300 border-blue-500/20";
      case "CLOSED":
        return "bg-gray-500/20 text-gray-300 border-gray-500/20";
      case "CANCELLED":
        return "bg-red-500/20 text-red-300 border-red-500/20";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/20";
    }
  };

  const isDeadlineSoon = () => {
    if (!deadline) return false;
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays > 0;
    } catch {
      return false;
    }
  };

  const isExpired = () => {
    if (!deadline) return false;
    try {
      return new Date(deadline) < new Date();
    } catch {
      return false;
    }
  };

  const safeAmount =
    typeof amount === "number" && !isNaN(amount) ? amount : null;
  const safeSubmissionCount =
    typeof submissionCount === "number" ? submissionCount : 0;

  const organizationName =
    typeof organization === "object" && organization?.name
      ? organization.name
      : typeof organization === "string"
      ? organization
      : "Unknown Organization";

  return (
    <Link href={`/bounties/${id}`} className="block group h-full">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold font-heading text-white group-hover:text-pink-300 transition-colors line-clamp-2 mb-2">
              {title || "Untitled Bounty"}
            </h3>
            <p className="text-sm text-white/60 mb-2">{organizationName}</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2 py-1 text-xs rounded-md border ${getStatusColor(
                  status
                )}`}
              >
                {status ? status.toLowerCase().replace("_", " ") : "unknown"}
              </span>
              {/* {winnersAnnouncedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-md text-xs">
                  <Trophy className="w-3 h-3" />
                  Winners Announced
                </span>
              )} */}
            </div>
          </div>

          {/* Amount */}
          {safeAmount && (
            <div className="flex items-center gap-2 ml-4">
              <DollarSign className="w-4 h-4 text-green-400" />
              <div className="text-right">
                {safeAmount && (
                  <div className="text-lg font-semibold text-green-400">
                    {safeAmount.toLocaleString()} {token}
                  </div>
                )}
                {/* {safeAmountUSD && (
                  <div className="text-sm text-white/60">
                    ~${safeAmountUSD.toLocaleString()} USD
                  </div>
                )} */}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {/*<p className="text-white/70 text-sm line-clamp-3 mb-4 flex-grow">
          {description || "No description available"}
        </p>*/}

        {/* Skills */}
        {safeSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {safeSkills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded-md text-xs"
              >
                {skill}
              </span>
            ))}
            {safeSkills.length > 3 && (
              <span className="px-2 py-1 bg-white/10 text-white/60 rounded-md text-xs">
                +{safeSkills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-white/50 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{safeSubmissionCount} submissions</span>
            </div>
            {deadline && (
              <div
                className={`flex items-center gap-1 ${
                  isExpired()
                    ? "text-red-400"
                    : isDeadlineSoon()
                    ? "text-yellow-400"
                    : "text-white/50"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {/* <span>{isExpired() ? "Expired" : formatDate(deadline)}</span> */}
              </div>
            )}
          </div>
          {/* <span>{formatDate(createdAt)}</span> */}
        </div>
      </div>
    </Link>
  );
}
