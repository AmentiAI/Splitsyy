"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PiggyBank,
  BarChart3,
  Settings,
  Menu,
  X,
  Wallet,
  TrendingUp,
  Receipt,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Splits", href: "/splits", icon: PiggyBank },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Cards", href: "/cards", icon: CreditCard },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { name: "Add Money", href: "/add-money", icon: TrendingUp },
  { name: "Send Money", href: "/send", icon: CreditCard },
  { name: "Request Money", href: "/request", icon: Receipt },
  { name: "Create Group", href: "/groups/create", icon: Users },
  { name: "New Split", href: "/splits/create", icon: PiggyBank },
  { name: "Order Card", href: "/cards/create", icon: CreditCard },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-900 text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold">Splitsy</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Aidan M Wilson</p>
              <p className="text-xs text-gray-400 truncate">amentiaiserv@gmail.com</p>
            </div>
            <button className="p-1 hover:bg-gray-800 rounded">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="pt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors group"
                >
                  <action.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
            <span className="text-xs text-gray-400">v1.0.0</span>
          </div>
        )}
        <button className="flex items-center space-x-3 w-full px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors group">
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-white" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
