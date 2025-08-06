import { Card } from "@packages/base/components/ui/card";
import { Badge } from "@packages/base/components/ui/badge";
import { DollarSign, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GrantCardProps {
  id: string;
  title: string;
  organization: {
    name: string;
    logo?: string;
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
      <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {organization.logo ? (
              <Image
                src={organization.logo}
                alt={organization.name}
                width={48}
                height={48}
                className="rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">
                  {organization.name[0]}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-lg">{title}</h3>
              <p className="text-sm text-white/60">{organization.name}</p>
            </div>
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

        {summary && (
          <p className="text-sm text-white/70 mb-4 line-clamp-2">{summary}</p>
        )}

        <div className="flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-4">
            {(minAmount || maxAmount) && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
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
              <FileText className="w-4 h-4" />
              {rfpCount} RFPs
            </span>
          </div>
          <span className="text-pink-400">{applicationCount} applications</span>
        </div>
      </Card>
    </Link>
  );
}
