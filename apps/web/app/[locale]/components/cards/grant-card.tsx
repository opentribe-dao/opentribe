import { Card } from "@packages/base/components/ui/card";
import { Badge } from "@packages/base/components/ui/badge";
import { DollarSign, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GrantCardProps {
  id: string;
  title: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  bannerUrl?: string;
  minAmount?: number;
  maxAmount?: number;
  token: string;
  rfpCount: number;
  applicationCount: number;
  status: "OPEN" | "CLOSED";
  summary?: string;
  skills?: string[];
  createdAt?: string;
}

export function GrantCard({
  id,
  title,
  organization,
  minAmount,
  maxAmount,
  token,
  rfpCount,
  applicationCount,
  status,
  summary,
}: GrantCardProps) {
  const isOpen = status === "OPEN";

  return (
    <Link href={`/grants/${id}`}>
      <Card className='cursor-pointer border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10'>
        <div className='mb-4 flex items-start justify-between'>
          <div className="flex items-center gap-3">
            {organization.logo ? (
              <Image
                src={organization.logo}
                alt={organization.name}
                width={48}
                height={48}
                onError={(e) => {
                  console.log(
                    "Grant Card image failed to load:",
                    organization.logo,
                  );
                  e.currentTarget.style.display = "none";
                }}
                className="rounded-lg"
              />
            ) : (
              <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600'>
                <span className='font-bold text-lg text-white'>
                  {organization.name[0]}
                </span>
              </div>
            )}
            <div>
              <h3 className='font-semibold text-lg text-white'>{title}</h3>
              <p className="text-sm text-white/60">{organization.name}</p>
            </div>
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

        {summary && (
          <p className='mb-4 line-clamp-2 text-sm text-white/70'>{summary}</p>
        )}

        <div className="flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-4">
            {(minAmount || maxAmount) && (
              <span className="flex items-center gap-1">
                <DollarSign className='h-4 w-4' />
                {minAmount && maxAmount ? (
                  <>
                    {minAmount.toLocaleString()} - {maxAmount.toLocaleString()}{" "}
                    {token}
                  </>
                ) : (
                  <>
                    {(minAmount || maxAmount)?.toLocaleString()} {token}
                  </>
                )}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FileText className='h-4 w-4' />
              {rfpCount} RFPs
            </span>
          </div>
          <span className="text-pink-400">{applicationCount} applications</span>
        </div>
      </Card>
    </Link>
  );
}
