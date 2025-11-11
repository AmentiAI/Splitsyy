"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PoolCard } from "@/components/pools/PoolCard";
import { formatDate, getRoleColor } from "@/lib/utils/format";

interface GroupDetails {
  group: {
    id: string;
    name: string;
    currency: string;
    ownerId: string;
    createdAt: string;
    userRole: string;
  };
  members: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    spendCap?: number;
  }>;
  pools: Array<{
    id: string;
    targetAmount: number;
    status: string;
    designatedPayer?: string;
    createdAt: string;
  }>;
}

function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params?.id as string;

  const [details, setDetails] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/groups/${groupId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load group");
        }

        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load group");
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  if (loading) {
    return <LoadingPage text="Loading group details..." />;
  }

  if (error || !details) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <Alert variant="error" title="Error Loading Group">
              {error || "Group not found"}
            </Alert>
            <Button
              onClick={() => router.push("/dashboard")}
              className="mt-4"
              fullWidth
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnerOrAdmin =
    details.group.userRole === "owner" || details.group.userRole === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {details.group.name}
              </h1>
              <p className="mt-2 text-gray-600">
                Created {formatDate(details.group.createdAt)} •{" "}
                {details.group.currency}
              </p>
            </div>
            <Badge variant={getRoleColor(details.group.userRole) as any}>
              Your Role: {details.group.userRole}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Members Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Members ({details.members.length})</CardTitle>
                <CardDescription>Group participants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {details.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-600">{member.email}</p>
                      </div>
                      <Badge
                        variant={getRoleColor(member.role) as any}
                        size="sm"
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              {isOwnerOrAdmin && (
                <CardFooter>
                  <Button size="sm" fullWidth variant="outline">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Member
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Pools Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Pools ({details.pools.length})
              </h2>
              {isOwnerOrAdmin && (
                <Button>
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Pool
                </Button>
              )}
            </div>

            {details.pools.length > 0 ? (
              <div className="space-y-4">
                {details.pools.map((pool) => (
                  <PoolCard
                    key={pool.id}
                    pool={{
                      id: pool.id,
                      groupName: details.group.name,
                      currency: details.group.currency,
                      targetAmount: pool.targetAmount,
                      status: pool.status,
                      createdAt: pool.createdAt,
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12">
                  <EmptyState
                    icon={
                      <svg
                        className="h-16 w-16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                    title="No pools yet"
                    description="Create a pool to start collecting contributions from group members."
                    actionLabel={
                      isOwnerOrAdmin ? "Create First Pool" : undefined
                    }
                    onAction={isOwnerOrAdmin ? () => {} : undefined}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GroupPage() {
  return (
    <AuthGuard>
      <GroupDetailsPage />
    </AuthGuard>
  );
}
