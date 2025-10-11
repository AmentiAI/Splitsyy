"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const spendingData: SpendingCategory[] = [
  { category: "Housing", amount: 1200, percentage: 42, color: "bg-blue-500" },
  { category: "Food & Dining", amount: 450, percentage: 16, color: "bg-green-500" },
  { category: "Transportation", amount: 300, percentage: 11, color: "bg-yellow-500" },
  { category: "Entertainment", amount: 250, percentage: 9, color: "bg-purple-500" },
  { category: "Shopping", amount: 200, percentage: 7, color: "bg-pink-500" },
  { category: "Healthcare", amount: 150, percentage: 5, color: "bg-red-500" },
  { category: "Other", amount: 300, percentage: 10, color: "bg-gray-500" },
];

export default function SpendingChart() {
  const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
        <div className="text-sm text-gray-500">
          Total: ${totalSpending.toLocaleString()}
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
                  ${item.amount.toLocaleString()}
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
            ${totalSpending.toLocaleString()} spent
          </span>
        </div>
      </div>
    </Card>
  );
}

