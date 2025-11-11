"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Users,
  UsersRound,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface Analytics {
  overview: {
    platform_enabled: boolean;
    total_users: number;
    admin_users: number;
    verified_users: number;
    total_groups: number;
    total_pools: number;
    total_cards: number;
    active_cards: number;
  };
  financial: {
    total_pool_value: number;
    total_pool_target: number;
    pool_completion_rate: number;
    completed_pools: number;
    total_contributions: number;
    successful_contributions: number;
    total_transaction_value: number;
  };
  activity: {
    total_transactions: number;
    total_contributions: number;
    recent_users_7d: number;
    recent_groups_7d: number;
    recent_transactions_7d: number;
  };
}

export default function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-1/2 rounded bg-brand-green-100"></div>
                <div className="h-8 rounded bg-brand-blue-100"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="py-8 text-center text-brand-blue-500">
        Failed to load analytics
      </div>
    );
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics.overview.total_users.toLocaleString(),
      icon: Users,
      color: "text-brand-green-700",
      bgColor: "bg-brand-green-100",
    },
    {
      title: "Admin Users",
      value: analytics.overview.admin_users.toLocaleString(),
      icon: UsersRound,
      color: "text-brand-blue-700",
      bgColor: "bg-brand-blue-100",
    },
    {
      title: "Total Groups",
      value: analytics.overview.total_groups.toLocaleString(),
      icon: Users,
      color: "text-brand-blue-700",
      bgColor: "bg-brand-blue-100",
    },
    {
      title: "Active Cards",
      value: `${analytics.overview.active_cards}/${analytics.overview.total_cards}`,
      icon: CreditCard,
      color: "text-white",
      bgColor: "bg-brand-blue-500",
    },
    {
      title: "Total Pool Value",
      value: formatCurrency(analytics.financial.total_pool_value),
      icon: DollarSign,
      color: "text-white",
      bgColor: "bg-brand-green-500",
    },
    {
      title: "Transaction Value",
      value: formatCurrency(analytics.financial.total_transaction_value),
      icon: TrendingUp,
      color: "text-white",
      bgColor: "bg-gradient-to-br from-brand-green-500 to-brand-blue-500",
    },
    {
      title: "Pool Completion",
      value: `${analytics.financial.pool_completion_rate.toFixed(1)}%`,
      icon: Activity,
      color: "text-brand-green-700",
      bgColor: "bg-brand-green-100",
    },
    {
      title: "Recent Activity (7d)",
      value:
        analytics.activity.recent_users_7d +
        analytics.activity.recent_groups_7d,
      icon: Activity,
      color: "text-white",
      bgColor: "bg-brand-blue-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hoverable>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-blue-700/80">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-brand-midnight">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`${stat.bgColor} ${stat.color} rounded-lg p-3`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">Total Contributions</span>
                <span className="font-semibold text-brand-midnight">
                  {formatCurrency(analytics.financial.total_contributions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">
                  Successful Contributions
                </span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.financial.successful_contributions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">Completed Pools</span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.financial.completed_pools}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">Total Transactions</span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.activity.total_transactions}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">New Users</span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.activity.recent_users_7d}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">New Groups</span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.activity.recent_groups_7d}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">Transactions</span>
                <span className="font-semibold text-brand-midnight">
                  {analytics.activity.recent_transactions_7d}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-blue-600">Platform Status</span>
                <span
                  className={`font-semibold ${
                    analytics.overview.platform_enabled
                      ? "text-brand-green-600"
                      : "text-brand-blue-500"
                  }`}
                >
                  {analytics.overview.platform_enabled
                    ? "Operational"
                    : "Disabled"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
