"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { User, Search, Shield, ShieldOff, Trash2, Edit } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  kyc_status: string;
  is_platform_admin: boolean;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (page = 1, searchTerm = search, role = selectedRole) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (role !== "all") {
        params.append("is_admin", role === "admin" ? "true" : "false");
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers(1, search, selectedRole);
  };

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      setActionLoading(userId);
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, is_platform_admin: makeAdmin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user");
      }

      await fetchUsers(pagination?.page || 1, search, selectedRole);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }

      await fetchUsers(pagination?.page || 1, search, selectedRole);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage platform users, permissions, and access</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                fetchUsers(1, search, e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
            </select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {user.is_platform_admin && (
                            <Badge variant="success">Admin</Badge>
                          )}
                          <Badge variant={user.kyc_status === "approved" ? "success" : "warning"}>
                            {user.kyc_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.is_platform_admin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, false)}
                              disabled={actionLoading === user.id}
                            >
                              <ShieldOff className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, true)}
                              disabled={actionLoading === user.id}
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={actionLoading === user.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUsers(pagination.page - 1, search, selectedRole)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchUsers(pagination.page + 1, search, selectedRole)}
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

