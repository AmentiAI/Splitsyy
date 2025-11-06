"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { FileText, Search } from "lucide-react";

interface AuditLog {
  id: string;
  log_type: "admin_action" | "audit_log";
  action_type?: string;
  action?: string;
  resource_type?: string;
  admin?: { id: string; email: string; name: string };
  user?: { id: string; email: string; name: string };
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (page = 1, type = searchType, user = userId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (type) {
        params.append("type", type);
      }

      if (user) {
        params.append("userId", user);
      }

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs(1, searchType, userId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadge = (log: AuditLog) => {
    const action = log.action_type || log.action || "unknown";
    const variantMap: Record<string, "default" | "danger" | "warning" | "success" | "info"> = {
      kill_switch_toggle: "danger",
      user_delete: "danger",
      user_promote: "warning",
      user_demote: "warning",
      login: "info",
      logout: "info",
      register: "success",
    };

    return (
      <Badge variant={variantMap[action] || "default"}>
        {action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>View all platform actions and admin activities</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="User ID (optional)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="kill_switch_toggle">Kill Switch</option>
              <option value="user_promote">User Promote</option>
              <option value="user_demote">User Demote</option>
              <option value="user_delete">User Delete</option>
              <option value="user_update">User Update</option>
              <option value="system_setting_update">System Setting</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="register">Registration</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No logs found</div>
        ) : (
          <>
            <div className="space-y-3">
              {logs.map((log) => {
                const user = log.admin || log.user;
                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getActionBadge(log)}
                          <span className="text-sm text-gray-500">
                            {log.log_type === "admin_action" ? "Admin Action" : "Audit Log"}
                          </span>
                        </div>
                        {user && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>User:</strong> {user.name} ({user.email})
                          </div>
                        )}
                        {log.resource_type && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>Resource:</strong> {log.resource_type}
                          </div>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded mt-2 font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                        {log.ip_address && (
                          <div className="text-xs text-gray-500 mt-2">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.page - 1, searchType, userId)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(pagination.page + 1, searchType, userId)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

