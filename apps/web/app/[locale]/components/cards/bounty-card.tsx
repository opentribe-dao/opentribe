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
    <Link href={`/bounties/${id}`} className='group block h-full'>
      <div className='flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10'>
        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div className='min-w-0 flex-1'>
            <h3 className='mb-2 line-clamp-2 font-heading font-semibold text-lg text-white transition-colors group-hover:text-pink-300'>
              {title || "Untitled Bounty"}
            </h3>
            <p className='mb-2 text-sm text-white/60'>{organizationName}</p>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block rounded-md border px-2 py-1 text-xs ${getStatusColor(
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
            <div className='ml-4 flex items-center gap-2'>
              <DollarSign className='h-4 w-4 text-green-400' />
              <div className="text-right">
                {safeAmount && (
                  <div className='font-semibold text-green-400 text-lg'>
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
          <div className='mb-4 flex flex-wrap gap-1'>
            {safeSkills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className='rounded-md bg-pink-500/20 px-2 py-1 text-pink-300 text-xs'
              >
                {skill}
              </span>
            ))}
            {safeSkills.length > 3 && (
              <span className='rounded-md bg-white/10 px-2 py-1 text-white/60 text-xs'>
                +{safeSkills.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className='flex items-center justify-between border-white/10 border-t pt-4 text-white/50 text-xs'>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className='h-3 w-3' />
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
                <Calendar className='h-3 w-3' />
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
