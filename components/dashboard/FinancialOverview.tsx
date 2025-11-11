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
  ArrowDownRight,
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
        const [cardsRes, groupsRes, transactionsRes, walletsRes] =
          await Promise.all([
            fetch("/api/cards").catch(() => null),
            fetch("/api/groups").catch(() => null),
            fetch("/api/transactions").catch(() => null),
            fetch("/api/wallets").catch(() => null),
          ]);

        const cards = cardsRes?.ok
          ? await cardsRes.json().then((d) => d.cards || [])
          : [];
        const groups = groupsRes?.ok
          ? await groupsRes.json().then((d) => d.groups || [])
          : [];
        const transactions = transactionsRes?.ok
          ? await transactionsRes.json().then((d) => d.transactions || [])
          : [];
        const accounts = walletsRes?.ok
          ? await walletsRes.json().then((d) => d.accounts || [])
          : [];

        // Calculate totals
        const totalBalance = accounts.reduce(
          (sum: number, acc: any) => sum + (acc.balance || 0),
          0
        );
        const activeCardsCount = cards.filter(
          (c: any) => c.status === "active"
        ).length;
        const activeGroupsCount = groups.filter(
          (g: any) => g.status === "active"
        ).length;

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
          .reduce(
            (sum: number, t: any) => Math.abs(sum + Math.abs(t.amount || 0)),
            0
          );

        // Calculate group payments
        const groupPayments = groups.reduce(
          (sum: number, g: any) => sum + (g.totalExpenses || 0),
          0
        );

        const data: OverviewCard[] = [
          {
            title: "Total Balance",
            value: `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: "neutral",
            icon: DollarSign,
            color: "bg-gradient-to-br from-brand-green-500 to-brand-blue-500",
          },
          {
            title: "Monthly Income",
            value: `$${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: monthlyIncome > 0 ? "positive" : "neutral",
            icon: TrendingUp,
            color: "bg-brand-green-500",
          },
          {
            title: "Monthly Expenses",
            value: `$${monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: monthlyExpenses > 0 ? "negative" : "neutral",
            icon: TrendingDown,
            color: "bg-brand-blue-500",
          },
          {
            title: "Active Cards",
            value: activeCardsCount.toString(),
            change: "",
            changeType: "neutral",
            icon: CreditCard,
            color: "bg-brand-green-400",
          },
          {
            title: "Active Groups",
            value: activeGroupsCount.toString(),
            change: "",
            changeType: "neutral",
            icon: Users,
            color: "bg-brand-blue-400",
          },
          {
            title: "Group Payments",
            value: `$${groupPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: "",
            changeType: "neutral",
            icon: PiggyBank,
            color: "bg-brand-green-500",
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
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="mb-2 h-4 w-24 rounded bg-brand-green-100"></div>
              <div className="mb-2 h-8 w-32 rounded bg-brand-blue-100"></div>
              <div className="h-4 w-16 rounded bg-brand-green-100"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {overviewData.map((item, index) => (
        <Card key={index} className="p-6 transition-shadow hover:shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-brand-blue-700/80">
                {item.title}
              </p>
              <p className="mb-2 text-2xl font-bold text-brand-midnight">
                {item.value}
              </p>
              {item.change && (
                <div className="flex items-center">
                  {item.changeType === "positive" && (
                    <ArrowUpRight className="mr-1 h-4 w-4 text-brand-green-600" />
                  )}
                  {item.changeType === "negative" && (
                    <ArrowDownRight className="mr-1 h-4 w-4 text-brand-blue-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      item.changeType === "positive"
                        ? "text-brand-green-600"
                        : item.changeType === "negative"
                          ? "text-brand-blue-600"
                          : "text-brand-blue-600"
                    }`}
                  >
                    {item.change}
                  </span>
                  {item.changeType !== "neutral" && (
                    <span className="ml-1 text-xs text-brand-blue-400">
                      vs last month
                    </span>
                  )}
                </div>
              )}
            </div>
            <div
              className={`h-12 w-12 ${item.color} flex items-center justify-center rounded-lg text-white`}
            >
              <item.icon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
