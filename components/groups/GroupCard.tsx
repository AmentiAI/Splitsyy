"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getRoleColor } from "@/lib/utils/format";
import Link from "next/link";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    currency: string;
    ownerId: string;
    createdAt: string;
    userRole: string;
    userSpendCap?: number;
  };
  onClick?: () => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  const content = (
    <Card variant="elevated" hoverable className="transition-all hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              Created {formatDate(group.createdAt)} • {group.currency}
            </CardDescription>
          </div>
          <Badge variant={getRoleColor(group.userRole) as any} size="sm">
            {group.userRole}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Your Role:</span>
          <span className="font-medium text-gray-900 capitalize">
            {group.userRole}
          </span>
        </div>
        
        {group.userSpendCap && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Spend Cap:</span>
            <span className="font-medium text-gray-900">
              {group.currency} {(group.userSpendCap / 100).toFixed(2)}
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
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
      </CardContent>
    </Card>
  );

  if (onClick) {
    return <div onClick={onClick} className="cursor-pointer">{content}</div>;
  }

  return <Link href={`/groups/${group.id}`}>{content}</Link>;
}













