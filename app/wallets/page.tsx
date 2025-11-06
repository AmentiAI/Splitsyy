"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  Wallet,
  Plus,
  Eye,
  EyeOff,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Settings,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Building2,
  Smartphone
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "investment" | "credit";
  balance: number;
  currency: string;
  lastUpdated: string;
  status: "active" | "inactive" | "pending";
  institution: string;
  accountNumber: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}


const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "checking":
      return "bg-blue-100 text-blue-800";
    case "savings":
      return "bg-green-100 text-green-800";
    case "investment":
      return "bg-purple-100 text-purple-800";
    case "credit":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function WalletsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch("/api/wallets");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.accounts || []);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalAssets = accounts.filter(a => a.type !== "credit").reduce((sum, account) => sum + account.balance, 0);
  const totalDebt = Math.abs(accounts.filter(a => a.type === "credit").reduce((sum, account) => sum + account.balance, 0));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading accounts...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Wallets & Accounts</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Manage all your financial accounts in one place
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowBalances(!showBalances)}
            >
              {showBalances ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showBalances ? "Hide" : "Show"} Balances
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Worth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? `$${totalBalance.toLocaleString()}` : "••••••"}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? `$${totalAssets.toLocaleString()}` : "••••••"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? `$${totalDebt.toLocaleString()}` : "••••••"}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {accounts.filter(a => a.status === "active").length}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.length === 0 ? (
            <div className="col-span-full">
              <Card className="p-12">
                <div className="text-center">
                  <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accounts Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Connect your first account to start managing your finances.
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            accounts.map((account) => (
            <Card key={account.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 ${account.color} rounded-lg flex items-center justify-center`}>
                    <account.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.institution}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(account.status)}>
                    {account.status}
                  </Badge>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge className={getTypeColor(account.type)}>
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Number</span>
                  <span className="text-sm font-mono text-gray-900">{account.accountNumber}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Balance</span>
                  <span className={`text-lg font-bold ${
                    account.balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {showBalances ? (
                      `$${Math.abs(account.balance).toLocaleString()}`
                    ) : (
                      "••••••"
                    )}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-500">{account.lastUpdated}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          )))}
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <ArrowUpRight className="w-6 h-6 mb-2 text-blue-600" />
              <span className="font-medium">Transfer Money</span>
              <span className="text-sm text-gray-500">Move funds between accounts</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Plus className="w-6 h-6 mb-2 text-green-600" />
              <span className="font-medium">Add Account</span>
              <span className="text-sm text-gray-500">Connect a new bank account</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Smartphone className="w-6 h-6 mb-2 text-purple-600" />
              <span className="font-medium">Mobile Banking</span>
              <span className="text-sm text-gray-500">Access mobile banking</span>
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function Wallets() {
  return (
    <AuthGuard>
      <WalletsPage />
    </AuthGuard>
  );
}


