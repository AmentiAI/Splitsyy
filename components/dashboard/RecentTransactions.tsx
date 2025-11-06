"use client";

import React, { useState, useEffect } from "react";
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
import Link from "next/link";

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

const getCategoryIcon = (category: string) => {
  const categoryLower = category?.toLowerCase() || "";
  if (categoryLower.includes("grocery") || categoryLower.includes("food") || categoryLower.includes("dining")) {
    return ShoppingBag;
  }
  if (categoryLower.includes("coffee") || categoryLower.includes("restaurant")) {
    return Coffee;
  }
  if (categoryLower.includes("transport") || categoryLower.includes("gas") || categoryLower.includes("uber")) {
    return Car;
  }
  if (categoryLower.includes("housing") || categoryLower.includes("rent")) {
    return Home;
  }
  if (categoryLower.includes("income") || categoryLower.includes("salary") || categoryLower.includes("freelance")) {
    return ArrowDownLeft;
  }
  return CreditCard;
};

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/transactions?limit=6");
        if (response.ok) {
          const data = await response.json();
          const txns = (data.transactions || []).map((t: any) => {
            const Icon = getCategoryIcon(t.category);
            return {
              id: t.id,
              description: t.description || t.merchant_name || "Transaction",
              amount: t.amount || 0,
              type: t.type || (t.amount >= 0 ? "income" : "expense"),
              category: t.category || "Other",
              date: t.date || t.created_at || new Date().toISOString().split("T")[0],
              status: t.status || "completed",
              icon: Icon,
            };
          });
          setTransactions(txns);
        }
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Link href="/transactions">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No recent transactions</p>
          <p className="text-sm text-gray-400 mt-2">Transactions will appear here once you start using your cards</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = transaction.icon;
            return (
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
                    <Icon className="w-5 h-5" />
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
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}












