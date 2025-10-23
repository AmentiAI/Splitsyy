"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  Search, 
  Filter, 
  Download, 
  Plus,
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  MoreHorizontal
} from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  status: "completed" | "pending" | "failed";
  account: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salary Deposit",
    amount: 4200.00,
    type: "income",
    category: "Salary",
    date: "2025-10-09",
    status: "completed",
    account: "Main Account",
    icon: ArrowDownLeft,
  },
  {
    id: "2",
    description: "Grocery Store - Whole Foods",
    amount: -125.50,
    type: "expense",
    category: "Groceries",
    date: "2025-10-08",
    status: "completed",
    account: "Main Account",
    icon: ShoppingBag,
  },
  {
    id: "3",
    description: "Coffee Shop",
    amount: -8.75,
    type: "expense",
    category: "Food & Dining",
    date: "2025-10-08",
    status: "completed",
    account: "Main Account",
    icon: Coffee,
  },
  {
    id: "4",
    description: "Gas Station - Shell",
    amount: -45.20,
    type: "expense",
    category: "Transportation",
    date: "2025-10-07",
    status: "completed",
    account: "Main Account",
    icon: Car,
  },
  {
    id: "5",
    description: "Rent Payment",
    amount: -1200.00,
    type: "expense",
    category: "Housing",
    date: "2025-10-05",
    status: "pending",
    account: "Main Account",
    icon: Home,
  },
  {
    id: "6",
    description: "Freelance Payment",
    amount: 850.00,
    type: "income",
    category: "Freelance",
    date: "2025-10-04",
    status: "completed",
    account: "Main Account",
    icon: ArrowDownLeft,
  },
  {
    id: "7",
    description: "Online Shopping - Amazon",
    amount: -89.99,
    type: "expense",
    category: "Shopping",
    date: "2025-10-03",
    status: "completed",
    account: "Main Account",
    icon: ShoppingBag,
  },
  {
    id: "8",
    description: "Restaurant - Italian Bistro",
    amount: -67.50,
    type: "expense",
    category: "Food & Dining",
    date: "2025-10-02",
    status: "completed",
    account: "Main Account",
    icon: Coffee,
  },
  {
    id: "9",
    description: "Uber Ride",
    amount: -23.45,
    type: "expense",
    category: "Transportation",
    date: "2025-10-01",
    status: "completed",
    account: "Main Account",
    icon: Car,
  },
  {
    id: "10",
    description: "Investment Dividend",
    amount: 125.00,
    type: "income",
    category: "Investment",
    date: "2025-09-30",
    status: "completed",
    account: "Investment Account",
    icon: ArrowDownLeft,
  },
];

const categories = [
  "All Categories",
  "Salary",
  "Freelance",
  "Investment",
  "Groceries",
  "Food & Dining",
  "Transportation",
  "Housing",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Other",
];

const accounts = [
  "All Accounts",
  "Main Account",
  "Investment Account",
  "Savings Account",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedAccount, setSelectedAccount] = useState("All Accounts");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  const filteredTransactions = mockTransactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || transaction.category === selectedCategory;
    const matchesAccount = selectedAccount === "All Accounts" || transaction.account === selectedAccount;
    const matchesStatus = selectedStatus === "All Status" || transaction.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesAccount && matchesStatus;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              View and manage all your financial transactions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Amount</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totalIncome - totalExpenses).toFixed(2)}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${totalIncome - totalExpenses >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <CreditCard className={`w-5 h-5 ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categories.map(cat => ({ value: cat, label: cat }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                options={accounts.map(acc => ({ value: acc, label: acc }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: "All Status", label: "All Status" },
                  { value: "completed", label: "Completed" },
                  { value: "pending", label: "Pending" },
                  { value: "failed", label: "Failed" }
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions ({filteredTransactions.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    transaction.type === "income" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    <transaction.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{transaction.category}</p>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm text-gray-500">{transaction.account}</p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === "income" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                  <button className="p-2 hover:bg-gray-200 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No transactions found matching your criteria.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function Transactions() {
  return (
    <AuthGuard>
      <TransactionsPage />
    </AuthGuard>
  );
}

