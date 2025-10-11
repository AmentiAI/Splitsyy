"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  PiggyBank,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface OverviewCard {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const overviewData: OverviewCard[] = [
  {
    title: "Total Balance",
    value: "$12,450.00",
    change: "+12.5%",
    changeType: "positive",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    title: "Monthly Income",
    value: "$4,200.00",
    change: "+8.2%",
    changeType: "positive",
    icon: TrendingUp,
    color: "bg-blue-500",
  },
  {
    title: "Monthly Expenses",
    value: "$2,850.00",
    change: "-3.1%",
    changeType: "negative",
    icon: TrendingDown,
    color: "bg-red-500",
  },
  {
    title: "Active Cards",
    value: "3",
    change: "1 new",
    changeType: "neutral",
    icon: CreditCard,
    color: "bg-purple-500",
  },
  {
    title: "Savings Goal",
    value: "$8,500.00",
    change: "68%",
    changeType: "positive",
    icon: PiggyBank,
    color: "bg-yellow-500",
  },
  {
    title: "Group Payments",
    value: "$1,250.00",
    change: "2 pending",
    changeType: "neutral",
    icon: Users,
    color: "bg-indigo-500",
  },
];

export default function FinancialOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {overviewData.map((item, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{item.title}</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">{item.value}</p>
              <div className="flex items-center">
                {item.changeType === "positive" && (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                )}
                {item.changeType === "negative" && (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    item.changeType === "positive"
                      ? "text-green-600"
                      : item.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {item.change}
                </span>
                {item.changeType !== "neutral" && (
                  <span className="text-xs text-gray-500 ml-1">vs last month</span>
                )}
              </div>
            </div>
            <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

