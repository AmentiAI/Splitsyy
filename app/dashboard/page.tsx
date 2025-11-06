"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import QuickActions from "@/components/dashboard/QuickActions";
import SpendingChart from "@/components/dashboard/SpendingChart";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth/hooks";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Welcome back, {user?.email?.split("@")[0]}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Here&apos;s your complete financial overview and recent activity.
          </p>
        </div>

        {/* Financial Overview Cards */}
        <FinancialOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Spending Chart */}
        <SpendingChart />
      </div>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}