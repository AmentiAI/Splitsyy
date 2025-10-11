"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
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
  icon: React.ComponentType<{ className?: string }>;
}

const recentTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salary Deposit",
    amount: 4200.00,
    type: "income",
    category: "Salary",
    date: "2025-10-09",
    status: "completed",
    icon: ArrowDownLeft,
  },
  {
    id: "2",
    description: "Grocery Store",
    amount: -125.50,
    type: "expense",
    category: "Groceries",
    date: "2025-10-08",
    status: "completed",
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
    icon: Coffee,
  },
  {
    id: "4",
    description: "Gas Station",
    amount: -45.20,
    type: "expense",
    category: "Transportation",
    date: "2025-10-07",
    status: "completed",
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
    icon: ArrowDownLeft,
  },
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

export default function RecentTransactions() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {recentTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                transaction.type === "income" 
                  ? "bg-green-100 text-green-600" 
                  : "bg-red-100 text-red-600"
              }`}>
                <transaction.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{transaction.description}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">{transaction.category}</p>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === "income" 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {transaction.type === "income" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{transaction.date}</p>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

