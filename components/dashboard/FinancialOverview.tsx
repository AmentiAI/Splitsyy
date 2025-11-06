"use client";

import React, { useState, useEffect } from "react";
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

export default function FinancialOverview() {
  const [overviewData, setOverviewData] = useState<OverviewCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        // Fetch cards, groups, transactions, and wallets data
        const [cardsRes, groupsRes, transactionsRes, walletsRes] = await Promise.all([
          fetch("/api/cards").catch(() => null),
          fetch("/api/groups").catch(() => null),
          fetch("/api/transactions").catch(() => null),
          fetch("/api/wallets").catch(() => null),
        ]);

        const cards = cardsRes?.ok ? await cardsRes.json().then(d => d.cards || []) : [];
        const groups = groupsRes?.ok ? await groupsRes.json().then(d => d.groups || []) : [];
        const transactions = transactionsRes?.ok ? await transactionsRes.json().then(d => d.transactions || []) : [];
        const accounts = walletsRes?.ok ? await walletsRes.json().then(d => d.accounts || []) : [];

        // Calculate totals
        const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
        const activeCardsCount = cards.filter((c: any) => c.status === "active").length;
        const activeGroupsCount = groups.filter((g: any) => g.status === "active").length;
        
        // Calculate monthly income/expenses
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTransactions = transactions.filter((t: any) => {
          const txDate = new Date(t.date || t.created_at);
          return txDate >= firstDayOfMonth;
        });
        
        const monthlyIncome = monthlyTransactions
          .filter((t: any) => t.type === "income")
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        const monthlyExpenses = monthlyTransactions
          .filter((t: any) => t.type === "expense")
          .reduce((sum: number, t: any) => Math.abs(sum + Math.abs(t.amount || 0)), 0);

        // Calculate group payments
        const groupPayments = groups.reduce((sum: number, g: any) => sum + (g.totalExpenses || 0), 0);

        const data: OverviewCard[] = [
          {
            title: "Total Balance",
            value: `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: "neutral",
            icon: DollarSign,
            color: "bg-silver-500",
          },
          {
            title: "Monthly Income",
            value: `$${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: monthlyIncome > 0 ? "positive" : "neutral",
            icon: TrendingUp,
            color: "bg-black",
          },
          {
            title: "Monthly Expenses",
            value: `$${monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: monthlyExpenses > 0 ? "negative" : "neutral",
            icon: TrendingDown,
            color: "bg-silver-600",
          },
          {
            title: "Active Cards",
            value: activeCardsCount.toString(),
            change: "",
            changeType: "neutral",
            icon: CreditCard,
            color: "bg-silver-400",
          },
          {
            title: "Active Groups",
            value: activeGroupsCount.toString(),
            change: "",
            changeType: "neutral",
            icon: Users,
            color: "bg-silver-300",
          },
          {
            title: "Group Payments",
            value: `$${groupPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: "neutral",
            icon: PiggyBank,
            color: "bg-silver-500",
          },
        ];

        setOverviewData(data);
      } catch (error) {
        console.error("Failed to fetch overview data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-silver-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-silver-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-silver-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {overviewData.map((item, index) => (
        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-silver-600 mb-1">{item.title}</p>
              <p className="text-2xl font-bold text-black mb-2">{item.value}</p>
              {item.change && (
                <div className="flex items-center">
                  {item.changeType === "positive" && (
                    <ArrowUpRight className="w-4 h-4 text-black mr-1" />
                  )}
                  {item.changeType === "negative" && (
                    <ArrowDownRight className="w-4 h-4 text-silver-600 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      item.changeType === "positive"
                        ? "text-black"
                        : item.changeType === "negative"
                        ? "text-silver-600"
                        : "text-silver-600"
                    }`}
                  >
                    {item.change}
                  </span>
                  {item.changeType !== "neutral" && (
                    <span className="text-xs text-silver-500 ml-1">vs last month</span>
                  )}
                </div>
              )}
            </div>
            <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color === 'bg-black' ? 'text-white' : 'text-black'}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}












