"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatRelativeTime, getStatusVariant } from "@/lib/utils/format";

interface Contribution {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface ContributionsListProps {
  contributions: Contribution[];
  currency: string;
}

export function ContributionsList({
  contributions,
  currency,
}: ContributionsListProps) {
  if (contributions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            }
            title="No contributions yet"
            description="Be the first to contribute to this pool!"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contributions ({contributions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{contribution.userName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600 capitalize">
                    {contribution.method}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-600">
                    {formatRelativeTime(contribution.createdAt)}
                  </span>
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(contribution.amount, currency)}
                  </p>
                  <Badge
                    variant={getStatusVariant(contribution.status)}
                    size="sm"
                    className="mt-1"
                  >
                    {contribution.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Total Contributed:
            </span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(
                contributions
                  .filter((c) => c.status === "succeeded")
                  .reduce((sum, c) => sum + c.amount, 0),
                currency
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}














