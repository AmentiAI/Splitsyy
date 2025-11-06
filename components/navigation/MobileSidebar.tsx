"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PiggyBank,
  BarChart3,
  Settings,
  X,
  Wallet,
  TrendingUp,
  Receipt,
  User,
  Bell,
  LogOut,
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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-black text-white transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full safe-area-inset">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-silver-800 min-h-[60px]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">Splitsy</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-silver-900 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-silver-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-silver-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-medium truncate">{user?.name || user?.email || "User"}</p>
                <p className="text-xs sm:text-sm text-silver-400 truncate">{user?.email || ""}</p>
              </div>
              <button 
                className="p-2 hover:bg-silver-900 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors group min-h-[48px]",
                      isActive
                        ? "bg-white text-black"
                        : "text-silver-300 hover:bg-silver-900 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0",
                      isActive ? "text-black" : "text-silver-400 group-hover:text-white"
                    )} />
                    <span className="text-sm sm:text-base font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              <h3 className="text-xs font-semibold text-silver-400 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={onClose}
                    className="flex items-center space-x-3 px-4 py-3 text-silver-300 hover:bg-silver-900 hover:text-white rounded-lg transition-colors group min-h-[48px]"
                  >
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-silver-400 group-hover:text-white" />
                    <span className="text-sm sm:text-base font-medium">{action.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-silver-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-silver-400 rounded-full"></div>
                <span className="text-xs text-silver-400">Online</span>
              </div>
              <span className="text-xs text-silver-400">v1.0.0</span>
            </div>
            <button className="flex items-center space-x-3 w-full px-4 py-3 text-silver-300 hover:bg-silver-900 hover:text-white rounded-lg transition-colors group min-h-[48px]">
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-silver-400 group-hover:text-white" />
              <span className="text-sm sm:text-base font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
