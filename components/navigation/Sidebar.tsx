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
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
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
    <div className={cn(
      "flex flex-col h-screen bg-black text-white transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-silver-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold">Splitsy</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-silver-900 rounded-lg transition-colors"
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
        <div className="p-4 border-b border-silver-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-silver-300 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.email || "User"}</p>
              <p className="text-xs text-silver-400 truncate">{user?.email || ""}</p>
            </div>
            <button className="p-1 hover:bg-silver-900 rounded">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive
                    ? "bg-white text-black"
                    : "text-silver-300 hover:bg-silver-900 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-black" : "text-silver-400 group-hover:text-white"
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
            <h3 className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex items-center space-x-3 px-3 py-2 text-silver-300 hover:bg-silver-900 hover:text-white rounded-lg transition-colors group"
                >
                  <action.icon className="w-5 h-5 text-silver-400 group-hover:text-white" />
                  <span className="text-sm font-medium">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-silver-800">
        {!collapsed && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-silver-400 rounded-full"></div>
              <span className="text-xs text-silver-400">Online</span>
            </div>
            <span className="text-xs text-silver-400">v1.0.0</span>
          </div>
        )}
        <button className="flex items-center space-x-3 w-full px-3 py-2 text-silver-300 hover:bg-silver-900 hover:text-white rounded-lg transition-colors group">
          <LogOut className="w-5 h-5 text-silver-400 group-hover:text-white" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
