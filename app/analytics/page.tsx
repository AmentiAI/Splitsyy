"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  Eye,
  PieChart,
  Activity,
  Target,
  AlertCircle
} from "lucide-react";

interface AnalyticsData {
  period: string;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
}

const mockAnalyticsData: AnalyticsData[] = [
  { period: "Jan", income: 4200, expenses: 2850, savings: 1350, netWorth: 8500 },
  { period: "Feb", income: 4200, expenses: 3100, savings: 1100, netWorth: 9600 },
  { period: "Mar", income: 4200, expenses: 2950, savings: 1250, netWorth: 10850 },
  { period: "Apr", income: 4200, expenses: 3200, savings: 1000, netWorth: 11850 },
  { period: "May", income: 4200, expenses: 2800, savings: 1400, netWorth: 13250 },
  { period: "Jun", income: 4200, expenses: 3000, savings: 1200, netWorth: 14450 },
  { period: "Jul", income: 4200, expenses: 2750, savings: 1450, netWorth: 15900 },
  { period: "Aug", income: 4200, expenses: 2900, savings: 1300, netWorth: 17200 },
  { period: "Sep", income: 4200, expenses: 3150, savings: 1050, netWorth: 18250 },
  { period: "Oct", income: 4200, expenses: 2850, savings: 1350, netWorth: 19600 },
];

const categoryData = [
  { name: "Housing", amount: 1200, percentage: 42, color: "bg-blue-500" },
  { name: "Food & Dining", amount: 450, percentage: 16, color: "bg-green-500" },
  { name: "Transportation", amount: 300, percentage: 11, color: "bg-yellow-500" },
  { name: "Entertainment", amount: 250, percentage: 9, color: "bg-purple-500" },
  { name: "Shopping", amount: 200, percentage: 7, color: "bg-pink-500" },
  { name: "Healthcare", amount: 150, percentage: 5, color: "bg-red-500" },
  { name: "Other", amount: 300, percentage: 10, color: "bg-gray-500" },
];

const goalsData = [
  {
    name: "Emergency Fund",
    target: 10000,
    current: 8500,
    deadline: "2025-12-31",
    status: "on-track"
  },
  {
    name: "Vacation Fund",
    target: 3000,
    current: 2100,
    deadline: "2026-03-15",
    status: "on-track"
  },
  {
    name: "New Car",
    target: 25000,
    current: 8500,
    deadline: "2026-08-01",
    status: "behind"
  }
];

function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("netWorth");

  const currentData = mockAnalyticsData[mockAnalyticsData.length - 1];
  const previousData = mockAnalyticsData[mockAnalyticsData.length - 2];
  
  const incomeChange = ((currentData.income - previousData.income) / previousData.income) * 100;
  const expenseChange = ((currentData.expenses - previousData.expenses) / previousData.expenses) * 100;
  const savingsChange = ((currentData.savings - previousData.savings) / previousData.savings) * 100;
  const netWorthChange = ((currentData.netWorth - previousData.netWorth) / previousData.netWorth) * 100;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Track your financial progress and spending patterns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={[
                { value: "1month", label: "Last Month" },
                { value: "3months", label: "Last 3 Months" },
                { value: "6months", label: "Last 6 Months" },
                { value: "1year", label: "Last Year" }
              ]}
            />
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-green-600">${currentData.income.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {incomeChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${incomeChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(incomeChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">${currentData.expenses.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {expenseChange <= 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${expenseChange <= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(expenseChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-red-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Savings</p>
                <p className="text-2xl font-bold text-blue-600">${currentData.savings.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {savingsChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${savingsChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(savingsChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Worth</p>
                <p className="text-2xl font-bold text-purple-600">${currentData.netWorth.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {netWorthChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${netWorthChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(netWorthChange).toFixed(1)}%
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Trends */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Spending Trends</h2>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                options={[
                  { value: "netWorth", label: "Net Worth" },
                  { value: "income", label: "Income" },
                  { value: "expenses", label: "Expenses" },
                  { value: "savings", label: "Savings" }
                ]}
              />
            </div>
            
            <div className="space-y-4">
              {mockAnalyticsData.map((data, index) => {
                const value = data[selectedMetric as keyof AnalyticsData] as number;
                const maxValue = Math.max(...mockAnalyticsData.map(d => d[selectedMetric as keyof AnalyticsData] as number));
                const percentage = (value / maxValue) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{data.period}</span>
                      <span className="text-sm font-semibold text-gray-900">${value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Spending by Category */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Spending by Category</h2>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 ${category.color} rounded-full`}></div>
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        ${category.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 ${category.color} rounded-full transition-all duration-300`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Financial Goals */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Financial Goals</h2>
            <Button variant="outline" size="sm">
              <Target className="w-4 h-4 mr-2" />
              Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {goalsData.map((goal, index) => {
              const progress = (goal.current / goal.target) * 100;
              const isOnTrack = goal.status === "on-track";
              const isBehind = goal.status === "behind";
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isOnTrack ? "bg-green-100 text-green-800" : 
                      isBehind ? "bg-red-100 text-red-800" : 
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {goal.status.replace("-", " ")}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">
                        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOnTrack ? "bg-green-500" : 
                          isBehind ? "bg-red-500" : 
                          "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Target Date</span>
                      <span className="text-gray-900">{goal.deadline}</span>
                    </div>
                    
                    {isBehind && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Behind schedule
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function Analytics() {
  return (
    <AuthGuard>
      <AnalyticsPage />
    </AuthGuard>
  );
}


