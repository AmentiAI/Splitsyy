"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency, formatDate, getStatusVariant } from "@/lib/utils/format";
import Link from "next/link";

interface PoolCardProps {
  pool: {
    id: string;
    groupName: string;
    currency: string;
    targetAmount: number;
    totalContributed?: number;
    status: string;
    createdAt: string;
  };
  showProgress?: boolean;
}

export function PoolCard({ pool, showProgress = true }: PoolCardProps) {
  const contributed = pool.totalContributed || 0;
  const target = pool.targetAmount;
  const percentage = (contributed / target) * 100;
  const remaining = target - contributed;

  return (
    <Link href={`/pools/${pool.id}`}>
      <Card variant="elevated" hoverable className="transition-all hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{pool.groupName}</CardTitle>
              <CardDescription>Created {formatDate(pool.createdAt)}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(pool.status)} size="sm">
              {pool.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Target Amount</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(target, pool.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Contributed</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(contributed, pool.currency)}
                </p>
              </div>
            </div>

            {showProgress && (
              <>
                <ProgressBar
                  value={contributed}
                  max={target}
                  showPercentage
                  size="md"
                />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(remaining, pool.currency)}
                  </span>
                </div>
              </>
            )}

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center text-sm text-blue-600 font-medium">
                View Details
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}











