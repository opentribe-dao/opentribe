import { Card } from "@packages/base/components/ui/card";
import { Badge } from "@packages/base/components/ui/badge";
import { ThumbsUp, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface RFPCardProps {
  id: string;
  title: string;
  grant: {
    title: string;
    organization: {
      name: string;
      logo?: string;
    };
  };
  voteCount: number;
  commentCount: number;
  status: "OPEN" | "CLOSED";
  description?: string;
  variant?: "default" | "list";
}

export function RFPCard({
  id,
  title,
  grant,
  voteCount,
  commentCount,
  status,
  description,
  variant = "default",
}: RFPCardProps) {
  const isOpen = status === "OPEN";

  if (variant === "list") {
    return (
      <Link href={`/en/rfps/${id}`}>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            {/* Grant Logo */}
            {grant.organization.logo ? (
              <Image
                src={grant.organization.logo}
                alt={grant.organization.name}
                width={48}
                height={48}
                className="rounded-full bg-white p-2"
                onError={(e) => {
                  console.error('RFP Card image failed to load:', grant.organization.logo);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white/80">
                  {grant.organization.name[0]}
                </span>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-white text-base line-clamp-1">{title}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                <span>{grant.organization.name}</span>
                <span className="text-white/40">•</span>
                <span>1 week</span>
              </div>
            </div>
            
            {/* Vote Count */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">{voteCount}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/en/rfps/${id}`}>
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer mb-4">
        <div className="flex items-start gap-4 mb-4">
          {grant.organization.logo ? (
            <Image
              src={grant.organization.logo}
              alt={grant.organization.name}
              width={56}
              height={56}
              className="rounded-full bg-white p-2"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">
                {grant.organization.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">{title}</h3>
            <p className="text-sm text-white/60 mb-2">
              {grant.title} • {grant.organization.name}
            </p>
            {description && (
              <p className="text-sm text-white/70 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={
              isOpen ? "bg-green-500/20 text-green-400 border-green-500/30" : ""
            }
          >
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {voteCount} upvotes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {commentCount} comments
          </span>
        </div>
      </Card>
    </Link>
  );
}
