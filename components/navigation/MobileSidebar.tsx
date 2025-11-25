"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser, signOut } from "@/lib/auth/utils";
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
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(
    null
  );

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

  const handleSignOut = async () => {
    try {
      onClose(); // Close the mobile sidebar first
      await signOut();
      router.push("/auth/login");
      router.refresh(); // Refresh to clear any cached state
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, try to redirect
      router.push("/auth/login");
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-brand-midnight text-white transition-transform duration-300 ease-in-out sm:w-80 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="safe-area-inset flex h-full flex-col">
          {/* Header */}
          <div className="flex min-h-[60px] items-center justify-between border-b border-brand-blue-900/40 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <span className="text-sm font-bold text-black">S</span>
              </div>
              <span className="text-xl font-bold">Splitsy</span>
            </div>
            <button
              onClick={onClose}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors hover:bg-brand-blue-900/60"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="border-b border-brand-blue-900/40 p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-green-400 to-brand-blue-500 sm:h-12 sm:w-12">
                <User className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium sm:text-base">
                  {user?.name || user?.email || "User"}
                </p>
                <p className="truncate text-xs text-brand-blue-200/80 sm:text-sm">
                  {user?.email || ""}
                </p>
              </div>
              <button
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded p-2 hover:bg-brand-blue-900/60"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex min-h-[48px] items-center space-x-3 rounded-lg px-4 py-3 transition-colors",
                      isActive
                        ? "bg-white text-brand-blue-700 shadow-md shadow-brand-green-500/30"
                        : "text-brand-blue-100/80 hover:bg-brand-blue-900/60 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6",
                        isActive
                          ? "text-brand-blue-700"
                          : "text-brand-blue-200 group-hover:text-white"
                      )}
                    />
                    <span className="text-sm font-medium sm:text-base">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-1 text-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-blue-200/80">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={onClose}
                    className="group flex min-h-[48px] items-center space-x-3 rounded-lg px-4 py-3 text-brand-blue-100/80 transition-colors hover:bg-brand-blue-900/60 hover:text-white"
                  >
                    <action.icon className="h-5 w-5 text-brand-green-300 group-hover:text-white sm:h-6 sm:w-6" />
                    <span className="text-sm font-medium sm:text-base">
                      {action.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-brand-blue-900/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-brand-green-400"></div>
                <span className="text-xs text-brand-blue-200/80">Online</span>
              </div>
              <span className="text-xs text-brand-blue-200/80">v1.0.0</span>
            </div>
            <button
              onClick={handleSignOut}
              className="group flex min-h-[48px] w-full items-center space-x-3 rounded-lg px-4 py-3 text-brand-blue-100/80 transition-colors hover:bg-brand-blue-900/60 hover:text-white"
            >
              <LogOut className="h-5 w-5 text-brand-blue-200 group-hover:text-white sm:h-6 sm:w-6" />
              <span className="text-sm font-medium sm:text-base">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
