import Link from "next/link";
import { Calendar, Users, Clock } from "lucide-react";
import Image from "next/image";

interface BountyCardProps {
  id: string;
  title: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  amount: string;
  token: string;
  deadline: string | null;
  submissionCount: number;
  skills: string[];
  status: string;
  variant?: "default" | "list";
  amountUSD: number | null;
  description?: string;
  createdAt: string;
  winnersAnnouncedAt: string | null;
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
  createdAt,
  status,
}: BountyCardProps) {
  // Ensure skills is always an array
  const safeSkills = Array.isArray(skills) ? skills : [];

  const formatDate = (date: string) => {
    if (!date) return "No date";
    try {
      // Handle both Date objects and date strings
      const dateObj = new Date(date);

      // Check if the date is valid
      if (Number.isNaN(dateObj.getTime())) {
        return "Invalid date";
      }

      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const getDeadlineInfo = (deadline: Date | string | null | undefined) => {
    if (!deadline)
      return { timeRemaining: null, isExpired: false, isSoon: false };

    try {
      const deadlineDate =
        deadline instanceof Date ? deadline : new Date(deadline);
      const now = new Date();

      // Check if the date is valid
      if (Number.isNaN(deadlineDate.getTime())) {
        return { timeRemaining: null, isExpired: false, isSoon: false };
      }

      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If deadline has passed
      if (diffTime <= 0) {
        return { timeRemaining: "Expired", isExpired: true, isSoon: false };
      }

      // Check if deadline is soon (within 7 days)
      const isSoon = diffDays <= 7;

      // Calculate time remaining display
      const diffDaysFloor = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const diffMinutes = Math.floor(
        (diffTime % (1000 * 60 * 60)) / (1000 * 60)
      );

      let timeRemaining: string;
      if (diffDaysFloor > 0) {
        timeRemaining = `Due in ${diffDaysFloor} day${
          diffDaysFloor !== 1 ? "s" : ""
        }`;
      } else if (diffHours > 0) {
        timeRemaining = `Due in ${diffHours} hour${
          diffHours !== 1 ? "s" : ""
        } ${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
      } else if (diffMinutes > 0) {
        timeRemaining = `Due in ${diffMinutes} minute${
          diffMinutes !== 1 ? "s" : ""
        }`;
      } else {
        timeRemaining = "Due very soon";
      }

      return { timeRemaining, isExpired: false, isSoon };
    } catch {
      return { timeRemaining: null, isExpired: false, isSoon: false };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "";
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

  const safeAmount = Number(amount);
  const safeSubmissionCount =
    typeof submissionCount === "number" ? submissionCount : 0;

  const organizationName =
    typeof organization === "object" && organization?.name
      ? organization.name
      : typeof organization === "string"
      ? organization
      : "Unknown Organization";

  return (
    <Link href={`/bounties/${id}`} className="group block h-full">
      <div className='card-bg flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10'>
        {/* Header */}

        <div className="mb-2 flex items-start justify-between">
          <div className="relative mr-2 h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-pink-400 to-purple-500">
            {organization?.logo ? (
              <Image
                src={organization?.logo}
                alt={organization?.name}
                fill
                className="bg-black object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-bold text-3xl">
                  {organizationName[0]}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="mb-2 line-clamp-2 font-heading font-semibold text-lg text-white transition-colors group-hover:text-pink-300">
              {title || "Untitled Bounty"}
              <span className={` ml-1 pl-1 ${getStatusColor(status)}`}>
                {/* {status ? status.toLowerCase().replace("_", " ") : "unknown"} */}
                {status?.toUpperCase() === "OPEN" ? (
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                ) : status ? (
                  status.toLowerCase().replace("_", " ")
                ) : (
                  "unknown"
                )}
              </span>
            </h3>
            <p className="mb-2 text-sm text-white/60">{organizationName}</p>
            <div className="flex items-center gap-2">
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
            <div className="ml-4 flex items-center">
              {/* <DollarSign className="h-6 w-6 text-green-400" /> */}
              <div className="text-right">
                {safeAmount && (
                  <div className='font-semibold text-green-400 text-xl'>
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
          <div className="mb-4 flex flex-wrap gap-1">
            {safeSkills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="rounded-md bg-pink-500/20 px-2 py-1 text-pink-300 text-xs"
              >
                {skill}
              </span>
            ))}
            {safeSkills.length > 5 && (
              <span className="rounded-md bg-white/10 px-2 py-1 text-white/60 text-xs">
                +{safeSkills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-white/10 border-t pt-4 text-white/50 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{safeSubmissionCount} submissions</span>
            </div>
            {deadline &&
              (() => {
                const deadlineInfo = getDeadlineInfo(deadline);
                return (
                  <div
                    className={`flex items-center gap-1 ${
                      deadlineInfo.isExpired
                        ? "text-red-400"
                        : deadlineInfo.isSoon
                        ? "text-yellow-400"
                        : "text-white/50"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {deadlineInfo.timeRemaining || "Invalid deadline"}
                    </span>
                  </div>
                );
              })()}
          </div>
          {createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
