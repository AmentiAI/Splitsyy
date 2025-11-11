"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/lib/hooks/useAdmin";
import { getCurrentUser } from "@/lib/auth/utils";
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
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
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
  { name: "Send Money", href: "/send", icon: ArrowUpRight },
  { name: "Request Money", href: "/request", icon: ArrowDownLeft },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );
  const { isAdmin } = useAdmin();

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData.user);
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }
    loadUser();
  }, []);

  // Build navigation items dynamically based on admin status
  const navigationItems: NavItem[] = [
    ...navigation,
    ...(isAdmin ? [{ name: "Admin", href: "/admin", icon: Shield }] : []),
  ];

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-brand-midnight text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-blue-900/40 p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <span className="text-sm font-bold text-black">S</span>
            </div>
            <span className="text-xl font-bold">Splitsy</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-2 transition-colors hover:bg-brand-blue-900/50"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="border-b border-brand-blue-900/40 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-400 to-brand-blue-500">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name || user?.email || "User"}
              </p>
              <p className="truncate text-xs text-brand-blue-200/80">
                {user?.email || ""}
              </p>
            </div>
            <button className="rounded p-1 hover:bg-brand-blue-900/50">
              <Bell className="h-4 w-4 text-brand-blue-100" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors",
                  isActive
                    ? "bg-white text-brand-blue-700 shadow-md shadow-brand-green-500/30"
                    : "text-brand-blue-100/70 hover:bg-brand-blue-900/60 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-brand-blue-700"
                      : "text-brand-blue-200 group-hover:text-white"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs">
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
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-blue-200/80">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group flex items-center space-x-3 rounded-lg px-3 py-2 text-brand-blue-100/80 transition-colors hover:bg-brand-blue-900/60 hover:text-white"
                >
                  <action.icon className="h-5 w-5 text-brand-green-300 group-hover:text-white" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-brand-blue-900/40 p-4">
        {!collapsed && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-brand-green-400"></div>
              <span className="text-xs text-brand-blue-200/80">Online</span>
            </div>
            <span className="text-xs text-brand-blue-200/80">v1.0.0</span>
          </div>
        )}
        <button className="group flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-brand-blue-100/80 transition-colors hover:bg-brand-blue-900/60 hover:text-white">
          <LogOut className="h-5 w-5 text-brand-blue-200 group-hover:text-white" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
