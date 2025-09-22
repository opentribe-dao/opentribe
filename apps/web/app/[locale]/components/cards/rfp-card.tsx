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
        <div className='cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10'>
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
                  console.log(
                    "RFP Card image failed to load:",
                    grant.organization.logo,
                  );
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-purple-500/20 to-blue-600/20'>
                <span className='font-bold text-sm text-white/80'>
                  {grant.organization.name[0]}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              <h3 className='line-clamp-1 font-semibold text-base text-white'>
                {title}
              </h3>
              <div className='mt-1 flex items-center gap-3 text-sm text-white/60'>
                <span>{grant.organization.name}</span>
                <span className="text-white/40">•</span>
                <span>1 week</span>
              </div>
            </div>

            {/* Vote Count */}
            <div className='flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5'>
              <ThumbsUp className='h-4 w-4 text-green-400' />
              <span className='font-medium text-sm text-white'>
                {voteCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/en/rfps/${id}`}>
      <Card className='mb-4 cursor-pointer border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10'>
        <div className='mb-4 flex items-start gap-4'>
          {grant.organization.logo ? (
            <Image
              src={grant.organization.logo}
              alt={grant.organization.name}
              width={56}
              height={56}
              className="rounded-full bg-white p-2"
            />
          ) : (
            <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-600'>
              <span className='font-bold text-lg text-white'>
                {grant.organization.name[0]}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className='mb-1 font-semibold text-lg text-white'>{title}</h3>
            <p className='mb-2 text-sm text-white/60'>
              {grant.title} • {grant.organization.name}
            </p>
            {description && (
              <p className='line-clamp-2 text-sm text-white/70'>
                {description}
              </p>
            )}
          </div>
          <Badge
            variant={isOpen ? "default" : "secondary"}
            className={
              isOpen ? 'border-green-500/30 bg-green-500/20 text-green-400' : ""
            }
          >
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <ThumbsUp className='h-4 w-4' />
            {voteCount} upvotes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className='h-4 w-4' />
            {commentCount} comments
          </span>
        </div>
      </Card>
    </Link>
  );
}
