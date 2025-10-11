"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  Users,
  PiggyBank,
  TrendingUp,
  Receipt,
  Plus
} from "lucide-react";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  href: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Send Money",
    description: "Transfer to friends",
    icon: ArrowUpRight,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    href: "/send",
  },
  {
    title: "Request Money",
    description: "Ask for payments",
    icon: ArrowDownLeft,
    color: "text-green-600",
    bgColor: "bg-green-100",
    href: "/request",
  },
  {
    title: "Add Money",
    description: "Top up your wallet",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    href: "/add-money",
  },
  {
    title: "Create Group",
    description: "Start group payments",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    href: "/groups/create",
  },
  {
    title: "New Split",
    description: "Create shared fund",
    icon: PiggyBank,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    href: "/splits/create",
  },
  {
    title: "Order Card",
    description: "Get virtual card",
    icon: CreditCard,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    href: "/cards/create",
  },
];

export default function QuickActions() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          More
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-auto p-4 flex flex-col items-start text-left hover:bg-gray-50"
            onClick={() => window.location.href = action.href}
          >
            <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mb-3`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">{action.title}</p>
              <p className="text-sm text-gray-500">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}
