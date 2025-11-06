"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAdmin } from "@/lib/hooks/useAdmin";
import KillSwitch from "@/components/admin/KillSwitch";
import UserManagement from "@/components/admin/UserManagement";
import AnalyticsOverview from "@/components/admin/AnalyticsOverview";
import AuditLogsViewer from "@/components/admin/AuditLogsViewer";
import TransactionsViewer from "@/components/admin/TransactionsViewer";
import VerificationViewer from "@/components/admin/VerificationViewer";
import { useState } from "react";
import { Shield, Users, BarChart3, FileText, Power, Receipt, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function AdminDashboard() {
  const { isAdmin, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState<"overview" | "killswitch" | "users" | "transactions" | "verification" | "logs">(
    "overview"
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking admin access...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You do not have permission to access the admin panel. Platform administrator
                privileges are required.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "killswitch", label: "Kill Switch", icon: Power },
    { id: "users", label: "Users", icon: Users },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "verification", label: "Verification", icon: UserCheck },
    { id: "logs", label: "Audit Logs", icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Platform administration, monitoring, and control center
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "overview" && <AnalyticsOverview />}
          {activeTab === "killswitch" && <KillSwitch />}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "transactions" && <TransactionsViewer />}
          {activeTab === "verification" && <VerificationViewer />}
          {activeTab === "logs" && <AuditLogsViewer />}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  );
}

