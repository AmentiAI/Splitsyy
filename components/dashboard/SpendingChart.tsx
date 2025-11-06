"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const categoryColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-gray-500",
];

export default function SpendingChart() {
  const [spendingData, setSpendingData] = useState<SpendingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpendingData() {
      try {
        const response = await fetch("/api/transactions");
        if (response.ok) {
          const data = await response.json();
          const transactions = data.transactions || [];
          
          // Get current month transactions
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthlyExpenses = transactions.filter((t: any) => {
            const txDate = new Date(t.date || t.created_at);
            return txDate >= firstDayOfMonth && (t.type === "expense" || (t.amount || 0) < 0);
          });

          // Group by category
          const categoryMap = new Map<string, number>();
          monthlyExpenses.forEach((t: any) => {
            const category = t.category || "Other";
            const amount = Math.abs(t.amount || 0);
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
          });

          // Calculate total
          const total = Array.from(categoryMap.values()).reduce((sum, amt) => sum + amt, 0);

          // Convert to array and calculate percentages
          const categories: SpendingCategory[] = Array.from(categoryMap.entries())
            .map(([category, amount], index) => ({
              category,
              amount,
              percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
              color: categoryColors[index % categoryColors.length],
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 7); // Show top 7 categories

          setSpendingData(categories);
        }
      } catch (error) {
        console.error("Failed to fetch spending data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSpendingData();
  }, []);

  const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (spendingData.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">No spending data available</p>
          <p className="text-sm text-gray-400 mt-2">Transactions will appear here once you make purchases</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
        <div className="text-sm text-gray-500">
          Total: ${totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
      
      <div className="space-y-4">
        {spendingData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 ${item.color} rounded-full transition-all duration-300`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">This month</span>
          <span className="font-semibold text-gray-900">
            ${totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
          </span>
        </div>
      </div>
    </Card>
  );
}












