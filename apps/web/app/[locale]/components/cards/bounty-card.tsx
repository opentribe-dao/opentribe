import { Badge } from "@packages/base/components/ui/badge";
import { Calendar, DollarSign, Users, Clock, Award } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  const isOpen = status === "OPEN";

  if (variant === "list") {
    return (
      <Link href={`/en/bounties/${id}`}>
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            {/* Left section with org and title */}
            <div className="flex items-center gap-4 flex-1">
              {organization.logo ? (
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  width={48}
                  height={48}
                  className="rounded-full bg-white p-2"
                  onError={(e) => {
                    console.error('Bounty Card image failed to load:', organization.logo);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white font-heading">
                    {organization.name[0]}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-base text-white line-clamp-1">
                  {title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-white/60 ">
                    {organization.name}
                  </p>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-1 text-white/60 text-sm">
                    <Clock className="w-3 h-3" />
                    <span className="">1-3 Weeks</span>
                  </div>
                  <span className="text-white/40">•</span>
                  <span className="text-sm text-white/60 ">
                    {amount.toLocaleString()} {token}
                  </span>
                </div>
              </div>
            </div>

            {/* Right section with status */}
            <div
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-heading ml-4 ${
                isOpen
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/en/bounties/${id}`}>
      <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer">
        {/* Header with organization and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {organization.logo ? (
              <Image
                src={organization.logo}
                alt={organization.name}
                width={48}
                height={48}
                className="rounded-full bg-white p-2"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white font-heading">
                  {organization.name[0]}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-heading font-semibold text-lg text-white leading-tight">
                {title}
              </h3>
              <p className="text-sm text-white/60 ">
                {organization.name}
              </p>
            </div>
          </div>

          {/* Status and deadline */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Clock className="w-3 h-3" />
              <span className="font-heading">1-3 Weeks</span>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold font-heading ${
                isOpen
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {isOpen ? "OPEN" : "CLOSED"}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.slice(0, 6).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="border-white/30 bg-white/10 text-white/80 text-xs "
            >
              {skill}
            </Badge>
          ))}
          {skills.length > 6 && (
            <Badge
              variant="outline"
              className="border-white/30 bg-white/10 text-white/80 text-xs "
            >
              +{skills.length - 6} more
            </Badge>
          )}
        </div>

        {/* Bottom section with amount and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-white">
              <Award className="w-4 h-4 text-green-400" />
              <span className="font-heading font-bold text-base">
                {amount.toLocaleString()} {token}
              </span>
            </div>
            <div className="w-px h-4 bg-white/30" />
            <div className="flex items-center gap-1 text-white/60">
              <Users className="w-4 h-4" />
              <span className="text-sm ">
                {submissionCount} submissions
              </span>
            </div>
          </div>

          <div className="bg-green-500 hover:bg-green-600 transition-colors px-4 py-2 rounded-lg">
            <span className="font-heading font-bold text-sm text-white">
              Apply Now
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
